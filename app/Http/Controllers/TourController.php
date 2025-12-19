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
        $menuQuery = Area::where('is_published', true)
            ->whereNull('parent_id')
            ->orderBy('priority', 'asc')
            ->orderBy('name', 'asc')
            ->with([
                // LEVEL 2 (Anak: Bagonjong 1)
                'children' => function ($q) use ($isPegawai) {
                    $q->where('is_published', true);
                    if (!$isPegawai)
                        $q->where('is_restricted', false);

                    $q->with([
                        'scenes' => function ($q) {
                            $q->where('is_published', true)
                                ->select('id', 'area_id', 'name', 'image_path')->orderBy('created_at')->orderBy('id');
                        },

                        // LEVEL 3 (Cucu: Ruang Unit MR)
                        'children' => function ($q2) use ($isPegawai) {
                            $q2->where('is_published', true);
                            if (!$isPegawai)
                                $q2->where('is_restricted', false);

                            $q2->with([
                                'scenes' => function ($q) {
                                    $q->where('is_published', true)
                                        ->select('id', 'area_id', 'name', 'image_path')->orderBy('created_at')->orderBy('id');
                                }
                            ]);
                        }
                    ]);
                },
                // LEVEL 1 (Root)
                'scenes' => function ($q) {
                    $q->where('is_published', true)
                        ->select('id', 'area_id', 'name', 'image_path')->orderBy('created_at')->orderBy('id');
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
            ->where('is_published', true)
            ->with([
                'scenes' => function ($q) {
                    // Ambil scene dengan location data untuk path
                    $q->where('is_published', true)
                        ->orderBy('created_at')->orderBy('id')
                        ->select('id', 'area_id', 'name', 'image_path', 'location', 'is_published');
                },
                // Eager load children hierarchy (CRITICAL for $collectChildScenes)
                'children' => function ($q) use ($isPegawai) {
                    $q->where('is_published', true);
                    if (!$isPegawai)
                        $q->where('is_restricted', false);
                },
                'children.scenes' => function ($q) {
                    $q->where('is_published', true)
                        ->orderBy('created_at')->orderBy('id')
                        ->select('id', 'area_id', 'name', 'image_path', 'location', 'is_published');
                },
                'children.children' => function ($q) use ($isPegawai) {
                    $q->where('is_published', true);
                    if (!$isPegawai)
                        $q->where('is_restricted', false);
                },
                'children.children.scenes' => function ($q) {
                    // For 3 levels deep
                    $q->where('is_published', true)
                        ->orderBy('created_at')->orderBy('id')
                        ->select('id', 'area_id', 'name', 'image_path', 'location', 'is_published');
                }
            ]);

        if (!$isPegawai) {
            $areaQuery->where('is_restricted', false);
        }

        // Helper function to collect all scenes recursively from children
        $collectChildScenes = function ($area) use (&$collectChildScenes) {
            $scenes = [];

            // Add direct scenes
            foreach ($area->scenes as $scene) {
                // FIX: location_array returns ['lat' => 0, 'lng' => 0] when null,
                // so we need to check if coordinates are VALID (not 0,0)
                $locationData = $scene->location_array;

                \Log::info('[COLLECT] Scene: ' . $scene->name .
                    ', is_published: ' . ($scene->is_published ? 'YES' : 'NO') .
                    ', locationData: ' . json_encode($locationData) .
                    ', lat!=0 || lng!=0: ' . (($locationData['lat'] != 0 || $locationData['lng'] != 0) ? 'YES' : 'NO'));

                if (
                    $scene->is_published && $locationData &&
                    ($locationData['lat'] != 0 || $locationData['lng'] != 0)
                ) {
                    $scenes[] = [
                        'id' => $scene->id,
                        'name' => $scene->name ?? $area->name,
                        'image_path' => $scene->image_path,
                        'lat' => $locationData['lat'],
                        'lng' => $locationData['lng'],
                    ];
                    \Log::info('[COLLECT] ✓ ADDED to polyline');
                } else {
                    \Log::info('[COLLECT] ✗ SKIPPED');
                }
            }

            // Recursively add children's scenes
            if ($area->children) {
                foreach ($area->children as $child) {
                    $scenes = array_merge($scenes, $collectChildScenes($child));
                }
            }

            return $scenes;
        };

        $markers = $areaQuery->get()->map(function ($area) use ($collectChildScenes) {
            $firstScene = $area->scenes->first();

            // DEBUG: Check if Bagonjong I
            if ($area->name === 'Bagonjong I') {
                \Log::info('=== BAGONJONG I DEBUG ===');
                \Log::info('Area ID: ' . $area->id);
                \Log::info('Is Container: ' . $area->is_container);
                \Log::info('Has children loaded: ' . ($area->children ? count($area->children) : 'NULL'));
                if ($area->children) {
                    foreach ($area->children as $child) {
                        \Log::info('  Child: ' . $child->name . ' (scenes: ' . count($child->scenes) . ')');
                    }
                }
                $childScenes = $collectChildScenes($area);
                \Log::info('Collected child scenes: ' . count($childScenes));
                foreach ($childScenes as $s) {
                    \Log::info('  - ' . $s['name']);
                }
            }

            return [
                'id' => $area->id,
                'name' => $area->name,
                'description' => $area->description,
                'level' => $area->level,
                'is_container' => $area->is_container,
                'lat' => (float) $area->lat,
                'lng' => (float) $area->lng,
                'color' => $area->marker_color,
                'thumbnail' => $firstScene ? asset('storage/' . $firstScene->image_path) : null,
                'first_scene_id' => $firstScene ? $firstScene->id : null,
                'type' => 'area',

                // For container areas: collect all child scenes for path display
                'all_child_scenes' => $area->is_container ? $collectChildScenes($area) : [],

                // For leaf areas: direct scenes list WITH GPS coordinates
                'scenes' => !$area->is_container || $area->level === 3 ? $area->scenes->map(function ($scene) use ($area) {
                    $locationData = $scene->location_array;
                    return [
                        'id' => $scene->id,
                        'name' => $scene->name ?? $area->name,
                        'image_path' => asset('storage/' . $scene->image_path),
                        // Include GPS coordinates for polyline rendering
                        'lat' => ($locationData && ($locationData['lat'] != 0 || $locationData['lng'] != 0)) ? $locationData['lat'] : null,
                        'lng' => ($locationData && ($locationData['lat'] != 0 || $locationData['lng'] != 0)) ? $locationData['lng'] : null,
                    ];
                })->toArray() : [],
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
        $menuQuery = Area::where('is_published', true)
            ->whereNull('parent_id')
            ->orderBy('priority', 'asc')
            ->orderBy('name', 'asc')
            ->with([
                'children' => function ($q) use ($isPegawai) {
                    $q->where('is_published', true);
                    if (!$isPegawai)
                        $q->where('is_restricted', false);
                    $q->with([
                        'scenes' => function ($q) {
                            $q->where('is_published', true)
                                ->select('id', 'area_id')->orderBy('created_at')->orderBy('id');
                        },
                        'children' => function ($q2) use ($isPegawai) {
                            $q2->where('is_published', true);
                            if (!$isPegawai)
                                $q2->where('is_restricted', false);
                            $q2->with([
                                'scenes' => function ($q) {
                                    $q->where('is_published', true)
                                        ->select('id', 'area_id')->orderBy('created_at')->orderBy('id');
                                }
                            ]);
                        }
                    ]);
                },
                'scenes' => function ($q) {
                    $q->where('is_published', true)
                        ->select('id', 'area_id')->orderBy('created_at')->orderBy('id');
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
            ->where('is_published', true)
            ->with([
                'scenes' => function ($q) {
                    $q->where('is_published', true)
                        ->orderBy('created_at')->orderBy('id')
                        ->select('id', 'area_id', 'name', 'image_path', 'location');
                },
                // Eager load children hierarchy (CRITICAL for $collectChildScenes)
                'children' => function ($q) use ($isPegawai) {
                    $q->where('is_published', true);
                    if (!$isPegawai)
                        $q->where('is_restricted', false);
                },
                'children.scenes' => function ($q) {
                    $q->where('is_published', true)
                        ->orderBy('created_at')->orderBy('id')
                        ->select('id', 'area_id', 'name', 'image_path', 'location');
                },
                'children.children' => function ($q) use ($isPegawai) {
                    $q->where('is_published', true);
                    if (!$isPegawai)
                        $q->where('is_restricted', false);
                },
                'children.children.scenes' => function ($q) {
                    // For 3 levels deep
                    $q->where('is_published', true)
                        ->orderBy('created_at')->orderBy('id')
                        ->select('id', 'area_id', 'name', 'image_path', 'location');
                }
            ]);

        if (!$isPegawai) {
            $areaQuery->where('is_restricted', false);
        }

        // Helper function to collect all scenes recursively from children
        $collectChildScenes = function ($area) use (&$collectChildScenes) {
            $scenes = [];

            // Add direct scenes
            foreach ($area->scenes as $scene) {
                // FIX: location_array returns ['lat' => 0, 'lng' => 0] when null,
                // so we need to check if coordinates are VALID (not 0,0)
                $locationData = $scene->location_array;
                if (
                    $scene->is_published && $locationData &&
                    ($locationData['lat'] != 0 || $locationData['lng'] != 0)
                ) {
                    $scenes[] = [
                        'id' => $scene->id,
                        'name' => $scene->name ?? $area->name,
                        'image_path' => $scene->image_path,
                        'lat' => $locationData['lat'],
                        'lng' => $locationData['lng'],
                    ];
                }
            }

            // Recursively add children's scenes
            if ($area->children) {
                foreach ($area->children as $child) {
                    $scenes = array_merge($scenes, $collectChildScenes($child));
                }
            }

            return $scenes;
        };

        $markers = $areaQuery->get()->map(function ($area) use ($collectChildScenes) {
            $firstScene = $area->scenes->first();

            return [
                'id' => $area->id,
                'name' => $area->name,
                'description' => $area->description,
                'level' => $area->level,
                'is_container' => $area->is_container,
                'lat' => (float) $area->lat,
                'lng' => (float) $area->lng,
                'color' => $area->marker_color,
                'thumbnail' => $firstScene ? asset('storage/' . $firstScene->image_path) : null,
                'first_scene_id' => $firstScene ? $firstScene->id : null,
                'type' => 'area',

                // For container areas: collect all child scenes for path display
                'all_child_scenes' => $area->is_container ? $collectChildScenes($area) : [],

                // For leaf areas: direct scenes list
                'scenes' => !$area->is_container || $area->level === 3 ? $area->scenes->map(function ($scene) use ($area) {
                    return [
                        'id' => $scene->id,
                        'name' => $scene->name ?? $area->name,
                        'image_path' => asset('storage/' . $scene->image_path),
                    ];
                })->toArray() : [],
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