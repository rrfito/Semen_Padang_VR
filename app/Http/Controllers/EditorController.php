<?php

namespace App\Http\Controllers;

use App\Models\Area;
use App\Models\Link;
use App\Models\Scene;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Jobs\ProcessSceneImage;

use App\Services\DraftService;
use App\Services\PublishService;
use App\Models\Drafts\AreaDraft;
use App\Models\Drafts\SceneDraft;
use App\Models\Drafts\LinkDraft;
use App\Models\Drafts\InfoSpotDraft;
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
        $user = Auth::user();

        $liveRoots = Area::whereNull('parent_id')->get();
        foreach ($liveRoots as $liveRoot) {
            $this->draftService->initDrafts($liveRoot);
        }

        // Build query - super-admin sees all, regular admin sees owned + unassigned
        $query = AreaDraft::whereNull('parent_id')
            ->where('marked_for_deletion', false)
            ->with([
                'children.children',
                'scenes.links.targetScene',
                'children.scenes.links.targetScene',
                'children.children.scenes.links.targetScene',
                'creator'
            ]);

        // Filter by ownership for non-super-admin
        if (!$user->isSuperAdmin()) {
            $query->where(function ($q) use ($user) {
                $q->where('created_by', $user->id)
                    ->orWhereNull('created_by');
            });
        }

        $roots = $query->orderBy('priority')->orderBy('name')->get();

        $hierarchy = $roots->map(fn($root) => $this->formatAreaDraftNode($root));


        $modifiedNodes = [
            'areas' => [],
            'scenes' => []
        ];

        foreach ($roots as $root) {
            $changesResponse = $this->draftService->getPendingChanges($root);
            $changes = $changesResponse['changes'] ?? [];

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
            'modifiedNodes' => $modifiedNodes,
        ]);
    }

    private function formatAreaDraftNode(AreaDraft $draft)
    {
        $user = Auth::user();

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
            'status' => 'draft',
            'marked_for_deletion' => (bool) $draft->marked_for_deletion,
            'lat' => $draft->lat,
            'lng' => $draft->lng,
            'created_by' => $draft->created_by,
            // Only show owner name for super-admin (regular admins only see their own areas)
            'creator_name' => ($user && $user->isSuperAdmin() && $draft->level === 1)
                ? ($draft->creator->name ?? null)
                : null,
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
                    'image_url' => asset('storage/' . $scene->image_path),
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
                        'type' => $link->type,
                    ])->values(),
                ])->values(),
            'scenes_count' => $draft->scenes->filter(fn($s) => !$s->marked_for_deletion)->count(),
        ];
    }

    public function createSubArea(Request $request)
    {
        $this->authorize('create', AreaDraft::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:area_drafts,id',
            'level' => 'sometimes|integer',
            'is_container' => 'boolean',
            'priority' => 'integer',
        ]);

        $parentId = $validated['parent_id'] ?? null;
        $level = 1;
        $createdBy = null;

        if ($parentId) {
            $parent = AreaDraft::find($parentId);
            if ($parent) {
                $level = $parent->level + 1;
                // Authorize: must have access to parent
                $this->authorize('update', $parent);
            }
        } else {
            // Creating root area (level 1) - set current user as owner
            $createdBy = Auth::id();
        }

        $area = AreaDraft::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'parent_id' => $parentId,
            'level' => $request->level ?? $level,
            'is_container' => $validated['is_container'] ?? false,
            'priority' => $validated['priority'] ?? 0,
            'published_id' => null,
            'created_by' => $createdBy,
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

        // Authorization: check ownership via root area
        $rootArea = $area->getRootArea();
        $this->authorize('update', $rootArea);

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

        // Authorization: check delete permission via root area
        $rootArea = $area->getRootArea();
        $this->authorize('delete', $rootArea);

        $this->draftService->markForDeletion($area);
        $this->draftService->markDirty($area);
        return response()->json(['success' => true]);
    }

    public function getDeletionImpact($id)
    {
        $area = AreaDraft::with(['children', 'scenes'])->findOrFail($id);

        $count = ['areas' => 0, 'scenes' => 0];
        $this->countImpact($area, $count);

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
                'can_be_gateway' => (bool) $scene->can_be_gateway,
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
                    'can_be_gateway' => (bool) $scene->can_be_gateway,
                    'path' => asset('storage/' . $scene->image_path),
                    'image_url' => asset('storage/' . $scene->image_path),
                    'marked_for_deletion' => (bool) $scene->marked_for_deletion,
                    'heading' => $scene->heading ?? 0,
                    'pitch' => $scene->pitch ?? 0,
                    'lat' => $scene->lat,
                    'lng' => $scene->lng,
                    'links' => [],
                ])
            ]);


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
            'scene' => $this->showScene($sceneId)->original
        ]);
    }

    public function updateLink(Request $request, $sceneId, $linkId)
    {
        $link = LinkDraft::where('source_scene_id', $sceneId)->findOrFail($linkId);
        $link->update($request->only(['yaw', 'pitch', 'type']));
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



    public function createInfoSpot(Request $request, $sceneId)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'yaw' => 'required|numeric',
            'pitch' => 'required|numeric',
        ]);

        $scene = SceneDraft::findOrFail($sceneId);


        $title = strip_tags($validated['title']);
        $description = isset($validated['description']) ? strip_tags($validated['description']) : null;

        $infoSpot = InfoSpotDraft::create([
            'scene_id' => $scene->id,
            'title' => $title,
            'description' => $description,
            'yaw' => $validated['yaw'],
            'pitch' => $validated['pitch'],
        ]);

        $this->draftService->markDirty($infoSpot);

        return response()->json([
            'success' => true,
            'scene' => $this->showScene($sceneId)->original
        ]);
    }

    public function updateInfoSpot(Request $request, $sceneId, $infoSpotId)
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:2000',
            'yaw' => 'sometimes|numeric',
            'pitch' => 'sometimes|numeric',
        ]);

        $infoSpot = InfoSpotDraft::where('scene_id', $sceneId)->findOrFail($infoSpotId);


        if (isset($validated['title'])) {
            $validated['title'] = strip_tags($validated['title']);
        }
        if (isset($validated['description'])) {
            $validated['description'] = strip_tags($validated['description']);
        }

        $infoSpot->update($validated);
        $this->draftService->markDirty($infoSpot);

        return response()->json([
            'success' => true,
            'scene' => $this->showScene($sceneId)->original
        ]);
    }

    public function deleteInfoSpot($sceneId, $infoSpotId)
    {
        $infoSpot = InfoSpotDraft::where('scene_id', $sceneId)->findOrFail($infoSpotId);

        if ($infoSpot->published_id) {
            $infoSpot->update(['marked_for_deletion' => true]);
        } else {
            $infoSpot->delete();
        }

        $this->draftService->markDirty($infoSpot);

        return response()->json([
            'success' => true,
            'scene' => $this->showScene($sceneId)->original
        ]);
    }

    public function getPendingChanges()
    {
        $user = Auth::user();

        // Build query - super-admin sees all, regular admin sees owned + unassigned
        $query = AreaDraft::whereNull('parent_id');

        if (!$user->isSuperAdmin()) {
            $query->where(function ($q) use ($user) {
                $q->where('created_by', $user->id)
                    ->orWhereNull('created_by');
            });
        }

        $roots = $query->get();
        $totalChanges = [];

        foreach ($roots as $root) {
            $report = $this->draftService->getPendingChanges($root);
            foreach ($report['changes'] as $type => $items) {
                if (!isset($totalChanges[$type]))
                    $totalChanges[$type] = [];
                $totalChanges[$type] = array_merge($totalChanges[$type], $items);
            }
        }

        $summary = [
            'total_changes' => count($totalChanges['Area'] ?? []) + count($totalChanges['Scene'] ?? []) + count($totalChanges['Link'] ?? []) + count($totalChanges['InfoSpot'] ?? []),
            'areas_count' => count($totalChanges['Area'] ?? []),
            'scenes_count' => count($totalChanges['Scene'] ?? []),
            'links_count' => count($totalChanges['Link'] ?? []),
            'info_spots_count' => count($totalChanges['InfoSpot'] ?? []),
            'oldest_change' => now(),
        ];

        return response()->json([
            'summary' => $summary,
            'changes' => $totalChanges,
        ]);
    }

    public function discardDrafts($rootDraftId)
    {

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
                    ->orderBy('priority')
                    ->get();
            } else {
                return response()->json(['error' => 'Invalid type'], 400);
            }


            $siblings->splice($newIndex, 0, [$item]);
            foreach ($siblings as $index => $sibling) {
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
        $radius = $request->input('radius', 50);

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

        $infoSpots = InfoSpotDraft::where('scene_id', $id)
            ->where('marked_for_deletion', false)
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
            ]),
            'info_spots' => $infoSpots->map(fn($i) => [
                'id' => $i->id,
                'title' => $i->title,
                'description' => $i->description,
                'yaw' => $i->yaw,
                'pitch' => $i->pitch,
            ])
        ]);
    }

    /**
     * Get all gateway-eligible scenes (no ownership filter).
     * Used by LinkTargetModal for cross-owner gateway linking.
     */
    public function getGatewayScenes()
    {
        $scenes = SceneDraft::whereHas('area', fn($q) => $q->where('marked_for_deletion', false))
            ->where('marked_for_deletion', false)
            ->where('can_be_gateway', true)
            ->with(['area:id,name'])
            ->orderBy('name')
            ->get(['id', 'name', 'area_id']);

        return response()->json($scenes->map(fn($s) => [
            'id' => $s->id,
            'name' => $s->name,
            'area_name' => $s->area->name ?? 'Unknown',
        ]));
    }


    public function showManualBook()
    {
        $path = base_path('docs/manual book.pdf');

        if (!file_exists($path)) {
            abort(404, 'Manual book tidak ditemukan.');
        }

        return response()->file($path, [
            'Content-Type' => 'application/pdf',
        ]);
    }
}
