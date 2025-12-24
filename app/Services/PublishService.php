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

            // 2. Publish Content (Recursive)
            $this->publishNode($rootDraft);

            // 3. Post-Publish Integrity Check
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

            // 4. Update Sync State (Post-Publish Synced State 3)
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

    private function publishNode($draft)
    {
        // Recursively publish children first? Or parent first? 
        // Parent first usually needed for FKs.

        // --- DELETION LOGIC ---
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
                $this->publishNode($child);
            foreach ($draft->scenes as $scene)
                $this->publishNode($scene);
        } elseif ($draft instanceof SceneDraft) {
            $this->upsertScene($draft);
            // Process Links
            foreach ($draft->links as $link)
                $this->publishNode($link);
        } elseif ($draft instanceof LinkDraft) {
            $this->upsertLink($draft);
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
            if ($draft instanceof AreaDraft)
                Area::destroy($draft->published_id);
            elseif ($draft instanceof SceneDraft)
                Scene::destroy($draft->published_id);
            elseif ($draft instanceof LinkDraft)
                Link::destroy($draft->published_id);
        }

        // Remove Draft (Since it's done) or Keep as tombstone?
        // User request: "Draft menjadi identik 100% dengan published"
        // If Live is deleted, Draft should also be deleted to match "Nothingness"?
        // Yes. Logic: State 3 (Synced). Live has nothing -> Draft should have nothing.
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
