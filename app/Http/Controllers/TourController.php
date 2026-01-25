<?php

namespace App\Http\Controllers;

use App\Models\Area;
use App\Models\Scene;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Services\AreaService;

class TourController extends Controller
{
    protected $areaService;

    public function __construct(AreaService $areaService)
    {
        $this->areaService = $areaService;
    }

    // PAGE 1: DASHBOARD MAP
    public function index()
    {
        $user = Auth::user();


        $menuQuery = Area::whereNull('parent_id')
            ->orderBy('priority', 'asc')
            ->orderBy('name', 'asc')
            ->visible()
            ->accessibleBy($user)
            ->with([
                // LEVEL 2
                'children' => fn($q) => $q->visible()->accessibleBy($user)->with([
                    'scenes' => fn($q) => $q->select('id', 'area_id', 'name', 'image_path', 'location')->orderBy('created_at')->orderBy('id'),
                    // LEVEL 3
                    'children' => fn($q2) => $q2->visible()->accessibleBy($user)->with([
                        'scenes' => fn($q) => $q->select('id', 'area_id', 'name', 'image_path', 'location')->orderBy('created_at')->orderBy('id')
                    ])
                ]),
                // LEVEL 1 (Root Scenes)
                'scenes' => fn($q) => $q->select('id', 'area_id', 'name', 'image_path', 'location')->orderBy('created_at')->orderBy('id')
            ]);


        $areaQuery = Area::query()
            ->orderBy('priority')
            ->orderBy('name')
            ->visible()
            ->accessibleBy($user)
            ->with([
                'scenes' => fn($q) => $q->orderBy('created_at')->orderBy('id')->select('id', 'area_id', 'name', 'image_path', 'location'),
                'children' => fn($q) => $q->visible()->accessibleBy($user)->with([
                    'scenes' => fn($q) => $q->orderBy('created_at')->orderBy('id')->select('id', 'area_id', 'name', 'image_path', 'location'),
                    'children' => fn($q2) => $q2->visible()->accessibleBy($user)->with([
                        'scenes' => fn($q) => $q->orderBy('created_at')->orderBy('id')->select('id', 'area_id', 'name', 'image_path', 'location')
                    ])
                ])
            ]);

        $markers = $areaQuery->get()->map(function ($area) {
            $firstScene = $area->scenes->first();
            $loc = $this->areaService->getEffectiveLocation($area, $firstScene);
            if ($loc['lat'] == 0 && $loc['lng'] == 0) {
                return null;
            }

            return [
                'id' => $area->id,
                'name' => $area->name,
                'description' => $area->description,
                'level' => $area->level,
                'is_container' => $area->is_container,
                'lat' => $loc['lat'],
                'lng' => $loc['lng'],
                'color' => $area->marker_color,
                'thumbnail' => $firstScene ? asset('storage/' . $firstScene->image_path) : null,
                'first_scene_id' => $firstScene ? $firstScene->id : null,
                'type' => 'area',

                'all_child_scenes' => $area->is_container ? $this->areaService->collectAllChildScenes($area) : [],
                'scenes' => (!$area->is_container || $area->level === 3) ? $area->scenes->map(function ($scene) use ($area) {
                    $locationData = $scene->location_array;
                    return [
                        'id' => $scene->id,
                        'name' => $scene->name ?? $area->name,
                        'image_path' => asset('storage/' . $scene->image_path),
                        'lat' => ($locationData && ($locationData['lat'] != 0 || $locationData['lng'] != 0)) ? $locationData['lat'] : null,
                        'lng' => ($locationData && ($locationData['lat'] != 0 || $locationData['lng'] != 0)) ? $locationData['lng'] : null,
                    ];
                })->toArray() : [],
            ];
        })
            ->filter()
            ->values();

        return Inertia::render('Tour/Index', [
            'menuData' => $menuQuery->get(),
            'markers' => $markers,
            'user' => $user ? ['name' => $user->name, 'role' => $user->role] : null
        ]);
    }

