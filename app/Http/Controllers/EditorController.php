<?php

namespace App\Http\Controllers;

use App\Models\Area;
use App\Models\Link;
use App\Models\Scene;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class EditorController extends Controller
{
    // 0. GLOBAL BOOTSTRAP DATA
    // Returns the tree structure for the sidebar: Areas -> SubAreas -> Scenes (Minimal)
    public function index(Request $request)
    {
        // Redirect legacy route if 'area' param exists
        if ($request->has('area')) {
            return redirect()->route('admin.editor.index', ['focus' => 'area:' . $request->area]);
        }

        // Fetch Global Hierarchy
        // Level 1 Areas (Grandparents)
        $hierarchy = Area::whereNull('parent_id')
            ->orderBy('priority')
            ->with([
                'children' => function ($query) {
                    // Level 2 Areas (Parents)
                    $query->orderBy('priority')
                        ->with([
                            'scenes' => function ($q) {
                        // Scenes in Level 2 (Direct)
                        $q->select('id', 'area_id', 'name', 'image_path', 'is_published', 'can_be_gateway');
                    }
                        ])
                        ->with([
                            'children' => function ($cq) {
                        // Level 3 Areas (Children)
                        $cq->orderBy('priority')
                            ->with([
                                'scenes' => function ($sq) {
                            // Scenes in Level 3
                            $sq->select('id', 'area_id', 'name', 'image_path', 'is_published', 'can_be_gateway');
                        }
                            ]);
                    }
                        ]);
                },
                'scenes' => function ($q) {
                    // Scenes in Level 1 (Direct)
                    $q->select('id', 'area_id', 'name', 'image_path', 'is_published', 'can_be_gateway');
                }
            ])
            ->get()
            ->map(function ($area) {
                return $this->formatAreaNode($area);
            });

        return Inertia::render('Editor/VisualEditor', [
            'hierarchy' => $hierarchy,
        ]);
    }

    // Helper to recursive format
    private function formatAreaNode($area)
    {
        return [
            'id' => $area->id,
            'name' => $area->name,
            'level' => $area->level, // Explicit from DB
            'is_container' => (bool) $area->is_container,
            'type' => 'area', // Tree Node Type
            'lat' => $area->lat,
            'lng' => $area->lng,
            'description' => $area->description,
            'is_restricted' => (bool) $area->is_restricted,
            'priority' => $area->priority,
            'parent_id' => $area->parent_id,
            'children' => $area->children->map(fn($child) => $this->formatAreaNode($child)),
            'scenes' => $area->scenes->map(fn($scene) => [
                'id' => $scene->id,
                'name' => $scene->name,
                'type' => 'scene',

                'url' => $scene->url,
                'url_v' => $scene->url_v,
                'url_h' => $scene->url_h,
                'path' => asset('storage/' . $scene->image_path),
                'is_published' => $scene->is_published,
                'can_be_gateway' => (bool) $scene->can_be_gateway,
            ]),
            'scenes_count' => $area->scenes->count(),
        ];
    }

    // 1. LAZY LOAD SCENE DETAILS
    // Called when user clicks a scene in Sidebar or Grid
    public function sceneDetails(Scene $scene)
    {
        $scene->load(['outgoingLinks.targetScene.area']);

        // Prepare detailed payload
        $details = [
            'id' => $scene->id,
            'area_id' => $scene->area_id,
            'name' => $scene->name,
            'image_url' => asset('storage/' . $scene->image_path),
            'heading' => (float) $scene->heading,
            'lat' => $scene->location_array['lat'] ?? 0,
            'lng' => $scene->location_array['lng'] ?? 0,
            'can_be_gateway' => (bool) $scene->can_be_gateway,
            'is_published' => (bool) $scene->is_published,
            'links' => $scene->outgoingLinks->map(function ($link) {
                return [
                    'id' => $link->id,
                    'target_scene_id' => $link->target_scene_id,
                    'yaw' => (float) $link->yaw,
                    'pitch' => (float) $link->pitch,
                    'type' => $link->type,
                    'target_name' => $link->type === 'gateway'
                        ? ($link->targetScene->area->name ?? 'Unknown Area')
                        : ($link->targetScene->name ?? 'Scene #' . $link->target_scene_id),
                ];
            })
        ];

        return response()->json($details);
    }

    // 1b. CREATE LINK FOR SCENE
    public function createLink(Request $request, Scene $scene)
    {
        $validated = $request->validate([
            'target_id' => 'required|exists:scenes,id',
            'yaw' => 'required|numeric',
            'pitch' => 'nullable|numeric',
            'type' => 'required|in:navigasi,gateway',
        ]);

        // Check if link already exists
        $existing = Link::where('source_scene_id', $scene->id)
            ->where('target_scene_id', $validated['target_id'])
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'A link to this target already exists.'
            ], 422);
        }

        // Create the link
        \Log::info('Creating link with pitch:', [
            'raw_pitch' => $request->input('pitch'),
            'validated_pitch' => $validated['pitch'] ?? 'NULL',
        ]);

        $link = Link::create([
            'source_scene_id' => $scene->id,
            'target_scene_id' => $validated['target_id'],
            'yaw' => $validated['yaw'],
            'pitch' => $validated['pitch'] ?? 0,
            'type' => $validated['type'],
        ]);

        \Log::info('Link created with pitch:', ['pitch' => $link->pitch]);

        // Reload scene with links
        $scene->load(['outgoingLinks.targetScene.area']);

        return response()->json([
            'success' => true,
            'link' => [
                'id' => $link->id,
                'target_scene_id' => $link->target_scene_id,
                'yaw' => (float) $link->yaw,
                'type' => $link->type,
            ],
            'scene' => [
                'id' => $scene->id,
                'area_id' => $scene->area_id,
                'name' => $scene->name,
                'image_url' => asset('storage/' . $scene->image_path),
                'heading' => (float) $scene->heading,
                'lat' => $scene->location_array['lat'] ?? 0,
                'lng' => $scene->location_array['lng'] ?? 0,
                'can_be_gateway' => (bool) $scene->can_be_gateway,
                'is_published' => (bool) $scene->is_published,
                'links' => $scene->outgoingLinks->map(function ($l) {
                    return [
                        'id' => $l->id,
                        'target_scene_id' => $l->target_scene_id,
                        'yaw' => (float) $l->yaw,
                        'pitch' => (float) $l->pitch,
                        'type' => $l->type,
                        'target_name' => $l->type === 'gateway'
                            ? ($l->targetScene->area->name ?? 'Unknown Area')
                            : ($l->targetScene->name ?? 'Scene #' . $l->target_scene_id),
                    ];
                }),
            ]
        ]);
    }

    // 2. CREATE SUB AREA (Global)
    public function createSubArea(Request $request)
    {
        $validated = $request->validate([
            'parent_id' => 'nullable|exists:areas,id',
            'name' => 'required|string|max:255',
        ]);

        $parentId = $validated['parent_id'];
        $parent = $parentId ? Area::find($parentId) : null;

        // Calculate Level: if parent exists, parent->level + 1, else 1 (Root)
        $level = $parent ? ($parent->level + 1) : 1;

        // Calculate Priority
        $maxPriority = Area::where('parent_id', $parentId)->max('priority') ?? 0;

        $subArea = Area::create([
            'name' => $validated['name'],
            'parent_id' => $parentId,
            'level' => $level,
            'is_container' => $request->is_container ?? ($level < 3),
            'priority' => $maxPriority + 1,
        ]);

        return response()->json(['success' => true, 'sub_area' => $this->formatAreaNode($subArea)]);
    }

    // Update Area Properties
    public function updateArea(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string',
            'priority' => 'sometimes|integer',
            'is_restricted' => 'sometimes|boolean',
            'lat' => 'sometimes|nullable|numeric',
            'lng' => 'sometimes|nullable|numeric',
            'latitude' => 'sometimes|nullable|numeric',  // Support legacy field
            'longitude' => 'sometimes|nullable|numeric', // Support legacy field
        ]);

        $area = Area::findOrFail($id);

        // Handle legacy latitude/longitude field names
        if (isset($validated['latitude'])) {
            $validated['lat'] = $validated['latitude'];
            unset($validated['latitude']);
        }
        if (isset($validated['longitude'])) {
            $validated['lng'] = $validated['longitude'];
            unset($validated['longitude']);
        }

        $area->update($validated);

        return response()->json(['success' => true, 'area' => $this->formatAreaNode($area)]);
    }

    // 3. SAVE / SYNC (Refactored for Global Context)
    // Note: Verification Plan says "Save Changes" is global action. 
    // We will accept a batch of changes regardless of area.
    public function sync(Request $request)
    {
        $data = $request->validate([
            'uploads' => 'array',
            'updates' => 'array',
            'deletions' => 'array', // Scene IDs
            'links' => 'array',
            'deleted_links' => 'array',
            'area_updates' => 'array', // Renames, etc
        ]);

        DB::beginTransaction();
        try {
            // A. Area Updates
            if (!empty($data['area_updates'])) {
                foreach ($data['area_updates'] as $update) {
                    Area::where('id', $update['id'])->update(['name' => $update['name']]);
                }
            }

            // B. Deletions (Scenes)
            if (!empty($data['deletions'])) {
                // Physical Delete could be queued, but we do inline for now 
                $scenesToDelete = Scene::whereIn('id', $data['deletions'])->get();
                foreach ($scenesToDelete as $s) {
                    if ($s->image_path && file_exists(storage_path('app/public/' . $s->image_path))) {
                        @unlink(storage_path('app/public/' . $s->image_path));
                    }
                }

                Scene::whereIn('id', $data['deletions'])->delete();
                Link::whereIn('source_scene_id', $data['deletions'])->orWhereIn('target_scene_id', $data['deletions'])->delete();
            }

            // C. Deleted Links
            if (!empty($data['deleted_links'])) {
                Link::destroy($data['deleted_links']);
            }

            // D. Scene Updates
            foreach (($data['updates'] ?? []) as $update) {
                if (str_starts_with($update['id'], 'draft'))
                    continue;

                $scene = Scene::find($update['id']);
                if (!$scene)
                    continue;

                $updateData = [
                    'name' => $update['name'],
                    // 'area_id' => ... move logic if we allow drag-drop between trees later
                    'heading' => $update['heading'] ?? $scene->heading,

                ];

                if (isset($update['lat']) && isset($update['lng'])) {
                    $lat = $update['lat'];
                    $lng = $update['lng'];
                    // Only update location if valid
                    if ($lat != 0 && $lng != 0) {
                        $scene->update([
                            'location' => DB::raw("ST_SetSRID(ST_Point($lng, $lat), 4326)::geography")
                        ]);
                    }
                }

                $scene->update($updateData);
            }

            // E. Uploads (New Scenes)
            $tempIdMap = [];
            foreach (($data['uploads'] ?? []) as $upload) {
                $tempPath = $upload['temp_path'];
                $newFilename = 'pano_' . uniqid() . '.jpg';
                $newPath = 'panoramas/' . $newFilename;

                if (!file_exists(storage_path('app/public/panoramas'))) {
                    mkdir(storage_path('app/public/panoramas'), 0755, true);
                }

                if (file_exists(storage_path('app/public/' . $tempPath))) {
                    rename(storage_path('app/public/' . $tempPath), storage_path('app/public/' . $newPath));
                }

                $scene = new Scene();
                $scene->area_id = $upload['area_id'];
                $scene->image_path = $newPath;
                $scene->name = $upload['name'];
                $scene->heading = $upload['heading'] ?? 0;
                $scene->type = 'navigasi';
                // GPS
                $lat = $upload['lat'] ?? 0;
                $lng = $upload['lng'] ?? 0;
                $scene->location_array = ['lat' => $lat, 'lng' => $lng];

                // sort_order removed - scenes ordered by created_at

                $scene->save();

                // Update PostGIS if valid
                if ($lat != 0 && $lng != 0) {
                    $scene->update([
                        'location' => DB::raw("ST_SetSRID(ST_Point($lng, $lat), 4326)::geography")
                    ]);
                }

                \App\Jobs\ResizeImageJob::dispatch($scene);

                if (isset($upload['id'])) {
                    $tempIdMap[$upload['id']] = $scene->id;
                }
            }

            // F. Links (Create/Update)
            foreach (($data['links'] ?? []) as $linkData) {
                $sourceId = $linkData['source'];
                if (isset($tempIdMap[$sourceId]))
                    $sourceId = $tempIdMap[$sourceId];

                $targetId = $linkData['target'];
                if (isset($tempIdMap[$targetId]))
                    $targetId = $tempIdMap[$targetId];

                // Integrity Check
                if (!is_numeric($sourceId) || !is_numeric($targetId))
                    continue;

                Link::updateOrCreate(
                    [
                        'source_scene_id' => $sourceId,
                        'target_scene_id' => $targetId,
                    ],
                    [
                        'yaw' => $linkData['yaw'],
                        'type' => $linkData['type'],
                        'pitch' => 0
                    ]
                );
            }

            DB::commit();
            return response()->json(['success' => true]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // 4. AUTO LINK - Recursive/Universal with Preview
    public function autoLinkAll(Request $request)
    {
        $validated = $request->validate([
            'area_id' => 'nullable|exists:areas,id', // null = universal
            'replace_existing' => 'boolean',
            'preview_only' => 'boolean',
            'radius' => 'nullable|numeric|min:1|max:100', // meters
        ]);

        $areaId = $validated['area_id'] ?? null;
        $replaceExisting = $validated['replace_existing'] ?? false;
        $previewOnly = $validated['preview_only'] ?? false;
        $radius = $validated['radius'] ?? 5; // Default 5 meters

        // Get target areas
        if ($areaId === null) {
            // Universal: all leaf areas with scenes
            $targetAreaIds = Area::has('scenes')->pluck('id')->toArray();
        } else {
            // Recursive: descendants of selected area
            $targetAreaIds = $this->getDescendantAreaIds($areaId);
        }

        if ($previewOnly) {
            return $this->generateAutoLinkPreview($targetAreaIds, $replaceExisting, $radius);
        }

        // Check for large dataset (consider background job)
        $totalScenes = Scene::whereIn('area_id', $targetAreaIds)->count();

        // For now, execute synchronously (add background job later if needed)
        return $this->executeAutoLinking($targetAreaIds, $replaceExisting, $radius);
    }

    // Helper: Recursive area collection
    private function getDescendantAreaIds($areaId, &$cache = []): array
    {
        if (isset($cache[$areaId])) {
            return $cache[$areaId];
        }

        $area = Area::with('children')->findOrFail($areaId);
        $ids = [];

        // Include if has scenes
        if ($area->scenes()->exists()) {
            $ids[] = $area->id;
        }

        // Recurse children
        foreach ($area->children as $child) {
            $ids = array_merge($ids, $this->getDescendantAreaIds($child->id, $cache));
        }

        $result = array_unique($ids);
        $cache[$areaId] = $result;

        return $result;
    }


    // Helper: Generate preview
    private function generateAutoLinkPreview(array $targetAreaIds, bool $replaceExisting, int $radius = 5): \Illuminate\Http\JsonResponse
    {
        $areas = Area::whereIn('id', $targetAreaIds)
            ->withCount('scenes')
            ->get();

        $totalScenes = $areas->sum('scenes_count');
        $scenesWithoutGPS = Scene::whereIn('area_id', $targetAreaIds)
            ->whereNull('location')
            ->count();

        $gatewayScenes = Scene::whereIn('area_id', $targetAreaIds)
            ->where('can_be_gateway', true)
            ->whereNotNull('location')
            ->count();

        // Count existing links (if replace mode)
        $existingLinks = 0;
        if ($replaceExisting && !empty($targetAreaIds)) {
            $placeholders = implode(',', array_fill(0, count($targetAreaIds), '?'));
            $existingLinks = DB::select("
                SELECT COUNT(*) as count FROM links
                WHERE source_scene_id IN (
                    SELECT id FROM scenes WHERE area_id IN ($placeholders)
                )
            ", $targetAreaIds)[0]->count ?? 0;
        }

        // EXACT COUNT using same SQL as execution (dry-run without INSERT)
        $navCount = $this->countNavigationLinks($targetAreaIds, $radius);
        $gatewayCount = $this->countGatewayLinks($targetAreaIds);

        return response()->json([
            'scope' => count($targetAreaIds) === Area::has('scenes')->count() ? 'universal' : 'recursive',
            'target_areas' => $areas->map(fn($a) => [
                'id' => $a->id,
                'name' => $a->name,
                'scene_count' => $a->scenes_count,
            ]),
            'total_scenes' => $totalScenes,
            'scenes_without_gps' => $scenesWithoutGPS,
            'gateway_scenes' => $gatewayScenes,
            'existing_links' => $existingLinks,
            'estimated_nav_links' => $navCount,
            'estimated_gateway_links' => $gatewayCount,
            'estimated_total' => $navCount + $gatewayCount,
            'will_delete' => $replaceExisting ? $existingLinks : 0,
        ]);
    }

    // Helper: Execute linking
    private function executeAutoLinking(array $targetAreaIds, bool $replaceExisting, int $radius = 5): \Illuminate\Http\JsonResponse
    {
        DB::beginTransaction();
        try {
            $deletedCount = 0;

            if ($replaceExisting && !empty($targetAreaIds)) {
                $deletedCount = $this->deleteExistingLinks($targetAreaIds);
            }

            $navCount = $this->createNavigationLinksBatched($targetAreaIds, $radius);
            $gatewayCount = $this->createGatewayLinks($targetAreaIds);

            DB::commit();

            return response()->json([
                'success' => true,
                'deleted_links' => $deletedCount,
                'navigation_links' => $navCount,
                'gateway_links' => $gatewayCount,
                'total_created' => $navCount + $gatewayCount,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Helper: Delete existing links
    private function deleteExistingLinks(array $targetAreaIds): int
    {
        if (empty($targetAreaIds))
            return 0;

        $placeholders = implode(',', array_fill(0, count($targetAreaIds), '?'));

        return DB::delete("
            DELETE FROM links
            WHERE source_scene_id IN (
                SELECT id FROM scenes WHERE area_id IN ($placeholders)
            )
        ", $targetAreaIds);
    }

    // Helper: Create navigation links (batched)
    private function createNavigationLinksBatched(array $areaIds, int $radius = 5): int
    {
        if (empty($areaIds))
            return 0;

        $placeholders = implode(',', array_fill(0, count($areaIds), '?'));

        $result = DB::select("
            WITH inserted_links AS (
                INSERT INTO links (source_scene_id, target_scene_id, yaw, pitch, type, distance, created_at, updated_at)
                SELECT 
                    id_asal, 
                    id_tujuan, 
                    azimuth_radian,
                    0,
                    'navigasi',
                    jarak,
                    NOW(), 
                    NOW()
                FROM (
                    SELECT 
                        s1.id as id_asal,
                        s2.id as id_tujuan,
                        ST_Azimuth(s1.location::geometry, s2.location::geometry) as azimuth_radian,
                        ST_DistanceSphere(s1.location::geometry, s2.location::geometry) as jarak,
                        floor(((degrees(ST_Azimuth(s1.location::geometry, s2.location::geometry)) - COALESCE(s1.heading, 0)) + 360)::numeric % 360 / 45) as sektor,
                        ROW_NUMBER() OVER (
                            PARTITION BY s1.id, floor(((degrees(ST_Azimuth(s1.location::geometry, s2.location::geometry)) - COALESCE(s1.heading, 0)) + 360)::numeric % 360 / 45)
                            ORDER BY ST_DistanceSphere(s1.location::geometry, s2.location::geometry) ASC
                        ) as ranking
                    FROM scenes s1
                    JOIN scenes s2 ON s1.id != s2.id 
                        AND s1.area_id = s2.area_id
                    WHERE s1.area_id IN ($placeholders)
                        AND s1.location IS NOT NULL 
                        AND s2.location IS NOT NULL
                        AND ST_DistanceSphere(s1.location::geometry, s2.location::geometry) <= ?
                        AND NOT EXISTS (
                            SELECT 1 FROM links l 
                            WHERE l.source_scene_id = s1.id 
                              AND l.target_scene_id = s2.id
                        )
                ) as kandidat
                WHERE ranking = 1
                RETURNING 1
            )
            SELECT COUNT(*) as count FROM inserted_links
        ", array_merge($areaIds, [$radius])); // Add radius as parameter

        return $result[0]->count ?? 0;
    }

    // Helper: Create gateway links
    private function createGatewayLinks(array $areaIds): int
    {
        if (empty($areaIds))
            return 0;

        // Get all gateway scenes in target areas
        $gatewayScenesInScope = Scene::whereIn('area_id', $areaIds)
            ->where('can_be_gateway', true)
            ->whereNotNull('location')
            ->pluck('id')
            ->toArray();

        if (empty($gatewayScenesInScope)) {
            return 0; // No gateway scenes
        }

        $placeholders = implode(',', $gatewayScenesInScope);

        // Create gateway links between gateway scenes in different areas
        $result = DB::select("
            WITH inserted_links AS (
                INSERT INTO links (source_scene_id, target_scene_id, yaw, pitch, type, distance, created_at, updated_at)
                SELECT 
                    s1.id,
                    s2.id,
                    ST_Azimuth(s1.location::geometry, s2.location::geometry) as yaw,
                    0 as pitch,
                    'gateway' as type,
                    ST_DistanceSphere(s1.location::geometry, s2.location::geometry) as distance,
                    NOW(),
                    NOW()
                FROM scenes s1
                JOIN scenes s2 ON s1.id != s2.id
                    AND s1.area_id != s2.area_id
                    AND s2.can_be_gateway = true
                WHERE s1.id IN ($placeholders)
                    AND s1.location IS NOT NULL
                    AND s2.location IS NOT NULL
                    AND ST_DistanceSphere(s1.location::geometry, s2.location::geometry) <= 50
                    AND NOT EXISTS (
                        SELECT 1 FROM links l
                        WHERE l.source_scene_id = s1.id
                          AND l.target_scene_id = s2.id
                    )
                RETURNING 1
            )
            SELECT COUNT(*) as count FROM inserted_links
        ");

        return $result[0]->count ?? 0;
    }

    // --- UPLOAD TEMP ---
    public function uploadTemp(Request $request)
    {
        // ... (Same as before, simplified for brevity)
        $request->validate(['file' => 'required|image|max:30720']);
        $file = $request->file('file');
        $path = $file->store('temp', 'public');
        $fullPath = storage_path('app/public/' . $path);

        $lat = 0;
        $lng = 0;
        $heading = 0;
        try {
            $exif = @exif_read_data($fullPath);
            if ($exif) {
                // ... (GPS Logic reused)
                if (
                    isset($exif['GPSLatitude']) && isset($exif['GPSLatitudeRef']) &&
                    isset($exif['GPSLongitude']) && isset($exif['GPSLongitudeRef'])
                ) {
                    $lat = $this->getGps($exif['GPSLatitude'], $exif['GPSLatitudeRef']);
                    $lng = $this->getGps($exif['GPSLongitude'], $exif['GPSLongitudeRef']);
                }
                if (isset($exif['GPSImgDirection'])) {
                    $heading = $this->gps2Num($exif['GPSImgDirection']);
                } else {
                    $xmpHeading = $this->getXmpHeading($fullPath);
                    if ($xmpHeading !== null)
                        $heading = $xmpHeading;
                }
            }
        } catch (\Exception $e) {
        }

        return response()->json([
            'temp_path' => $path,
            'url' => asset('storage/' . $path),
            'lat' => $lat,
            'lng' => $lng,
            'heading' => $heading,
            'filename' => $file->getClientOriginalName()
        ]);
    }

    // --- HELPERS (Reused) ---
    private function getGps($exifCoord, $hemi)
    {
        $degrees = count($exifCoord) > 0 ? $this->gps2Num($exifCoord[0]) : 0;
        $minutes = count($exifCoord) > 1 ? $this->gps2Num($exifCoord[1]) : 0;
        $seconds = count($exifCoord) > 2 ? $this->gps2Num($exifCoord[2]) : 0;
        $flip = ($hemi == 'W' or $hemi == 'S') ? -1 : 1;
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
    private function getXmpHeading($filepath)
    {
        $content = file_get_contents($filepath);
        $xmp_start = strpos($content, '<x:xmpmeta');
        $xmp_end = strpos($content, '</x:xmpmeta>');
        if ($xmp_start === false || $xmp_end === false)
            return null;
        $xmp_length = $xmp_end - $xmp_start + 12;
        $xmp_data = substr($content, $xmp_start, $xmp_length);
        if (preg_match('/PoseHeadingDegrees="([^"]+)"/', $xmp_data, $matches))
            return floatval($matches[1]);
        if (preg_match('/<GPano:PoseHeadingDegrees>([^<]+)<\/GPano:PoseHeadingDegrees>/', $xmp_data, $matches))
            return floatval($matches[1]);
        return null;
    }
    // 5. GET AREA DELETION IMPACT - Calculate cascade deletion consequences
    public function getAreaDeletionImpact(Area $area)
    {
        $affectedAreaIds = $this->collectDescendantAreaIds($area);
        $affectedAreaIds[] = $area->id; // Include the area itself

        // Get all area names for display
        $areaNames = Area::whereIn('id', $affectedAreaIds)
            ->where('id', '!=', $area->id)
            ->pluck('name')
            ->toArray();

        // Count total scenes across all affected areas
        $totalScenes = Scene::whereIn('area_id', $affectedAreaIds)->count();

        return response()->json([
            'area_id' => $area->id,
            'area_name' => $area->name,
            'total_areas' => count($affectedAreaIds),
            'total_scenes' => $totalScenes,
            'area_names' => $areaNames,
            'warning' => sprintf(
                'Deleting this area will permanently remove %d area%s and %d scene%s',
                count($affectedAreaIds),
                count($affectedAreaIds) > 1 ? 's' : '',
                $totalScenes,
                $totalScenes > 1 ? 's' : ''
            )
        ]);
    }

    // Helper: Recursively collect all descendant area IDs
    private function collectDescendantAreaIds(Area $area): array
    {
        $ids = [];

        foreach ($area->children as $child) {
            $ids[] = $child->id;
            // Recursively collect from this child's children
            $ids = array_merge($ids, $this->collectDescendantAreaIds($child));
        }

        return $ids;
    }

    // 6. DESTROY AREA - with cascade deletion support
    public function destroyArea(Request $request, Area $area)
    {
        $force = $request->query('force', false);

        // If force=true, perform cascade deletion
        if ($force === 'true' || $force === true) {
            DB::beginTransaction();
            try {
                $this->cascadeDeleteArea($area);
                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Area and all descendants deleted successfully'
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to delete area: ' . $e->getMessage()
                ], 500);
            }
        }

        // Original behavior: Check for children and scenes
        $childrenCount = $area->children()->count();
        $scenesCount = $area->scenes()->count();

        // BLOCK delete if area has content
        if ($childrenCount > 0 || $scenesCount > 0) {
            return response()->json([
                'error' => 'cannot_delete_with_content',
                'area_name' => $area->name,
                'children_count' => $childrenCount,
                'scenes_count' => $scenesCount,
                'message' => "Cannot delete area with content. Please delete or move child content first."
            ], 422); // Unprocessable Entity
        }

        // Safe to delete - area is empty
        $area->delete();

        return response()->json(['success' => true, 'message' => 'Area deleted successfully']);
    }

    // Helper: Recursively delete area and all descendants
    private function cascadeDeleteArea(Area $area): void
    {
        // First, recursively delete all child areas
        foreach ($area->children as $child) {
            $this->cascadeDeleteArea($child);
        }

        // Delete all scenes in this area (with file cleanup)
        $scenes = $area->scenes;
        foreach ($scenes as $scene) {
            // Cleanup physical file
            if ($scene->image_path && file_exists(storage_path('app/public/' . $scene->image_path))) {
                @unlink(storage_path('app/public/' . $scene->image_path));
            }

            // Cleanup links
            Link::where('source_scene_id', $scene->id)
                ->orWhere('target_scene_id', $scene->id)
                ->delete();

            // Delete scene
            $scene->delete();
        }

        // Finally, delete the area itself
        $area->delete();
    }

    // 7. DESTROY SCENE
    public function destroyScene(Scene $scene)
    {
        // Cleanup file
        if ($scene->image_path && file_exists(storage_path('app/public/' . $scene->image_path))) {
            @unlink(storage_path('app/public/' . $scene->image_path));
        }

        // Cleanup links
        Link::where('source_scene_id', $scene->id)
            ->orWhere('target_scene_id', $scene->id)
            ->delete();

        $scene->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Update scene properties
     */
    public function updateScene(Request $request, Scene $scene)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'lat' => 'sometimes|nullable|numeric',
            'lng' => 'sometimes|nullable|numeric',
            'heading' => 'sometimes|nullable|numeric',

            'can_be_gateway' => 'sometimes|boolean',
        ]);

        // Update basic fields
        $scene->fill($validated);

        // Manual activity logging for lat/lng (they are accessors, not columns)
        $oldLat = $scene->lat;
        $oldLng = $scene->lng;

        // Update PostGIS location if lat/lng provided
        $lat = $validated['lat'] ?? null;
        $lng = $validated['lng'] ?? null;

        if ($lat !== null && $lng !== null) {
            try {
                DB::statement(
                    "UPDATE scenes SET location = ST_SetSRID(ST_Point(?, ?), 4326)::geography WHERE id = ?",
                    [$lng, $lat, $scene->id]
                );
                \Log::info("Scene {$scene->id} location updated to lat: {$lat}, lng: {$lng}");

                // Manually log lat/lng changes for activity log
                if ($oldLat != $lat || $oldLng != $lng) {
                    activity()
                        ->causedBy(auth()->user())
                        ->performedOn($scene)
                        ->event('updated')
                        ->withProperties([
                            'attributes' => ['lat' => $lat, 'lng' => $lng],
                            'old' => ['lat' => $oldLat, 'lng' => $oldLng]
                        ])
                        ->log("Updated scene '{$scene->name}' GPS location");
                }
            } catch (\Exception $e) {
                \Log::error("Failed to update PostGIS location for scene {$scene->id}: " . $e->getMessage());
            }
        }

        $scene->save();

        // Reload to get fresh lat/lng from PostGIS
        $scene->refresh();

        return response()->json([
            'success' => true,
            'scene' => [
                'id' => $scene->id,
                'name' => $scene->name,
                'lat' => $scene->lat,
                'lng' => $scene->lng,
                'heading' => $scene->heading,
                'can_be_gateway' => (bool) $scene->can_be_gateway,

            ]
        ]);
    }

    /**
     * Show area details with scenes
     */
    public function showArea(Area $area)
    {
        $area->load([
            'scenes' => function ($q) {
                $q->select('id', 'area_id', 'name', 'image_path');
            }
        ]);

        return response()->json([
            'area' => $this->formatAreaNode($area),
            'scenes' => $area->scenes->map(fn($scene) => [
                'id' => $scene->id,
                'name' => $scene->name,
                'type' => 'scene',
                'is_restricted' => (bool) $scene->is_restricted,
                'url' => $scene->url,
                'url_v' => $scene->url_v,
                'url_h' => $scene->url_h,
                'path' => asset('storage/' . $scene->image_path)
            ])
        ]);
    }

    // ==================================
    // PUBLISH WORKFLOW ENDPOINTS
    // ==================================

    /**
     * Get all unpublished changes for review
     */
    public function getPendingChanges()
    {
        // Get all recent activity logs, but filter to only show changes AFTER last publish
        // Use leftJoin to handle deleted items (subject may be null)
        $activities = \Spatie\Activitylog\Models\Activity::query()
            ->leftJoin('areas', function ($join) {
                $join->on('activity_log.subject_id', '=', 'areas.id')
                    ->where('activity_log.subject_type', '=', 'App\\Models\\Area');
            })
            ->leftJoin('scenes', function ($join) {
                $join->on('activity_log.subject_id', '=', 'scenes.id')
                    ->where('activity_log.subject_type', '=', 'App\\Models\\Scene');
            })
            ->leftJoin('links', function ($join) {
                $join->on('activity_log.subject_id', '=', 'links.id')
                    ->where('activity_log.subject_type', '=', 'App\\Models\\Link');
            })
            ->whereIn('activity_log.subject_type', [
                'App\\Models\\Area',
                'App\\Models\\Scene',
                'App\\Models\\Link'
            ])
            ->where(function ($query) {
                // Show all deletions OR changes after last publish
                $query->where('activity_log.event', 'deleted')
                    ->orWhere(function ($q) {
                    // Areas: must join successfully and check publish date
                    $q->whereNotNull('areas.id')
                        ->where(function ($q2) {
                        $q2->whereNull('areas.last_published_at')
                            ->orWhereColumn('activity_log.created_at', '>', 'areas.last_published_at');
                    });
                })
                    ->orWhere(function ($q) {
                    // Scenes: check if join successful OR if scene-related log exists
                    $q->where(function ($q1) {
                        // Joined successfully
                        $q1->whereNotNull('scenes.id')
                            ->where(function ($q2) {
                            $q2->whereNull('scenes.last_published_at')
                                ->orWhereColumn('activity_log.created_at', '>', 'scenes.last_published_at');
                        });
                    })->orWhere(function ($q1) {
                        // Scene activity but couldn't join (e.g., manual GPS logs)
                        $q1->where('activity_log.subject_type', 'App\\Models\\Scene')
                            ->whereNull('scenes.id');
                    });
                })
                    ->orWhere(function ($q) {
                    $q->whereNotNull('links.id')
                        ->where(function ($q2) {
                            $q2->whereNull('links.last_published_at')
                                ->orWhereColumn('activity_log.created_at', '>', 'links.last_published_at');
                        });
                });
            })
            ->select('activity_log.*')
            ->with(['causer'])
            ->orderBy('activity_log.created_at', 'desc')
            ->get();

        // Group by type
        $groupedChanges = $activities->groupBy(function ($activity) {
            return class_basename($activity->subject_type);
        });

        // Format for frontend with better diff display AND smart grouping
        $formattedChanges = [];
        foreach ($groupedChanges as $type => $items) {
            // Group by subject_id to collapse multiple edits on same object
            $groupedBySubject = $items->groupBy('subject_id');

            $formattedChanges[$type] = $groupedBySubject->map(function ($subjectLogs) {
                // Get the latest log for this subject
                $latestLog = $subjectLogs->first();
                $editCount = $subjectLogs->count();

                // Get all changed fields across all logs for this subject
                $allChanges = [];
                $allOldValues = [];
                foreach ($subjectLogs as $log) {
                    $allChanges = array_merge($allChanges, $log->properties['attributes'] ?? []);
                    $allOldValues = array_merge($allOldValues, $log->properties['old'] ?? []);
                }

                // Build human-readable change description
                $changeDetails = [];
                foreach ($allOldValues as $field => $oldValue) {
                    $newValue = $allChanges[$field] ?? null;
                    if ($oldValue !== $newValue) {
                        $changeDetails[] = [
                            'field' => $field,
                            'old' => $oldValue,
                            'new' => $newValue
                        ];
                    }
                }

                // Get subject name from properties if subject is deleted
                $subjectName = 'Unknown';
                if ($latestLog->event === 'deleted') {
                    $subjectName = $allOldValues['name'] ?? $allChanges['name'] ?? 'Deleted Item';
                } elseif ($latestLog->subject) {
                    $subjectName = $latestLog->subject->name ?? 'Unknown';
                }

                return [
                    'id' => $latestLog->id,
                    'description' => $latestLog->description,
                    'event' => $latestLog->event,
                    'subject_id' => $latestLog->subject_id,
                    'subject_name' => $subjectName,
                    'changes' => $allChanges,
                    'old_values' => $allOldValues,
                    'change_details' => $changeDetails,
                    'causer_name' => $latestLog->causer->name ?? 'System',
                    'created_at' => $latestLog->created_at->diffForHumans(),
                    'created_at_full' => $latestLog->created_at->toDateTimeString(),
                    'edit_count' => $editCount, // How many times edited
                    'oldest_edit' => $subjectLogs->last()->created_at->diffForHumans(),
                ];
            })->values(); // Re-index after grouping
        }

        // Summary stats - Use GROUPED counts, not raw activity count
        $totalGroupedChanges = $groupedChanges->sum(function ($items) {
            return $items->count();
        });

        $summary = [
            'total_changes' => $totalGroupedChanges,  // Grouped count (matches display)
            'areas_count' => $groupedChanges->get('Area', collect())->count(),
            'scenes_count' => $groupedChanges->get('Scene', collect())->count(),
            'links_count' => $groupedChanges->get('Link', collect())->count(),
            'oldest_change' => $activities->min('created_at')?->diffForHumans(),
        ];

        return response()->json([
            'summary' => $summary,
            'changes' => $formattedChanges,
        ]);
    }

    /**
     * Publish all pending changes
     */
    public function publishAll()
    {
        DB::transaction(function () {
            $now = now();

            // Mark all areas/scenes/links as published
            Area::query()->update([
                'is_published' => true,
                'last_published_at' => $now,
            ]);

            Scene::query()->update([
                'is_published' => true,
                'last_published_at' => $now,
            ]);

            Link::query()->update([
                'is_published' => true,
                'last_published_at' => $now,
            ]);

            // CRITICAL: Clear activity logs to remove pending changes
            // This solves the "deleted items still showing" issue
            \Spatie\Activitylog\Models\Activity::query()
                ->whereIn('subject_type', [
                    'App\\Models\\Area',
                    'App\\Models\\Scene',
                    'App\\Models\\Link'
                ])
                ->delete();
        });

        return response()->json([
            'message' => 'All changes published successfully!',
            'published_at' => now()->toDateTimeString(),
        ]);
    }

    /**
     * Publish specific area with all its scenes and links
     */
    public function publishArea(Area $area)
    {
        DB::transaction(function () use ($area) {
            // Publish area
            $area->update([
                'is_published' => true,
                'last_published_at' => now(),
            ]);

            // Publish all scenes in this area
            $area->scenes()->update([
                'is_published' => true,
                'last_published_at' => now(),
            ]);

            // Publish links of scenes in this area
            $sceneIds = $area->scenes()->pluck('id');
            Link::whereIn('source_scene_id', $sceneIds)
                ->update([
                    'is_published' => true,
                    'last_published_at' => now(),
                ]);
        });

        return response()->json([
            'message' => "Area '{$area->name}' and all its scenes published!",
        ]);
    }

    /**
     * Bulk upload scenes with metadata extraction
     */
    public function bulkUploadScenes(Request $request)
    {
        $request->validate([
            'images' => 'required|array',
            'images.*' => 'image|max:30720', // 30MB max
            'area_id' => 'required|exists:areas,id'
        ]);

        $areaId = $request->area_id;
        $area = Area::findOrFail($areaId);
        $uploadedScenes = [];

        \Log::info('Starting bulk scene upload', [
            'area_id' => $areaId,
            'area_name' => $area->name,
            'file_count' => count($request->file('images'))
        ]);

        DB::beginTransaction();
        try {
            foreach ($request->file('images') as $index => $file) {
                \Log::info("Processing file #{$index}", ['filename' => $file->getClientOriginalName()]);

                // Store file
                $filename = 'pano_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('panoramas', $filename, 'public');
                $fullPath = storage_path('app/public/' . $path);

                // Extract metadata - only if EXIF exists
                $lat = 0;
                $lng = 0;
                $heading = 0;

                // Check if file has EXIF data before processing
                if (function_exists('exif_read_data') && @exif_imagetype($fullPath) !== false) {
                    try {
                        $exif = @exif_read_data($fullPath);
                        if ($exif && is_array($exif)) {
                            // Extract GPS coordinates
                            if (
                                isset($exif['GPSLatitude']) && isset($exif['GPSLatitudeRef']) &&
                                isset($exif['GPSLongitude']) && isset($exif['GPSLongitudeRef'])
                            ) {
                                $lat = $this->getGps($exif['GPSLatitude'], $exif['GPSLatitudeRef']);
                                $lng = $this->getGps($exif['GPSLongitude'], $exif['GPSLongitudeRef']);
                            }

                            // Extract heading
                            if (isset($exif['GPSImgDirection'])) {
                                $heading = $this->gps2Num($exif['GPSImgDirection']);
                            } else {
                                $xmpHeading = $this->getXmpHeading($fullPath);
                                if ($xmpHeading !== null)
                                    $heading = $xmpHeading;
                            }
                        }
                    } catch (\Exception $e) {
                        \Log::info("No EXIF data for {$filename}, using defaults");
                    }
                } else {
                    \Log::info("File {$filename} has no EXIF support, skipping metadata extraction");
                }

                // Create scene
                $scene = Scene::create([
                    'area_id' => $areaId,
                    'image_path' => $path,
                    'name' => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
                    'heading' => $heading,

                ]);

                // Update PostGIS location if valid coordinates
                if ($lat != 0 && $lng != 0) {
                    try {
                        DB::statement(
                            "UPDATE scenes SET location = ST_SetSRID(ST_Point(?, ?), 4326)::geography WHERE id = ?",
                            [$lng, $lat, $scene->id]
                        );
                        \Log::info("PostGIS location updated for scene {$scene->id}");
                    } catch (\Exception $e) {
                        \Log::warning("Failed to update PostGIS location for scene {$scene->id}: " . $e->getMessage());
                    }
                }

                // Queue image resize job to generate WebP thumbnails - DISABLED (WebP conversion sufficient)
                // \App\Jobs\ResizeImageJob::dispatch($scene);
                \Log::info("Scene {$scene->id} created successfully (WebP conversion by ProcessSceneImage)");

                $uploadedScenes[] = $scene;
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => count($uploadedScenes) . ' scenes uploaded successfully',
                'scenes' => collect($uploadedScenes)->map(fn($scene) => [
                    'id' => $scene->id,
                    'name' => $scene->name,
                    'type' => 'scene',
                    'url' => $scene->url,
                    'url_v' => $scene->url_v,
                    'url_h' => $scene->url_h,
                    'path' => asset('storage/' . $scene->image_path)
                ])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Scene upload failed', [
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Upload failed: ' . $e->getMessage(),
                'error_detail' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    // Helper: Count navigation links (dry-run for preview)
    private function countNavigationLinks(array $areaIds, int $radius = 5): int
    {
        if (empty($areaIds))
            return 0;

        $placeholders = implode(',', array_fill(0, count($areaIds), '?'));

        $result = DB::select("
            SELECT COUNT(*) as count FROM (
                SELECT 
                    s1.id,
                    ROW_NUMBER() OVER (
                        PARTITION BY s1.id, floor(((degrees(ST_Azimuth(s1.location::geometry, s2.location::geometry)) - COALESCE(s1.heading, 0)) + 360)::numeric % 360 / 45)
                        ORDER BY ST_DistanceSphere(s1.location::geometry, s2.location::geometry) ASC
                    ) as ranking
                FROM scenes s1
                JOIN scenes s2 ON s1.id != s2.id AND s1.area_id = s2.area_id
                WHERE s1.area_id IN ($placeholders)
                    AND s1.location IS NOT NULL AND s2.location IS NOT NULL
                    AND ST_DistanceSphere(s1.location::geometry, s2.location::geometry) <= ?
                    AND NOT EXISTS (SELECT 1 FROM links l WHERE l.source_scene_id = s1.id AND l.target_scene_id = s2.id)
            ) as kandidat WHERE ranking = 1
        ", array_merge($areaIds, [$radius]));

        return $result[0]->count ?? 0;
    }

    // Helper: Count gateway links (dry-run for preview)
    private function countGatewayLinks(array $areaIds): int
    {
        if (empty($areaIds))
            return 0;

        $placeholders = implode(',', array_fill(0, count($areaIds), '?'));

        $result = DB::select("
            SELECT COUNT(DISTINCT s1.id) as count FROM scenes s1
            JOIN scenes s2 ON s1.id != s2.id AND s1.area_id != s2.area_id
            WHERE s1.area_id IN ($placeholders)
                AND s1.can_be_gateway = true
                AND s1.location IS NOT NULL AND s2.location IS NOT NULL
                AND ST_DistanceSphere(s1.location::geometry, s2.location::geometry) <= 30
                AND NOT EXISTS (SELECT 1 FROM links l WHERE l.source_scene_id = s1.id AND l.target_scene_id = s2.id AND l.type = 'portal')
        ", $areaIds);

        return $result[0]->count ?? 0;
    }
}
