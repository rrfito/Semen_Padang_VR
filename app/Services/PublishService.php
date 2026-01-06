<?php

namespace App\Services;

use App\Models\Area;
use App\Models\Scene;
use App\Models\Link;
use App\Models\Drafts\AreaDraft;
use App\Models\Drafts\SceneDraft;
use App\Models\Drafts\LinkDraft;
use App\Models\Drafts\DraftSyncState;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class PublishService
{
    /**
     * Publish a specific Root Draft + Descendants
     * Atomic Operation with Integrity Verification
     */
    public function publish(AreaDraft $rootDraft, User $publisher)
    {
        return DB::transaction(function () use ($rootDraft, $publisher) {

            // 1. Pre-Flight Check
            $this->verifyDraftIntegrity($rootDraft);

            // 2. Publish Content (Pass 1: Struct & Nodes)
            $linksToProcess = [];
            $this->publishNode($rootDraft, $linksToProcess);

            // 3. Publish Links (Pass 2: Connections)
            // Now that all scenes have Live IDs, we can safely link them.
            foreach ($linksToProcess as $linkDraft) {
                $this->upsertLink($linkDraft);
            }
            // 4. Post-Publish Integrity Check
            $liveRoot = Area::find($rootDraft->published_id);

            // Special Case: If Root was deleted, this is expected behavior
            if ($rootDraft->marked_for_deletion) {
                if ($liveRoot) {
                    throw new \Exception("Live Root still exists despite deletion request.");
                }
                // Cleanup Sync State
                DraftSyncState::where('root_draft_id', $rootDraft->id)->delete();
                return true;
            }

            if (!$liveRoot)
                throw new \Exception("Live Root not found after publish.");

            $newChecksum = $this->calculateLiveChecksum($liveRoot);

            // 5. Update Sync State (Post-Publish Synced State 3)
            DraftSyncState::updateOrCreate(
                ['root_draft_id' => $rootDraft->id],
                [
                    'status' => 'synced',
                    'live_checksum' => $newChecksum,
                    'last_synced_at' => now()
                ]
            );

            return true;
        });
    }

    private function publishNode($draft, array &$linksToProcess)
    {
        // Recursively publish children first? Or parent first? 
        // Parent first usually needed for FKs.

        // --- DELETION LOGIC ---
        if ($draft->marked_for_deletion) {
            \Illuminate\Support\Facades\Log::info("Publish: Force Deleting Node {$draft->id} Type: " . get_class($draft));
            $this->forceDeleteNode($draft);
            return; // Stop processing this branch
        }

        // --- UPSERT LOGIC ---
        // 1. Publish This Node
        if ($draft instanceof AreaDraft) {
            $this->upsertArea($draft);
            // Process Children & Scenes
            foreach ($draft->children as $child)
                $this->publishNode($child, $linksToProcess);
            foreach ($draft->scenes as $scene)
                $this->publishNode($scene, $linksToProcess);
        } elseif ($draft instanceof SceneDraft) {
            $this->upsertScene($draft);
            // Collect Links for Pass 2
            foreach ($draft->links as $link) {
                if ($link->marked_for_deletion) {
                    $this->forceDeleteNode($link);
                } else {
                    $linksToProcess[] = $link;
                }
            }
        } elseif ($draft instanceof LinkDraft) {
            // Should not happen if called correctly, but consistent
            if ($draft->marked_for_deletion) {
                $this->forceDeleteNode($draft);
            } else {
                $linksToProcess[] = $draft;
            }
        }
    }

    private function forceDeleteNode($draft)
    {
        // 1. Recurse Children First (Bottom-Up)
        if ($draft instanceof AreaDraft) {
            foreach ($draft->children as $child)
                $this->forceDeleteNode($child);
            foreach ($draft->scenes as $scene)
                $this->forceDeleteNode($scene);
        } elseif ($draft instanceof SceneDraft) {
            foreach ($draft->links as $link)
                $this->forceDeleteNode($link);
        }

        // 2. Delete Self
        $this->handleDeletion($draft);
    }

    private function handleDeletion($draft)
    {
        // Hard Delete Live Record
        if ($draft->published_id) {
            $live = null;
            if ($draft instanceof AreaDraft)
                $live = Area::find($draft->published_id);
            elseif ($draft instanceof SceneDraft)
                $live = Scene::find($draft->published_id);
            elseif ($draft instanceof LinkDraft)
                $live = Link::find($draft->published_id);

            if ($live) {
                $live->delete(); // Triggers cascading DB deletes if config or Eloquent events
            }
        }

        // Remove Draft (Since it's done)
        $draft->delete();
    }

    private function upsertArea(AreaDraft $draft)
    {
        $data = [
            'name' => $draft->name,
            'description' => $draft->description,
            'level' => $draft->level,
            'is_container' => $draft->is_container,
            'priority' => $draft->priority,
            'lat' => $draft->lat,
            'lng' => $draft->lng,
            'is_restricted' => $draft->is_restricted,
            'is_hidden' => $draft->is_hidden,
            'updated_at' => $draft->updated_at, // Sync timestamps?
        ];

        if ($draft->published_id) {
            Area::where('id', $draft->published_id)->update($data);
        } else {
            // Create New Live
            // Need correct parent_id (Live Parent)
            $liveParentId = $draft->parent ? $draft->parent->published_id : null;

            $live = Area::create(array_merge($data, ['parent_id' => $liveParentId]));

            // Link Draft -> New Live
            $draft->update(['published_id' => $live->id]);
        }
    }

    private function upsertScene(SceneDraft $draft)
    {
        $data = [
            'name' => $draft->name,
            'image_path' => $draft->image_path,
            'heading' => $draft->heading,
            'can_be_gateway' => $draft->can_be_gateway,
            'updated_at' => $draft->updated_at,
        ];

        // Need live Area ID
        $liveAreaId = $draft->area->published_id;

        if ($draft->published_id) {
            Scene::where('id', $draft->published_id)->update($data);
            $liveId = $draft->published_id;
        } else {
            $live = Scene::create(array_merge($data, ['area_id' => $liveAreaId]));
            $draft->update(['published_id' => $live->id]);
            $liveId = $live->id;
        }

        // Sync PostGIS Location if valid
        if ($draft->lat && $draft->lng) {
            DB::statement(
                "UPDATE scenes SET location = ST_SetSRID(ST_Point(?, ?), 4326)::geography WHERE id = ?",
                [$draft->lng, $draft->lat, $liveId]
            );
        }
    }

    private function upsertLink(LinkDraft $draft)
    {
        $data = [
            'type' => $draft->type,
            'yaw' => $draft->yaw,
            'pitch' => $draft->pitch,
            'distance' => $draft->distance,
            'updated_at' => $draft->updated_at,
        ];

        // Live Source/Target IDs
        $liveSource = $draft->sourceScene->published_id;
        $liveTarget = $draft->targetScene ? $draft->targetScene->published_id : null;

        if (!$liveSource)
            return; // Warning?

        if ($draft->published_id) {
            Link::where('id', $draft->published_id)->update($data);
        } else {
            $live = Link::create(array_merge($data, [
                'source_scene_id' => $liveSource,
                'target_scene_id' => $liveTarget
            ]));
            $draft->update(['published_id' => $live->id]);
        }
    }

    private function verifyDraftIntegrity(AreaDraft $root)
    {
        // Ensure not 'stale'
        if ($root->syncState && $root->syncState->status === 'stale') {
            throw new \Exception("Cannot publish stale draft. Please discard or manual merge.");
        }
    }

    // Checksum Duplicate Logic (Should be centralized or trait)
    private function calculateLiveChecksum(Area $root): string
    {
        return md5($root->updated_at . $root->children()->count() . $root->scenes()->count());
    }
}
