<?php

namespace App\Services;

use App\Models\Drafts\SceneDraft;
use App\Models\Drafts\LinkDraft;
use App\Models\Drafts\AreaDraft;
use Illuminate\Support\Facades\DB;

class AutoLinkService
{
    protected $geoService;

    public function __construct(GeoService $geoService)
    {
        $this->geoService = $geoService;
    }

    /**
     * Execute Auto-Link algorithm.
     *
     * @param int|null $areaId
     * @param bool $replaceExisting
     * @param bool $previewOnly
     * @param float $radius In meters
     * @return array
     */
    public function execute($areaId, $replaceExisting, $previewOnly, $radius)
    {
        // 1. Fetch Candidates (Draft Scenes)
        $query = SceneDraft::query()
            ->whereNotNull('lat')
            ->whereNotNull('lng')
            ->where('marked_for_deletion', false)
            ->whereHas('area', fn($q) => $q->where('marked_for_deletion', false));

        $areaIds = null;
        if ($areaId) {
            // Get all descendant scene IDs
            $root = AreaDraft::find($areaId);
            if (!$root) {
                throw new \Exception('Area not found');
            }

            // Helper to get recursive IDs
            $areaIds = $this->getDescendantAreaIds($root);
            $query->whereIn('area_id', $areaIds);
        }

        $scenes = $query->get();

        // Stats Calculation
        $scenesWithoutGpsQuery = SceneDraft::query()
            ->where(function ($q) {
                $q->whereNull('lat')->orWhereNull('lng');
            })
            ->where('marked_for_deletion', false);

        if ($areaId && isset($areaIds)) {
            $scenesWithoutGpsQuery->whereIn('area_id', $areaIds);
        }

        $stats = [
            'existing_links' => 0,
            'target_areas' => [],
            'scenes_without_gps' => $scenesWithoutGpsQuery->count(),
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
            return $stats;
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
                    $dist = $this->geoService->calculateDistance($source->lat, $source->lng, $target->lat, $target->lng);

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
                        // Desired View Yaw = Target Bearing - Source Image Heading
                        $bearing = deg2rad($this->geoService->calculateBearing($source->lat, $source->lng, $target->lat, $target->lng));
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
            return $stats;

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
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
}
