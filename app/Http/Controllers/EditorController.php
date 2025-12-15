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
    // Render Halaman Editor
    public function edit(Area $area)
    {
        // 0. Fetch Sub Areas (Children)
        $subAreas = $area->children()->orderBy('priority')->get();
        $relatedAreaIds = $subAreas->pluck('id')->push($area->id)->toArray();

        // 1. Fetch Scenes for this Area AND its Children
        $scenes = Scene::whereIn('area_id', $relatedAreaIds)
             ->orderBy('sort_order')
             ->with('outgoingLinks.targetScene.area') // Eager load for link targets
             ->get()
             ->map(function ($scene) {
                 return [
                     'id' => $scene->id,
                     'area_id' => $scene->area_id, // Important for grouping
                     'group_name' => $scene->area->name, // Now Group Name is real Area Name
                     'name' => $scene->name ?? ('Scene #' . $scene->sort_order),
                     'image_url' => asset('storage/' . $scene->image_path),
                     'heading' => (float) $scene->heading,
                     'lat' => $scene->location_array['lat'],
                     'lng' => $scene->location_array['lng'],
                     'is_restricted' => (bool) $scene->is_restricted,
                     'links' => $scene->outgoingLinks->map(function ($link) {
                         return [
                             'id' => $link->id,
                             'target_scene_id' => $link->target_scene_id,
                             'yaw' => (float) $link->yaw,
                             'type' => $link->type,
                             'target_name' => $link->type === 'portal' 
                                 ? ($link->targetScene->area->name ?? 'Unknown Area') 
                                 : ($link->targetScene->name ?? 'Scene #' . $link->targetScene->sort_order),
                         ];
                     })
                 ];
             });

        // 2. Load Candidate List (Same scope as scenes)
        $candidates = $scenes->map(function ($s) {
            return [
                'id' => $s['id'],
                'name' => $s['name'],
                'thumbnail' => $s['image_url'],
            ];
        });

        // 3. Load Area List (For Portal - Exclude self and children to avoid loops?)
        // For now, simple exclude self.
        $areas = Area::whereNotIn('id', $relatedAreaIds)
            ->with(['scenes' => fn($q) => $q->orderBy('sort_order')->limit(1)])
            ->get()
            ->map(function($a) {
                return [
                    'id' => $a->id,
                    'name' => $a->name,
                    'first_scene_id' => $a->scenes->first()?->id
                ];
            });

        return Inertia::render('Editor/VisualEditor', [
            'area' => $area,
            'sub_areas' => $subAreas, // Pass Sub Areas
            'scenes' => $scenes, 
            'candidates' => $candidates,
            'areas' => $areas,
        ]);
    }

    // Simpan Link Baru atau Update
    public function saveLink(Request $request)
    {
        $validated = $request->validate([
            'source_scene_id' => 'required|exists:scenes,id',
            'target_scene_id' => 'required|exists:scenes,id',
            'yaw' => 'required|numeric', // Visual Yaw from Marzipano
            'type' => 'required|string|in:navigasi,portal',
        ]);

        // Cek link existing? (Optional: kalau mau edit link yg sudah ada)
        // Disini kita asumsi Add New Link, tapi kalau source->target sama, update yaw
        
        $link = Link::updateOrCreate(
            [
                'source_scene_id' => $validated['source_scene_id'],
                'target_scene_id' => $validated['target_scene_id'],
            ],
            [
                'yaw' => $validated['yaw'],
                'distance' => 0, // Manual link, jarak tidak relevan untuk navigasi visual
            ]
        );

        return response()->json(['success' => true, 'link_id' => $link->id]);
    }

    // Hapus Link
    public function deleteLink(Link $link)
    {
        $link->delete();
        return response()->json(['success' => true]);
    }

    // Update Lokasi (Map Picker)
    public function updateLocation(Request $request)
    {
        $validated = $request->validate([
            'scene_id' => 'required|exists:scenes,id',
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
        ]);

        $scene = Scene::find($validated['scene_id']);
        
        // Update Location Array (Setter di Model akan update kolom Geometry)
        $scene->location_array = [
            'lat' => $validated['lat'],
            'lng' => $validated['lng']
        ];
        return response()->json(['success' => true]);
    }

    // Update Scene Name
    public function updateScene(Request $request)
    {
        $validated = $request->validate([
            'scene_id' => 'required|exists:scenes,id',
            'name' => 'required|string',
        ]);

        $scene = Scene::find($validated['scene_id']);
        $scene->name = $validated['name'];
        $scene->save();

        return response()->json(['success' => true]);
    }

    // Delete Scene
    public function deleteScene(Scene $scene)
    {
        // Delete physical file
        if ($scene->image_path && file_exists(storage_path('app/public/' . $scene->image_path))) {
            unlink(storage_path('app/public/' . $scene->image_path));
        }
        
        // Links will be deleted via cascade if set up, or we should delete them
        $scene->outgoingLinks()->delete(); // Using relationship for safety
        Link::where('target_scene_id', $scene->id)->delete();
        
        $scene->delete();

        return response()->json(['success' => true]);
    }

    // Auto Link Logic
    public function autoLink(Request $request, Area $area)
    {
        // 0. Get Scope (Root Area + Sub Areas)
        $areaIds = $area->children()->pluck('id')->push($area->id);

        // 1. Single Query (8-Sector Algorithm)
        // Logic: Find closest neighbor in each of the 8 wind sectors (N, NE, E, SE, S, SW, W, NW).
        // Maintains data integrity by storing Radians (ST_Azimuth) for Marzipano, even though Sector calc uses Degrees.
        $created = DB::insert("
            INSERT INTO links (source_scene_id, target_scene_id, yaw, type, created_at, updated_at)
            
            SELECT 
                id_asal, 
                id_tujuan, 
                azimuth_radian, 
                'navigasi' as type, 
                NOW(), 
                NOW()
            FROM (
                SELECT 
                    s1.id as id_asal,
                    s2.id as id_tujuan,
                    
                    ST_Azimuth(s1.location::geometry, s2.location::geometry) as azimuth_radian,
                    
                    -- Sector Calculation (0-7) using Degrees relative to Heading
                    floor(((degrees(ST_Azimuth(s1.location::geometry, s2.location::geometry)) - COALESCE(s1.heading, 0)) + 360)::numeric % 360 / 45) as sektor,
                    
                    ROW_NUMBER() OVER (
                        PARTITION BY s1.id, floor(((degrees(ST_Azimuth(s1.location::geometry, s2.location::geometry)) - COALESCE(s1.heading, 0)) + 360)::numeric % 360 / 45)
                        ORDER BY ST_DistanceSphere(s1.location::geometry, s2.location::geometry) ASC
                    ) as ranking
                    
                FROM scenes s1
                JOIN scenes s2 
                    ON s1.id != s2.id 
                    AND s1.area_id IN (" . $areaIds->implode(',') . ") 
                    AND s2.area_id IN (" . $areaIds->implode(',') . ")
                WHERE 
                    s1.location IS NOT NULL 
                    AND s2.location IS NOT NULL
                    AND ST_DistanceSphere(s1.location::geometry, s2.location::geometry) <= 100 -- 100 Meters
                    AND NOT EXISTS (
                        SELECT 1 FROM links l 
                        WHERE l.source_scene_id = s1.id 
                        AND l.target_scene_id = s2.id
                    )
            ) as kandidat
            WHERE ranking = 1
        ");

        return response()->json(['success' => true, 'count' => $created]);
    }

    // --- UPLOAD & BATCH SAVE ---

    public function uploadTemp(Request $request)
    {
        $request->validate([
            'file' => 'required|image|max:30720', // 30MB
        ]);

        $file = $request->file('file');
        $path = $file->store('temp', 'public');
        $fullPath = storage_path('app/public/' . $path);

        // Extract Metadata
        $lat = 0; $lng = 0; $heading = 0;
        
        try {
            $exif = @exif_read_data($fullPath);
            if ($exif) {
                if (isset($exif['GPSLatitude']) && isset($exif['GPSLatitudeRef']) &&
                    isset($exif['GPSLongitude']) && isset($exif['GPSLongitudeRef'])) {
                    
                    $lat = $this->getGps($exif['GPSLatitude'], $exif['GPSLatitudeRef']);
                    $lng = $this->getGps($exif['GPSLongitude'], $exif['GPSLongitudeRef']);
                }

                if (isset($exif['GPSImgDirection'])) {
                    $heading = $this->gps2Num($exif['GPSImgDirection']);
                } else {
                    $xmpHeading = $this->getXmpHeading($fullPath);
                    if ($xmpHeading !== null) {
                        $heading = $xmpHeading;
                    }
                }
            }
        } catch (\Exception $e) {
            // Ignore error
        }

        // If no GPS, Default to Area Center? Or 0.
        // We will default to 0 and let user set it.

        return response()->json([
            'temp_path' => $path,
            'url' => asset('storage/' . $path),
            'lat' => $lat,
            'lng' => $lng,
            'heading' => $heading,
            'filename' => $file->getClientOriginalName()
        ]);
    }

    // Buat Child Area (Sub-Folder)
    public function createSubArea(Request $request, Area $area)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $subArea = Area::create([
            'name' => $validated['name'],
            'parent_id' => $area->id,
            'type' => 'default', // Sub-areas are also containers for scenes
            'priority' => Area::where('parent_id', $area->id)->max('priority') + 1,
        ]);

        return response()->json(['success' => true, 'sub_area' => $subArea]);
    }

    public function sync(Request $request, Area $area)
    {
        \Illuminate\Support\Facades\Log::info('Sync Payload:', $request->all()); // DEBUG LOG

        $data = $request->validate([
            'uploads' => 'array',
            'updates' => 'array',
            'deletions' => 'array',
            'links' => 'array',
            'deleted_links' => 'array',
            'area_data' => 'array',
            'sub_areas' => 'array', 
        ]);

        DB::beginTransaction();
        try {
            // 0. Update Area Metadata
            if (isset($data['area_data'])) {
                $ad = $data['area_data'];
                $area->update([
                    'name' => $ad['name'] ?? $area->name,
                    'description' => $ad['description'] ?? $area->description,
                    'parent_id' => $ad['parent_id'] ?? $area->parent_id,
                    'lat' => $ad['lat'] ?? $area->lat,
                    'lng' => $ad['lng'] ?? $area->lng,
                    'priority' => $ad['priority'] ?? $area->priority,
                ]);
            }

            // 1. Process Sub-Areas (Create/Update/Delete)
            $subAreaMap = []; 
            if (isset($data['sub_areas'])) {
                foreach ($data['sub_areas'] as $sa) {
                    \Illuminate\Support\Facades\Log::info('Processing SubArea:', $sa); // DEBUG LOG

                    if (str_starts_with($sa['id'], 'new_')) {
                        // CREATE NEW
                        $newSubArea = Area::create([
                            'name' => $sa['name'],
                            'parent_id' => $area->id,
                            'priority' => 0, 
                            'type' => 'default', 
                            'is_restricted' => $sa['is_restricted'] ?? false,
                        ]);
                        $subAreaMap[$sa['id']] = $newSubArea->id;
                        \Illuminate\Support\Facades\Log::info('Created SubArea:', ['id' => $newSubArea->id]);
                    } else {
                        // UPDATE EXISTING
                        $existing = Area::find($sa['id']);
                        if ($existing && $existing->parent_id == $area->id) { 
                            $existing->update([
                                'name' => $sa['name'],
                                'is_restricted' => $sa['is_restricted'] ?? false
                            ]);
                        }
                    }
                }
            }

            // 2. Deletions (Scenes)
            if (!empty($data['deletions'])) {
                Scene::whereIn('id', $data['deletions'])->whereIn('area_id', [$area->id, ...$area->children->pluck('id')])->delete();
                Link::whereIn('source_scene_id', $data['deletions'])->orWhereIn('target_scene_id', $data['deletions'])->delete();
            }

            // 3. Deleted Links
            if (!empty($data['deleted_links'])) {
                Link::destroy($data['deleted_links']);
            }

            // 4. Updates (Names & Restricted Status & Moves)
            foreach (($data['updates'] ?? []) as $update) {
                if (str_starts_with($update['id'], 'draft')) continue; 
                
                $scene = Scene::find($update['id']);
                if (!$scene) continue;

                // Resolve Target Area ID
                $targetAreaId = $update['area_id'] ?? $scene->area_id;
                if (str_starts_with($targetAreaId, 'new_') && isset($subAreaMap[$targetAreaId])) {
                     $targetAreaId = $subAreaMap[$targetAreaId];
                }

                $updateData = [
                    'name' => $update['name'],
                    'area_id' => $targetAreaId,
                    'heading' => $update['heading'] ?? $scene->heading,
                    'description' => $update['description'] ?? $scene->description,
                    'is_restricted' => $update['is_restricted'] ?? $scene->is_restricted,
                ];

                if(isset($update['lat']) && isset($update['lng'])) {
                    $lat = $update['lat'];
                    $lng = $update['lng'];
                    $scene->update([
                        'location' => DB::raw("ST_SetSRID(ST_Point($lng, $lat), 4326)::geography")
                    ]);
                }
                
                $scene->update($updateData);
            }

            // 5. Uploads (New Scenes)
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

                // Resolve Area ID
                $targetAreaId = $upload['area_id'] ?? $area->id;
                if (str_starts_with($targetAreaId, 'new_') && isset($subAreaMap[$targetAreaId])) {
                    $targetAreaId = $subAreaMap[$targetAreaId];
                }

                $scene = new Scene();
                $scene->area_id = $targetAreaId; // Use resolved ID
                $scene->image_path = $newPath;
                $scene->name = $upload['name'];
                $scene->heading = $upload['heading'] ?? 0;
                $scene->type = 'navigasi';
                $scene->location_array = ['lat' => $upload['lat'] ?? 0, 'lng' => $upload['lng'] ?? 0];
                $scene->sort_order = Scene::where('area_id', $scene->area_id)->max('sort_order') + 1;
                $scene->is_restricted = $upload['is_restricted'] ?? false;
                $scene->save();

                \App\Jobs\ResizeImageJob::dispatch($scene);

                if (isset($upload['id'])) {
                    $tempIdMap[$upload['id']] = $scene->id;
                }
            }

            // 6. Links (Create/Update)
            foreach (($data['links'] ?? []) as $linkData) {
                // Resolve Source
                $sourceId = $linkData['source'];
                if (isset($tempIdMap[$sourceId])) $sourceId = $tempIdMap[$sourceId];
                if (!is_numeric($sourceId)) continue; // Skip if still invalid

                // Resolve Target
                $targetId = $linkData['target'];
                if (isset($tempIdMap[$targetId])) $targetId = $tempIdMap[$targetId];
                if (!is_numeric($targetId)) continue; 

                if (in_array($sourceId, $data['deletions'] ?? []) || in_array($targetId, $data['deletions'] ?? [])) {
                    continue; // Skip links involving deleted scenes
                }

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

    // --- HELPERS ---

    private function getGps($exifCoord, $hemi) {
        $degrees = count($exifCoord) > 0 ? $this->gps2Num($exifCoord[0]) : 0;
        $minutes = count($exifCoord) > 1 ? $this->gps2Num($exifCoord[1]) : 0;
        $seconds = count($exifCoord) > 2 ? $this->gps2Num($exifCoord[2]) : 0;

        $flip = ($hemi == 'W' or $hemi == 'S') ? -1 : 1;
        return $flip * ($degrees + $minutes / 60 + $seconds / 3600);
    }

    private function gps2Num($coordPart) {
        $parts = explode('/', $coordPart);
        if (count($parts) <= 0) return 0;
        if (count($parts) == 1) return $parts[0];
        return floatval($parts[0]) / floatval($parts[1]);
    }

    private function getXmpHeading($filepath) {
        $content = file_get_contents($filepath);
        $xmp_start = strpos($content, '<x:xmpmeta');
        $xmp_end = strpos($content, '</x:xmpmeta>');
        
        if ($xmp_start === false || $xmp_end === false) return null;
        
        $xmp_length = $xmp_end - $xmp_start + 12;
        $xmp_data = substr($content, $xmp_start, $xmp_length);
        
        if (preg_match('/PoseHeadingDegrees="([^"]+)"/', $xmp_data, $matches)) {
            return floatval($matches[1]);
        }
        if (preg_match('/<GPano:PoseHeadingDegrees>([^<]+)<\/GPano:PoseHeadingDegrees>/', $xmp_data, $matches)) {
            return floatval($matches[1]);
        }
        
        return null;
    }
}

function to_radians($degrees) {
    return $degrees * (M_PI / 180);
}
