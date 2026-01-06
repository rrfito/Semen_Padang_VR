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
use App\Services\GeoService;
use App\Services\AutoLinkService;
use App\Services\SceneImageService;

class EditorController extends Controller
{
    protected $draftService;
    protected $publishService;
    protected $geoService;
    protected $autoLinkService;
    protected $sceneImageService;

    public function __construct(
        DraftService $draftService,
        PublishService $publishService,
        GeoService $geoService,
        AutoLinkService $autoLinkService,
        SceneImageService $sceneImageService
    ) {
        $this->draftService = $draftService;
        $this->publishService = $publishService;
        $this->geoService = $geoService;
        $this->autoLinkService = $autoLinkService;
        $this->sceneImageService = $sceneImageService;
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
            ->with([
                'children.children',
                'scenes.links.targetScene',
                'children.scenes.links.targetScene',
                'children.children.scenes.links.targetScene'
            ])
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
            'description' => $draft->description,
            'level' => $draft->level,
            'is_container' => (bool) $draft->is_container,
            'type' => 'area',
            'is_restricted' => (bool) $draft->is_restricted,
            'is_hidden' => (bool) $draft->is_hidden,
            'priority' => $draft->priority,
            'parent_id' => $draft->parent_id,
            'status' => 'draft', // Identify as draft
            'marked_for_deletion' => (bool) $draft->marked_for_deletion,
            'lat' => $draft->lat,
            'lng' => $draft->lng,
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
                    'heading' => $scene->heading ?? 0,
                    'pitch' => $scene->pitch ?? 0,
                    'lat' => $scene->lat,
                    'lng' => $scene->lng,
                    'links' => $scene->links->filter(fn($l) => !$l->marked_for_deletion)->map(fn($link) => [
                        'id' => $link->id,
                        'target_scene_id' => $link->target_scene_id,
                        'target_name' => $link->targetScene->name ?? 'Unknown Scene',
                        'yaw' => $link->yaw,
                        'pitch' => $link->pitch,
                        'type' => $link->type, // 'navigasi' or 'gateway'
                    ])->values(),
                ])->values(),
            'scenes_count' => $draft->scenes->filter(fn($s) => !$s->marked_for_deletion)->count(),
        ];
    }

    public function createSubArea(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
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
            'description' => $validated['description'] ?? null,
            'parent_id' => $parentId,
            'level' => $request->level ?? $level,
            'is_container' => $validated['is_container'] ?? false,
            'priority' => $validated['priority'] ?? 0,
            'published_id' => null, // Is New
        ]);

        $this->draftService->markDirty($area);

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
            'is_hidden' => 'sometimes|boolean',
            'priority' => 'sometimes|integer',
        ]);
        $area->update($validated);
        $this->draftService->markDirty($area);
        return response()->json(['success' => true, 'area' => $this->formatAreaDraftNode($area)]);
    }

    public function destroyArea($id)
    {
        $area = AreaDraft::findOrFail($id);
        $this->draftService->markForDeletion($area);
        $this->draftService->markDirty($area);
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

        DB::beginTransaction();
        try {
            // Delegate logic to Service
            $uploadedScenes = $this->sceneImageService->processUploads($request->file('images'), $areaId);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => count($uploadedScenes) . ' scenes uploaded successfully',
                'scenes' => collect($uploadedScenes)->map(fn($scene) => [
                    'id' => $scene->id,
                    'published_id' => $scene->published_id,
                    'name' => $scene->name,
                    'type' => 'scene',
                    'is_restricted' => (bool) $scene->can_be_gateway,
                    'can_be_gateway' => (bool) $scene->can_be_gateway, // Explicitly needed by frontend
                    'path' => asset('storage/' . $scene->image_path),
                    'image_url' => asset('storage/' . $scene->image_path),
                    'marked_for_deletion' => (bool) $scene->marked_for_deletion,
                    'heading' => $scene->heading ?? 0,
                    'pitch' => $scene->pitch ?? 0,
                    'lat' => $scene->lat,
                    'lng' => $scene->lng,
                    'links' => [], // New scenes have no links
                ])
            ]);

            // Mark root as dirty (since scenes added)
            // (Assumes service created SceneDrafts)
            if (!empty($uploadedScenes)) {
                $this->draftService->markDirty($uploadedScenes[0]);
            }

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
        $this->draftService->markDirty($scene);
        return response()->json(['success' => true]);
    }

    public function destroyScene($id)
    {
        $scene = SceneDraft::findOrFail($id);
        $this->draftService->markForDeletion($scene);
        $this->draftService->markDirty($scene);
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
            $distance = $this->geoService->calculateDistance($source->lat, $source->lng, $target->lat, $target->lng);
        }

        $link = LinkDraft::create([
            'source_scene_id' => $source->id,
            'target_scene_id' => $target->id,
            'type' => $request->type,
            'yaw' => $request->yaw,
            'pitch' => $request->pitch,
            'distance' => $distance
        ]);

        $this->draftService->markDirty($link);

        return response()->json([
            'success' => true,
            'scene' => $this->showScene($sceneId)->original // Reuse showScene to return full packet
        ]);
    }

    public function updateLink(Request $request, $sceneId, $linkId)
    {
        $link = LinkDraft::where('source_scene_id', $sceneId)->findOrFail($linkId);
        $link->update($request->only(['yaw', 'pitch', 'type'])); // Removed distance update from manual edit
        $this->draftService->markDirty($link);

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

        $this->draftService->markDirty($link);

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

        try {
            $stats = $this->autoLinkService->execute($areaId, $replaceExisting, $previewOnly, $radius);
            return response()->json($stats);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
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
