<?php

namespace App\Http\Controllers;

use App\Models\Area;
use App\Models\Scene;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TourController extends Controller
{
    // PAGE 1: DASHBOARD MAP
    public function index()
    {
        $user = Auth::user();
        $isPegawai = $user && ($user->role === 'pegawai' || $user->role === 'admin');

        // 1. Data Menu Sidebar (Hierarki 3 Level)
        $menuQuery = Area::whereNull('parent_id')
            ->orderBy('priority', 'asc')
            ->orderBy('name', 'asc')
            ->with([
                // LEVEL 2 (Anak: Bagonjong 1)
                'children' => function($q) use ($isPegawai) {
                    if (!$isPegawai) $q->where('is_restricted', false);
                    
                    $q->with([
                        // PERBAIKAN 1: Hapus 'name' disini
                        'scenes' => function($q) {
                            $q->select('id', 'area_id')->orderBy('sort_order');
                        }, 
                        
                        // LEVEL 3 (Cucu: Ruang Unit MR)
                        'children' => function($q2) use ($isPegawai) {
                            if (!$isPegawai) $q2->where('is_restricted', false);
                            
                            // PERBAIKAN 2: Hapus 'name' disini juga (INI YANG SERING LUPA)
                            $q2->with(['scenes' => function($q) {
                                $q->select('id', 'area_id')->orderBy('sort_order');
                            }]); 
                        }
                    ]);
                },
                // LEVEL 1 (Root)
                // PERBAIKAN 3: Hapus 'name' disini
                'scenes' => function($q) {
                    $q->select('id', 'area_id')->orderBy('sort_order');
                } 
            ]);

        if (!$isPegawai) {
            $menuQuery->where('is_restricted', false);
        }

        // 2. Data Marker Peta (Leaf Areas Only)
        $areaQuery = Area::query()
            ->doesntHave('children') // Hanya area yang tidak punya anak (Leaf)
            ->whereHas('scenes')     // Hanya area yang punya scene
            ->with(['scenes' => function($q) {
                // FIXED: Removed 'name' from select as it does not exist in scenes table
                $q->orderBy('sort_order')->orderBy('id')->select('id', 'area_id', 'location', 'image_path');
            }]);

        if (!$isPegawai) {
            $areaQuery->where('is_restricted', false);
        }

        $markers = $areaQuery->get()->map(function ($area) {
            $firstScene = $area->scenes->first();
            
            // Collect all scene locations for path nodes
            $pathNodes = $area->scenes->map(function($scene) use ($area) {
                if (!$scene->location_array) return null;
                return [
                    'id' => $scene->id,
                    'name' => $area->name, // FIXED: Use Area Name as scene has no name
                    'lat' => $scene->location_array['lat'],
                    'lng' => $scene->location_array['lng'],
                ];
            })->filter()->values();

            return [
                'id' => $area->id, // Use Area ID for marker
                'name' => $area->name,
                'description' => $area->description,
                'lat' => $firstScene->location_array['lat'],
                'lng' => $firstScene->location_array['lng'],
                'thumbnail' => asset('storage/' . $firstScene->image_path),
                'first_scene_id' => $firstScene->id,
                'path_nodes' => $pathNodes,
                'type' => 'area', // Marker type
            ];
        });

        return Inertia::render('Tour/Dashboard', [
            'menuData' => $menuQuery->get(),
            'markers' => $markers,
            'user' => $user ? ['name' => $user->name] : null
        ]);
    }

    // PAGE 2: VIEWER 360
    public function show(Request $request, Scene $scene)
    {
        $user = Auth::user();
        $isPegawai = $user && ($user->role === 'pegawai' || $user->role === 'admin');

        // 1. Data Menu Sidebar (Hierarki 3 Level) - COPIED FROM INDEX
        $menuQuery = Area::whereNull('parent_id')
            ->orderBy('priority', 'asc')
            ->orderBy('name', 'asc')
            ->with([
                'children' => function($q) use ($isPegawai) {
                    if (!$isPegawai) $q->where('is_restricted', false);
                    $q->with([
                        'scenes' => function($q) {
                            $q->select('id', 'area_id')->orderBy('sort_order');
                        }, 
                        'children' => function($q2) use ($isPegawai) {
                            if (!$isPegawai) $q2->where('is_restricted', false);
                            $q2->with(['scenes' => function($q) {
                                $q->select('id', 'area_id')->orderBy('sort_order');
                            }]); 
                        }
                    ]);
                },
                'scenes' => function($q) {
                    $q->select('id', 'area_id')->orderBy('sort_order');
                } 
            ]);

        if (!$isPegawai) {
            $menuQuery->where('is_restricted', false);
        }

        // 2. Data Marker Peta (Leaf Areas Only) - COPIED FROM INDEX
        $areaQuery = Area::query()
            ->doesntHave('children')
            ->whereHas('scenes')
            ->with(['scenes' => function($q) {
                $q->orderBy('sort_order')->orderBy('id')->select('id', 'area_id', 'location', 'image_path');
            }]);

        if (!$isPegawai) {
            $areaQuery->where('is_restricted', false);
        }

        $markers = $areaQuery->get()->map(function ($area) {
            $firstScene = $area->scenes->first();
            $pathNodes = $area->scenes->map(function($scene) use ($area) {
                if (!$scene->location_array) return null;
                return [
                    'id' => $scene->id,
                    'name' => $area->name,
                    'lat' => $scene->location_array['lat'],
                    'lng' => $scene->location_array['lng'],
                ];
            })->filter()->values();

            return [
                'id' => $area->id,
                'name' => $area->name,
                'description' => $area->description,
                'lat' => $firstScene->location_array['lat'],
                'lng' => $firstScene->location_array['lng'],
                'thumbnail' => asset('storage/' . $firstScene->image_path),
                'first_scene_id' => $firstScene->id,
                'path_nodes' => $pathNodes,
                'type' => 'area',
            ];
        });

        $scene->load(['area.parent', 'outgoingLinks.targetScene.area']);

        // Build Hierarchy (Bottom-Up then Reverse)
        $hierarchy = [];
        $tempArea = $scene->area;
        while ($tempArea) {
            $hierarchy[] = $tempArea->name;
            $tempArea = $tempArea->parent;
        }
        $hierarchy = array_reverse($hierarchy); // Root -> Child -> Grandchild

        $sceneData = [
            'id' => $scene->id,
            'hierarchy' => $hierarchy, // Array of area names
            'created_at' => $scene->created_at->format('d M Y'), // Format Date
            
            'image_url' => asset('storage/' . $scene->image_path),
            'initial_yaw' => (float) $scene->initial_yaw,
            'heading' => (float) $scene->heading, 
            'lat' => $scene->location_array['lat'],
            'lng' => $scene->location_array['lng'],
            
            'hotspots' => $scene->outgoingLinks->map(function ($link) {
                return [
                    'id' => $link->id,
                    'target_id' => $link->target_scene_id,
                    'type' => $link->type,
                    'yaw' => (float) $link->yaw,
                    'text' => $link->type === 'portal' 
                        ? 'Masuk: ' . ($link->targetScene->area->name ?? '-') 
                        : ($link->targetScene->name ?? 'Maju'),
                ];
            }),
        ];

        return Inertia::render('Tour/Viewer', [
            'scene' => $sceneData,
            'initial_heading' => $request->query('heading'),
            'menuData' => $menuQuery->get(),
            'markers' => $markers,
        ]);
    }
}