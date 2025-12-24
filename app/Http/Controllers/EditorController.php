<?php

namespace App\Http\Controllers;

use App\Models\Area;
use App\Models\Link;
use App\Models\Scene;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Jobs\ProcessSceneImage;

use App\Services\DraftService;
use App\Services\PublishService;
use App\Models\Drafts\AreaDraft;
use App\Models\Drafts\SceneDraft;
use App\Models\Drafts\LinkDraft;

class EditorController extends Controller
{
    protected $draftService;
    protected $publishService;

    public function __construct(DraftService $draftService, PublishService $publishService)
    {
        $this->draftService = $draftService;
        $this->publishService = $publishService;
    }

    public function index(Request $request)
    {
        // 1. Initialize Drafts (Sync Check logic)
        // Ensure all Live Roots have Draft Counterparts
        $liveRoots = Area::whereNull('parent_id')->get();
        foreach ($liveRoots as $liveRoot) {
            $this->draftService->initDrafts($liveRoot);
        }

        // 2. Load Draft Hierarchy
        // We load full tree: Roots -> Children -> Scenes
        $roots = AreaDraft::whereNull('parent_id')
            ->where('marked_for_deletion', false)
            ->with(['children.children', 'scenes', 'children.scenes', 'children.children.scenes'])
            ->orderBy('priority')
            ->orderBy('name')
            ->get();

        $hierarchy = $roots->map(fn($root) => $this->formatAreaDraftNode($root));

        // 3. Get Modified Item IDs for UI Status Labels
        $modifiedNodes = [
            'areas' => [],
            'scenes' => []
        ];

        foreach ($roots as $root) {
            $changesResponse = $this->draftService->getPendingChanges($root);
            $changes = $changesResponse['changes'] ?? []; // Access inner array if formatted
            // Note: formatDiffForFrontend keys are 'Area', 'Scene', 'Link'
            // The content of each is a list of change objects with ['id' => draftId, 'event' => 'updated'|'created'|'deleted']

            if (isset($changes['Area'])) {
                foreach ($changes['Area'] as $change) {
                    if ($change['event'] === 'updated') {
                        $modifiedNodes['areas'][] = $change['id'];
                    }
                }
            }
            if (isset($changes['Scene'])) {
                foreach ($changes['Scene'] as $change) {
                    if ($change['event'] === 'updated') {
                        $modifiedNodes['scenes'][] = $change['id'];
                    }
                }
            }
        }

        return Inertia::render('Editor/VisualEditor', [
            'hierarchy' => $hierarchy,
            'focusedAreaId' => $request->query('focus'),
            'modifiedNodes' => $modifiedNodes, // Pass to frontend
        ]);
    }

    // Helper: Recursive format
    private function formatAreaDraftNode(AreaDraft $draft)
    {
        return [
            'id' => $draft->id,
            'published_id' => $draft->published_id,
            'name' => $draft->name,
            'level' => $draft->level,
            'is_container' => (bool) $draft->is_container,
            'type' => 'area',
            'is_restricted' => (bool) $draft->is_restricted,
            'priority' => $draft->priority,
            'parent_id' => $draft->parent_id,
            'status' => 'draft', // Identify as draft
            'marked_for_deletion' => (bool) $draft->marked_for_deletion,
            'children' => $draft->children
                ->filter(fn($c) => !$c->marked_for_deletion)
                ->map(fn($child) => $this->formatAreaDraftNode($child))
                ->values(),
            'scenes' => $draft->scenes
                ->filter(fn($s) => !$s->marked_for_deletion)
                ->map(fn($scene) => [
                    'id' => $scene->id,
                    'published_id' => $scene->published_id,
                    'name' => $scene->name,
                    'type' => 'scene',
                    'path' => asset('storage/' . $scene->image_path),
                    'image_url' => asset('storage/' . $scene->image_path), // Added for consistency
                    'marked_for_deletion' => (bool) $scene->marked_for_deletion,
                    'can_be_gateway' => (bool) $scene->can_be_gateway,
                ])->values(),
            'scenes_count' => $draft->scenes->filter(fn($s) => !$s->marked_for_deletion)->count(),
        ];
    }

