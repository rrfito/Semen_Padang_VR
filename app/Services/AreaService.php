<?php

namespace App\Services;

use App\Models\Area;

class AreaService
{
    /**
     * Recursively collect all scenes from an area and its children.
     * Only includes scenes with valid locations.
     */
    public function collectAllChildScenes(Area $area)
    {
        $scenes = [];

        // Direct scenes
        foreach ($area->scenes as $scene) {
            $locationData = $scene->location_array;
            if ($locationData && ($locationData['lat'] != 0 || $locationData['lng'] != 0)) {
                $scenes[] = [
                    'id' => $scene->id,
                    'name' => $scene->name ?? $area->name,
                    'image_path' => $scene->image_path,
                    'lat' => $locationData['lat'],
                    'lng' => $locationData['lng'],
                ];
            }
        }

        // Children scenes
        if ($area->children) {
            foreach ($area->children as $child) {
                $scenes = array_merge($scenes, $this->collectAllChildScenes($child));
            }
        }

        return $scenes;
    }

    /**
     * Get effective location of an area.
     * Fallback to first scene's location if area location is missing.
     */
    public function getEffectiveLocation(Area $area, $firstScene = null)
    {
        $lat = (float) $area->lat;
        $lng = (float) $area->lng;

        if (($lat == 0 && $lng == 0) && $firstScene) {
            $sceneLoc = $firstScene->location_array;
            if ($sceneLoc && ($sceneLoc['lat'] != 0 || $sceneLoc['lng'] != 0)) {
                $lat = (float) $sceneLoc['lat'];
                $lng = (float) $sceneLoc['lng'];
            }
        }

        return ['lat' => $lat, 'lng' => $lng];
    }
}
