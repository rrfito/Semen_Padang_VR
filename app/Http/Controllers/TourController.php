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
                        'scenes' => function($q) {
                            $q->select('id', 'area_id', 'name', 'image_path')->orderBy('sort_order');
                        }, 
                        
                        // LEVEL 3 (Cucu: Ruang Unit MR)
                        'children' => function($q2) use ($isPegawai) {
                            if (!$isPegawai) $q2->where('is_restricted', false);
                            
                            $q2->with(['scenes' => function($q) {
                                $q->select('id', 'area_id', 'name', 'image_path')->orderBy('sort_order');
                            }]); 
                        }
                    ]);
                },
                // LEVEL 1 (Root)
                'scenes' => function($q) {
                    $q->select('id', 'area_id', 'name', 'image_path')->orderBy('sort_order');
                } 
            ]);

        if (!$isPegawai) {
            $menuQuery->where('is_restricted', false);
        }

        // 2. Data Marker Peta (Leaf Areas Only)
        // 2. Data Marker Peta (Modified: All Areas that have valid locations)
        // Logic: Tampilkan marker untuk Area yang memiliki lat/lng (Parent/Grandparent/Logic updated)
        $areaQuery = Area::query()
            ->whereNotNull('lat')
            ->whereNotNull('lng')
            ->orderBy('priority')
            ->orderBy('name')
            ->with(['scenes' => function($q) {
                 // Ambil first scene untuk thumbnail
                 $q->orderBy('sort_order')->orderBy('id')->select('id', 'area_id', 'image_path');
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
                'id' => $area->id,
                'name' => $area->name,
                'description' => $area->description,
                'lat' => (float)$area->lat, // Use Area Lat
                'lng' => (float)$area->lng, // Use Area Lng
                'color' => $area->marker_color, // Use Accessor
                'thumbnail' => $firstScene ? asset('storage/' . $firstScene->image_path) : null,
                'first_scene_id' => $firstScene ? $firstScene->id : null,
                'path_nodes' => [], // Disable path nodes for cleaner map
                'type' => 'area',
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
        // 2. Data Marker Peta (Modified: All Areas that have valid locations)
        $areaQuery = Area::query()
            ->whereNotNull('lat')
            ->whereNotNull('lng')
            ->orderBy('priority')
            ->orderBy('name')
            ->with(['scenes' => function($q) {
                 $q->orderBy('sort_order')->orderBy('id')->select('id', 'area_id', 'image_path');
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
                'lat' => (float)$area->lat,
                'lng' => (float)$area->lng,
                'color' => $area->marker_color,
                'thumbnail' => $firstScene ? asset('storage/' . $firstScene->image_path) : null,
                'first_scene_id' => $firstScene ? $firstScene->id : null,
                'path_nodes' => [],
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