    public function createSubArea(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:area_drafts,id',
            'level' => 'sometimes|integer',
            'is_container' => 'boolean',
            'priority' => 'integer',
        ]);

        $parentId = $validated['parent_id'] ?? null;
        $level = 1; // Default to Level 1 (Root)
        if ($parentId) {
            $parent = AreaDraft::find($parentId);
            if ($parent)
                $level = $parent->level + 1;
        }

        $area = AreaDraft::create([
            'name' => $validated['name'],
            'parent_id' => $parentId,
            'level' => $request->level ?? $level,
            'is_container' => $validated['is_container'] ?? false,
            'priority' => $validated['priority'] ?? 0,
            'published_id' => null, // Is New
        ]);

        return response()->json([
            'success' => true,
            'area' => $this->formatAreaDraftNode($area),
            'sub_area' => $this->formatAreaDraftNode($area)
        ]);
    }

    public function updateArea(Request $request, $id)
    {
        $area = AreaDraft::findOrFail($id);
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'is_restricted' => 'sometimes|boolean',
            'priority' => 'sometimes|integer',
        ]);
        $area->update($validated);
        return response()->json(['success' => true, 'area' => $this->formatAreaDraftNode($area)]);
    }

    public function destroyArea($id)
    {
        $area = AreaDraft::findOrFail($id);
        $this->draftService->markForDeletion($area);
        return response()->json(['success' => true]);
    }

    public function getDeletionImpact($id)
    {
        $area = AreaDraft::with(['children', 'scenes'])->findOrFail($id);

        // Recursive count helper
        $count = ['areas' => 0, 'scenes' => 0];
        $this->countImpact($area, $count);

        // Subtract 1 from areas (the area itself)
        $count['areas'] = max(0, $count['areas'] - 1);

        return response()->json($count);
    }

    private function countImpact($area, &$count)
    {
        $count['areas']++;
        $count['scenes'] += $area->scenes()->count();
        foreach ($area->children as $child) {
            $this->countImpact($child, $count);
        }
    }

    public function showArea($id)
    {
        $area = AreaDraft::findOrFail($id);
        $area->load('scenes');
        return response()->json([
            'area' => $this->formatAreaDraftNode($area),
            'scenes' => $area->scenes->map(fn($scene) => [
                'id' => $scene->id,
                'published_id' => $scene->published_id,
                'name' => $scene->name,
                'type' => 'scene',
                'is_restricted' => (bool) $scene->can_be_gateway,
                'can_be_gateway' => (bool) $scene->can_be_gateway, // Explicitly needed by frontend
                'path' => asset('storage/' . $scene->image_path),
                'marked_for_deletion' => (bool) $scene->marked_for_deletion,
            ])
        ]);
    }

    public function bulkUploadScenes(Request $request)
    {
        $request->validate([
            'area_id' => 'required|exists:area_drafts,id',
            'images.*' => 'required|image|mimes:jpeg,png,jpg|max:51200',
        ]);

        $areaId = $request->input('area_id');
        $uploadedScenes = [];

        DB::beginTransaction();
        try {
            foreach ($request->file('images') as $file) {
                // Store file
                $filename = 'pano_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('panoramas', $filename, 'public');
                $fullPath = storage_path('app/public/' . $path);

                // Extract metadata
                $lat = 0;
                $lng = 0;
                $heading = 0;

                if (function_exists('exif_read_data') && @exif_imagetype($fullPath) !== false) {
                    try {
                        $exif = @exif_read_data($fullPath);
                        if ($exif && is_array($exif)) {
                            if (isset($exif['GPSLatitude'], $exif['GPSLatitudeRef'], $exif['GPSLongitude'])) {
                                $lat = $this->getGps($exif['GPSLatitude'], $exif['GPSLatitudeRef']);
                                $lng = $this->getGps($exif['GPSLongitude'], $exif['GPSLongitudeRef']);
                            }
                        }
                    } catch (\Exception $e) {
                    }
                }

                // Create Draft Scene
                $scene = SceneDraft::create([
                    'area_id' => $areaId,
                    'image_path' => $path,
                    'name' => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
                    'heading' => $heading,
                    'lat' => $lat != 0 ? $lat : null,
                    'lng' => $lng != 0 ? $lng : null,
                    'published_id' => null
                ]);

                $uploadedScenes[] = $scene;

                // Dispatch Job to optimize image (Resize/WebP)
                // ASYNC MODE: Returns immediately (fast)
                // Job will update DB from .jpg to .webp later
                ProcessSceneImage::dispatch($scene);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => count($uploadedScenes) . ' scenes uploaded successfully',
                'scenes' => collect($uploadedScenes)->map(fn($scene) => [
                    'id' => $scene->id,
                    'name' => $scene->name,
                    'type' => 'scene',
                    'path' => asset('storage/' . $scene->image_path),
                ])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function updateScene(Request $request, $id)
    {
        $scene = SceneDraft::findOrFail($id);
        $validated = $request->validate([
            'name' => 'sometimes|string',
            'heading' => 'sometimes|numeric',
            'can_be_gateway' => 'sometimes|boolean',
            'lat' => 'sometimes|numeric',
            'lng' => 'sometimes|numeric'
        ]);
        $scene->update($validated);
        return response()->json(['success' => true]);
    }

    public function destroyScene($id)
    {
        $scene = SceneDraft::findOrFail($id);
        $this->draftService->markForDeletion($scene);
        return response()->json(['success' => true]);
    }

    public function createLink(Request $request, $sceneId)
    {
        $request->validate([
            'target_id' => 'required|exists:scene_drafts,id',
            'yaw' => 'required|numeric',
            'pitch' => 'required|numeric',
            'type' => 'required|in:navigasi,gateway',
        ]);

        $source = SceneDraft::findOrFail($sceneId);
        $target = SceneDraft::findOrFail($request->target_id);

        if ($source->id === $target->id) {
            return response()->json(['success' => false, 'message' => 'Cannot link to self'], 400);
        }

        // Calculate Distance if possible
        $distance = 0;
        if ($source->lat && $source->lng && $target->lat && $target->lng) {
            $distance = $this->calculateDistance($source->lat, $source->lng, $target->lat, $target->lng);
        }

        LinkDraft::create([
            'source_scene_id' => $source->id,
            'target_scene_id' => $target->id,
            'type' => $request->type,
            'yaw' => $request->yaw,
            'pitch' => $request->pitch,
            'distance' => $distance
        ]);

        return response()->json([
            'success' => true,
            'scene' => $this->showScene($sceneId)->original // Reuse showScene to return full packet
        ]);
    }

    public function updateLink(Request $request, $sceneId, $linkId)
    {
        $link = LinkDraft::where('source_scene_id', $sceneId)->findOrFail($linkId);
        $link->update($request->only(['yaw', 'pitch', 'type'])); // Removed distance update from manual edit

        return response()->json([
            'success' => true,
            'scene' => $this->showScene($sceneId)->original
        ]);
    }

    public function deleteLink($sceneId, $linkId)
    {
        $link = LinkDraft::where('source_scene_id', $sceneId)->findOrFail($linkId);

        if ($link->published_id) {
            $link->update(['marked_for_deletion' => true]);
        } else {
            $link->delete();
        }

        return response()->json([
            'success' => true,
            'scene' => $this->showScene($sceneId)->original
        ]);
    }

    public function getPendingChanges()
    {
        $roots = AreaDraft::whereNull('parent_id')->get();
        $totalChanges = [];

        foreach ($roots as $root) {
            $report = $this->draftService->getPendingChanges($root);
            foreach ($report['changes'] as $type => $items) {
                if (!isset($totalChanges[$type]))
                    $totalChanges[$type] = [];
                $totalChanges[$type] = array_merge($totalChanges[$type], $items);
            }
        }

        // Calculate Summary
        $summary = [
            'total_changes' => count($totalChanges['Area'] ?? []) + count($totalChanges['Scene'] ?? []) + count($totalChanges['Link'] ?? []),
            'areas_count' => count($totalChanges['Area'] ?? []),
            'scenes_count' => count($totalChanges['Scene'] ?? []),
            'links_count' => count($totalChanges['Link'] ?? []),
            'oldest_change' => now(),
        ];

        return response()->json([
            'summary' => $summary,
            'changes' => $totalChanges,
        ]);
    }

    public function discardDrafts($rootDraftId)
    {
        // OLD: Discard single root
        // $root = AreaDraft::whereNull('parent_id')->findOrFail($rootDraftId);
        // $this->draftService->discardDrafts($root);

        // NEW: Discard ALL drafts (Reset World)
        $this->draftService->discardAllDrafts();

        return response()->json(['success' => true]);
    }

    public function publishAll()
    {
        try {
            $roots = AreaDraft::whereNull('parent_id')->get();
            $count = 0;
            foreach ($roots as $root) {
                $this->publishService->publish($root, auth()->user());
                $count++;
            }
            return response()->json([
                'success' => true,
                'message' => "Successfully published $count area trees.",
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Publish Failed: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Publish failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function reorderNode(Request $request, $type, $id)
    {
        $request->validate([
            'new_index' => 'required|integer|min:0'
        ]);
        $newIndex = $request->new_index;

        DB::beginTransaction();
        try {
            if ($type === 'area') {
                $item = AreaDraft::findOrFail($id);
                // Get siblings ordered by priority (asc)
                // Filter out marked_for_deletion to keep clean list
                $siblings = AreaDraft::where('parent_id', $item->parent_id)
                    ->where('marked_for_deletion', false)
                    ->where('id', '!=', $item->id)
                    ->orderBy('priority')
                    ->get();
            } else if ($type === 'scene') {
                $item = SceneDraft::findOrFail($id);
                $siblings = SceneDraft::where('area_id', $item->area_id)
                    ->where('marked_for_deletion', false)
                    ->where('id', '!=', $item->id)
                    ->orderBy('priority') // Assume scene drafts also have priority or we use ID order if missing
                    ->get();
            } else {
                return response()->json(['error' => 'Invalid type'], 400);
            }

            // Insert item at new index within the collection
            $siblings->splice($newIndex, 0, [$item]);

            // Reassign priority
            foreach ($siblings as $index => $sibling) {
                // Determine priority value (e.g. increments of 10)
                // Using input loop index is simplest.
                $sibling->priority = ($index + 1) * 10;
                $sibling->save();
            }

            DB::commit();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function autoLinkExecute(Request $request)
    {
        $areaId = $request->input('area_id');
        $replaceExisting = $request->boolean('replace_existing');
        $previewOnly = $request->boolean('preview_only');
        $radius = $request->input('radius', 50); // Default 50m

        // 1. Fetch Candidates (Draft Scenes)
        // 1. Fetch Candidates (Draft Scenes)
        $query = SceneDraft::query()
            ->whereNotNull('lat')
            ->whereNotNull('lng')
            ->where('marked_for_deletion', false)
            ->whereHas('area', fn($q) => $q->where('marked_for_deletion', false));

        if ($areaId) {
            // Get all descendant scene IDs
            $root = AreaDraft::find($areaId);
            if (!$root)
                return response()->json(['error' => 'Area not found'], 404);

            // Helper to get recursive IDs
            $areaIds = $this->getDescendantAreaIds($root);
            $query->whereIn('area_id', $areaIds);
        }

        $scenes = $query->get();

        // Stats
        $stats = [
            'existing_links' => 0,
            'target_areas' => [],
            'scenes_without_gps' => SceneDraft::whereNull('lat')->orWhereNull('lng')->count(), // Global or scoped? simplistic count
            'gateway_scenes' => $scenes->where('can_be_gateway', true)->count(),
            'total_scenes' => $scenes->count(),
            'deleted_links' => 0,
            'total_created' => 0,
            'navigation_links' => 0,
            'gateway_links' => 0,
        ];

        // Group by Area for stats
        $stats['target_areas'] = $scenes->groupBy('area_id')->map(function ($group) {
            return [
                'id' => $group->first()->area_id,
                'name' => $group->first()->area->name ?? 'Unknown',
                'scene_count' => $group->count()
            ];
        })->values()->toArray();

        // Count existing links in scope
        $sceneIds = $scenes->pluck('id');
        $existingLinks = LinkDraft::whereIn('source_scene_id', $sceneIds)
            ->where('marked_for_deletion', false)
            ->count();
        $stats['existing_links'] = $existingLinks;

        if ($previewOnly) {
            return response()->json($stats);
        }

        // EXECUTION
        DB::beginTransaction();
        try {
            if ($replaceExisting) {
                // Dual-Entity Delete Logic
                $oldLinks = LinkDraft::whereIn('source_scene_id', $sceneIds)
                    ->where('marked_for_deletion', false) // Only delete active links
                    ->get();

                $deletedCount = 0;
                foreach ($oldLinks as $link) {
                    if ($link->published_id) {
                        $link->update(['marked_for_deletion' => true]);
                    } else {
                        $link->delete();
                    }
                    $deletedCount++;
                }
                $stats['deleted_links'] = $deletedCount;
            }

            $createdCount = 0;
            $navCount = 0;
            $gatewayCount = 0;

            foreach ($scenes as $source) {
                foreach ($scenes as $target) {
                    if ($source->id === $target->id)
                        continue;

                    // Distance Calc (Haversine)
                    $dist = $this->calculateDistance($source->lat, $source->lng, $target->lat, $target->lng);

                    if ($dist <= $radius) {
                        // Determine Type
                        $type = ($source->area_id === $target->area_id) ? 'navigasi' : 'gateway';

                        // Check Gateway Logic
                        if ($type === 'gateway') {
                            if (!$source->can_be_gateway || !$target->can_be_gateway) {
                                continue;
                            }
                        }

                        // Check if link exists (if not replacing)
                        if (!$replaceExisting) {
                            $exists = LinkDraft::where('source_scene_id', $source->id)
                                ->where('target_scene_id', $target->id)
                                ->where('marked_for_deletion', false)
                                ->exists();
                            if ($exists)
                                continue;
                        }

                        // Calculate Yaw (Bearing)
                        $yaw = $this->calculateBearing($source->lat, $source->lng, $target->lat, $target->lng);
                        // Yaw needs adjustment relative to North? Marzipano uses radians.
                        // calculateBearing returns degrees. Convert to Radians.
                        // Marzipano 0 is North? No, usually 0 is center of image.
                        // We must assume image heading (North Offset) is handled.
                        // Draft model has 'heading'.
                        // True Heading = Image Heading + View Yaw.
                        // Desired View Yaw = Target Bearing - Source Image Heading.
                        $bearing = deg2rad($this->calculateBearing($source->lat, $source->lng, $target->lat, $target->lng));

                        // Normalized Yaw (relative to image center 0)
                        $sourceHeading = deg2rad($source->heading ?? 0);
                        $relativeYaw = $bearing - $sourceHeading;

                        LinkDraft::create([
                            'source_scene_id' => $source->id,
                            'target_scene_id' => $target->id,
                            'type' => $type,
                            'yaw' => $relativeYaw,
                            'pitch' => 0,
                            'distance' => $dist
                        ]);

                        $createdCount++;
                        if ($type === 'navigasi')
                            $navCount++;
                        else
                            $gatewayCount++;
                    }
                }
            }

            $stats['total_created'] = $createdCount;
            $stats['navigation_links'] = $navCount;
            $stats['gateway_links'] = $gatewayCount;

            DB::commit();
            return response()->json($stats);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    private function getDescendantAreaIds($area)
    {
        $ids = [$area->id];
        foreach ($area->children as $child) {
            $ids = array_merge($ids, $this->getDescendantAreaIds($child));
        }
        return $ids;
    }

    private function calculateDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371000; // meters
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLon / 2) * sin($dLon / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        return $earthRadius * $c;
    }

    private function calculateBearing($lat1, $lon1, $lat2, $lon2)
    {
        $dLon = deg2rad($lon2 - $lon1);
        $y = sin($dLon) * cos(deg2rad($lat2));
        $x = cos(deg2rad($lat1)) * sin(deg2rad($lat2)) -
            sin(deg2rad($lat1)) * cos(deg2rad($lat2)) * cos($dLon);
        return fmod(rad2deg(atan2($y, $x)) + 360, 360);
    }

    // --- HELPERS ---

    private function getGps($exifCoord, $hemi)
    {
        $degrees = count($exifCoord) > 0 ? $this->gps2Num($exifCoord[0]) : 0;
        $minutes = count($exifCoord) > 1 ? $this->gps2Num($exifCoord[1]) : 0;
        $seconds = count($exifCoord) > 2 ? $this->gps2Num($exifCoord[2]) : 0;
        $flip = ($hemi == 'W' || $hemi == 'S') ? -1 : 1;
        return $flip * ($degrees + $minutes / 60 + $seconds / 3600);
    }

    private function gps2Num($coordPart)
    {
        $parts = explode('/', $coordPart);
        if (count($parts) <= 0)
            return 0;
        if (count($parts) == 1)
            return $parts[0];
        return floatval($parts[0]) / floatval($parts[1]);
    }

    public function showScene($id)
    {
        $scene = SceneDraft::findOrFail($id);
        $links = LinkDraft::where('source_scene_id', $id)
            ->where('marked_for_deletion', false)
            ->with(['targetScene'])
            ->get();

        return response()->json([
            'id' => $scene->id,
            'name' => $scene->name,
            'image_path' => $scene->image_path,
            'image_url' => asset('storage/' . $scene->image_path),
            'heading' => $scene->heading,
            'lat' => $scene->lat,
            'lng' => $scene->lng,
            'can_be_gateway' => (bool) $scene->can_be_gateway,
            'links' => $links->map(fn($l) => [
                'id' => $l->id,
                'target_scene_id' => $l->target_scene_id,
                'yaw' => $l->yaw,
                'pitch' => $l->pitch,
                'type' => $l->type,
                'distance' => $l->distance,
                'target_name' => $l->targetScene->name ?? 'Unknown',
            ])
        ]);
    }

}