    // PAGE 2: VIEWER 360
    public function show(Request $request, Scene $scene)
    {
        $user = Auth::user();
        $isPegawai = $user && ($user->role === 'pegawai' || $user->role === 'admin');
        $menuQuery = Area::whereNull('parent_id')
            ->orderBy('priority', 'asc')
            ->orderBy('name', 'asc')
            ->visible()
            ->accessibleBy($user)
            ->with([
                'children' => fn($q) => $q->visible()->accessibleBy($user)->with([
                    'scenes' => fn($q) => $q->select('id', 'area_id')->orderBy('created_at')->orderBy('id'),
                    'children' => fn($q2) => $q2->visible()->accessibleBy($user)->with([
                        'scenes' => fn($q) => $q->select('id', 'area_id')->orderBy('created_at')->orderBy('id')
                    ])
                ]),
                'scenes' => fn($q) => $q->select('id', 'area_id')->orderBy('created_at')->orderBy('id')
            ]);

        $areaQuery = Area::query()
            ->whereNotNull('lat')
            ->whereNotNull('lng')
            ->orderBy('priority')
            ->orderBy('name')
            ->visible()
            ->accessibleBy($user)
            ->with([
                'scenes' => fn($q) => $q->orderBy('created_at')->orderBy('id')->select('id', 'area_id', 'name', 'image_path', 'location'),
                'children' => fn($q) => $q->visible()->accessibleBy($user)->with([
                    'scenes' => fn($q) => $q->orderBy('created_at')->orderBy('id')->select('id', 'area_id', 'name', 'image_path', 'location'),
                    'children' => fn($q2) => $q2->visible()->accessibleBy($user)->with([
                        'scenes' => fn($q) => $q->orderBy('created_at')->orderBy('id')->select('id', 'area_id', 'name', 'image_path', 'location')
                    ])
                ])
            ]);

        $markers = $areaQuery->get()->map(function ($area) {
            $firstScene = $area->scenes->first();
            $lat = (float) $area->lat;
            $lng = (float) $area->lng;

            return [
                'id' => $area->id,
                'name' => $area->name,
                'description' => $area->description,
                'level' => $area->level,
                'is_container' => $area->is_container,
                'lat' => $lat,
                'lng' => $lng,
                'color' => $area->marker_color,
                'thumbnail' => $firstScene ? asset('storage/' . $firstScene->image_path) : null,
                'first_scene_id' => $firstScene ? $firstScene->id : null,
                'type' => 'area',
                'all_child_scenes' => $area->is_container ? $this->areaService->collectAllChildScenes($area) : [],
                'scenes' => (!$area->is_container || $area->level === 3) ? $area->scenes->map(fn($s) => [
                    'id' => $s->id,
                    'name' => $s->name ?? $area->name,
                    'image_path' => asset('storage/' . $s->image_path),
                ])->toArray() : [],
            ];
        });

        $scene->load(['area.parent', 'outgoingLinks.targetScene.area', 'infoSpots']);
        $hierarchy = [];
        $tempArea = $scene->area;
        while ($tempArea) {
            $hierarchy[] = $tempArea->name;
            $tempArea = $tempArea->parent;
        }
        $hierarchy = array_reverse($hierarchy);

        $sceneData = [
            'id' => $scene->id,
            'hierarchy' => $hierarchy,
            'created_at' => $scene->created_at->format('d M Y'),
            'image_url' => asset('storage/' . $scene->image_path),
            'initial_yaw' => (float) $scene->initial_yaw,
            'heading' => (float) $scene->heading,
            'lat' => $scene->location_array['lat'],
            'lng' => $scene->location_array['lng'],

            'hotspots' => $scene->outgoingLinks
                ->load(['targetScene.area.parent.parent'])
                ->filter(function ($link) use ($isPegawai) {
                    if (is_null($link->target_scene_id) || !$link->targetScene)
                        return false;
                    $area = $link->targetScene->area;
                    while ($area) {
                        if ($area->is_hidden)
                            return false;
                        $area = $area->parent;
                    }


                    if (!$isPegawai) {
                        $area = $link->targetScene->area;
                        while ($area) {
                            if ($area->is_restricted)
                                return false;
                            $area = $area->parent;
                        }
                    }

                    return true;
                })
                ->map(fn($link) => [
                    'id' => $link->id,
                    'target_id' => $link->target_scene_id,
                    'type' => $link->type,
                    'yaw' => (float) $link->yaw,
                    'pitch' => (float) $link->pitch,
                    'text' => $link->type === 'gateway'
                        ? 'Masuk: ' . ($link->targetScene->area->name ?? '-')
                        : ($link->targetScene->name ?? 'Maju'),
                ])->values(),

            'info_spots' => $scene->infoSpots->map(fn($infoSpot) => [
                'id' => $infoSpot->id,
                'title' => $infoSpot->title,
                'description' => $infoSpot->description,
                'yaw' => (float) $infoSpot->yaw,
                'pitch' => (float) $infoSpot->pitch,
            ])->values(),
        ];

        return Inertia::render('Tour/Viewer', [
            'scene' => $sceneData,
            'initial_heading' => $request->query('heading'),
            'menuData' => $menuQuery->get(),
            'markers' => $markers,
        ]);
    }
}