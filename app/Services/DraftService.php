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
use Illuminate\Support\Collection;

class DraftService
{
    /**
     * Initialize Drafts for a specific Root Area (Start of Editing Session)
     * Handles State 0 -> State 1 Transition
     */
    public function initDrafts(Area $rootLiveArea): AreaDraft
    {
        return DB::transaction(function () use ($rootLiveArea) {
            // 1. Check if Draft Root already exists
            $existingDraft = AreaDraft::where('published_id', $rootLiveArea->id)
                ->whereNull('parent_id') // Root has no parent (in context of this tree)
                // Actually, level 1 area usually has no parent. 
                // But if we edit a sub-area, it might have a parent.
                // For now assuming Root is Level 1 or distinct root.
                ->first();

            if ($existingDraft) {
                // [STATE CHECK]
                $this->checkStaleState($existingDraft);
                return $existingDraft;
            }

            // 2. State 0 detected. Clone Live -> Draft (State 1)
            $rootDraft = $this->cloneAreaToDraft($rootLiveArea, null);

            // 2b. Clone Links (Post-Process)
            $this->cloneLinksForTree($rootDraft);

            // 3. Create Sync State
            $checksum = $this->calculateLiveChecksum($rootLiveArea);
            DraftSyncState::create([
                'root_draft_id' => $rootDraft->id,
                'status' => 'synced',
                'live_checksum' => $checksum,
                'last_synced_at' => now(),
            ]);

            return $rootDraft;
        });
    }

    /**
     * Recursively clone Area + Scenes + Links
     */
    private function cloneAreaToDraft(Area $liveArea, ?AreaDraft $parentDraft): AreaDraft
    {
        // Clone Area
        $draft = AreaDraft::create([
            'published_id' => $liveArea->id,
            'parent_id' => $parentDraft ? $parentDraft->id : null,
            'name' => $liveArea->name,
            'description' => $liveArea->description,
            'level' => $liveArea->level,
            'is_container' => $liveArea->is_container ?? false,
            'priority' => $liveArea->priority ?? 100,
            'lat' => $liveArea->lat,
            'lng' => $liveArea->lng,
            'is_restricted' => $liveArea->is_restricted ?? false,
            'marked_for_deletion' => false,
        ]);

        // Clone Scenes
        $liveScenes = $liveArea->scenes; // Assumes relationship exists
        foreach ($liveScenes as $liveScene) {
            SceneDraft::create([
                'published_id' => $liveScene->id,
                'area_id' => $draft->id,
                'name' => $liveScene->name,
                'image_path' => $liveScene->image_path,
                'heading' => $liveScene->heading,
                'can_be_gateway' => $liveScene->can_be_gateway,
                'lat' => $liveScene->lat,
                'lng' => $liveScene->lng,
                'marked_for_deletion' => false,
            ]);
        }

        // Clone Children Areas
        // Note: We need to load children recursively.
        $children = $liveArea->children;
        foreach ($children as $child) {
            $this->cloneAreaToDraft($child, $draft);
        }

        // Links are tricky because they link two scenes.
        // We do a second pass for links? Or clone links ONLY if both scenes are inside our draft scope?
        // STRATEGY: Links are cloned per scene usually, but here we process area tree.
        // Better: After cloning all scenes in the tree, we clone the links.
        // For simplicity/performance in this MVP, we might iterate scenes again or do it in bulk.
        // Let's do a post-process link cloning for the whole tree if strict correctness needed.
        // Or: Clone links when creating SceneDraft, IF `target_scene_id` is within our scope?
        // Actually, links table has `source_scene_id` and `target_scene_id`.
        // We will run a separate method `cloneLinksForTree` at the end of init.

        return $draft;
    }

    /**
     * Re-clone links after all scenes are created.
     * Use a mapping of LiveID -> DraftID.
     */
    /**
     * Re-clone links after all scenes are created.
     * Use a mapping of LiveID -> DraftID.
     */
    public function cloneLinksForTree(AreaDraft $rootDraft)
    {
        // 1. Get all Scene Drafts in this Tree to build a map
        // We can use a recursive helper or a flat query if we know the root structure.
        // Recursive is safer for multi-level trees.
        $sceneMap = $this->buildSceneMap($rootDraft);

        // 2. Fetch all Live Links for these scenes
        $liveSceneIds = array_keys($sceneMap);
        $liveLinks = Link::whereIn('source_scene_id', $liveSceneIds)->get();

        // 3. Clone Links
        foreach ($liveLinks as $liveLink) {
            // Check if target is also in our draft scope (otherwise it points outside - maybe okay? but usually we want internal links)
            // If target is NOT in map, do we link to LIVE scene? No, Draft link must point to Draft Scene.
            // So we only clone links where BOTH source and target are in the scope.
            // OR: If target is outside scope, we might not clone it? Or we should have included it?
            // Assumption: Editing session covers the area needed. If link points to another area not in draft, we can't represent it in draft unless we mock the target.
            // Strict: Only clone if target in map.

            if (!isset($sceneMap[$liveLink->target_scene_id])) {
                continue;
            }

            LinkDraft::create([
                'published_id' => $liveLink->id,
                'source_scene_id' => $sceneMap[$liveLink->source_scene_id], // Map to Draft ID
                'target_scene_id' => $sceneMap[$liveLink->target_scene_id], // Map to Draft ID
                'type' => $liveLink->type,
                'yaw' => $liveLink->yaw,
                'pitch' => $liveLink->pitch,
                'distance' => $liveLink->distance,
                'marked_for_deletion' => false,
            ]);
        }
    }

    private function buildSceneMap(AreaDraft $area, &$map = [])
    {
        foreach ($area->scenes as $scene) {
            if ($scene->published_id) {
                $map[$scene->published_id] = $scene->id;
            }
        }
        foreach ($area->children as $child) {
            $this->buildSceneMap($child, $map);
        }
        return $map;
    }

    // ... (To be successfully implemented in next steps, focused on core structure first)



    /**
     * Recursive Cascade Delete Mark
     */
    public function markForDeletion(AreaDraft|SceneDraft|LinkDraft $node)
    {
        DB::transaction(function () use ($node) {
            // 1. Check if this entire branch is "Pure Draft" (No connection to Live)
            $isPureDraft = !$this->hasAnyPublishedDescendant($node);

            if ($isPureDraft) {
                // 2A. NET-ZERO: Hard Delete immediately
                // Because no published_id exists in this branch, we can safely wipe it.
                // Creating then Deleting = Nothing happened.
                // USE RECURSIVE DELETE to trigger Observers for Image Cleanup!
                $this->forceDeleteDraftTree($node);
            } else {
                // 2B. Standard Soft Delete (Marking)
                // We MUST keep the drafts to signal "Deletion of Live Item" during Publish.
                $this->recursiveMark($node);
            }
        });
    }

    private function hasAnyPublishedDescendant($node): bool
    {
        if ($node->published_id)
            return true;

        if ($node instanceof AreaDraft) {
            // Check Children
            foreach ($node->children as $child) {
                if ($this->hasAnyPublishedDescendant($child))
                    return true;
            }
            // Check Scenes
            foreach ($node->scenes as $scene) {
                if ($this->hasAnyPublishedDescendant($scene))
                    return true;
            }
        }

        if ($node instanceof SceneDraft) {
            // Check Links (usually links are child of scene)
            // But links might point to published stuff?
            // Links have published_id too.
            foreach ($node->links as $link) {
                if ($link->published_id)
                    return true;
            }
        }

        return false;
    }

    private function recursiveMark($node)
    {
        $node->update(['marked_for_deletion' => true]);

        if ($node instanceof AreaDraft) {
            foreach ($node->children as $child)
                $this->recursiveMark($child);
            foreach ($node->scenes as $scene)
                $this->recursiveMark($scene);
        }

        if ($node instanceof SceneDraft) {
            $node->links()->update(['marked_for_deletion' => true]);
        }
    }

    // --- Helpers ---

    private function calculateLiveChecksum(Area $root): string
    {
        // Simple hash of updated_at timestamps of entire tree
        // High-speed, low-cost check.
        // Query to get MAX(updated_at) of Area and Descendants?
        // Or just hash of Root Area updated_at + Count of children?

        // For robustness, let's hash: Root UpdatedAt + Count(Children) + Count(Scenes)
        return md5($root->updated_at . $root->children()->count() . $root->scenes()->count());
    }

    private function checkStaleState(AreaDraft $draft)
    {
        if (!$draft->published_id)
            return;
        $live = Area::find($draft->published_id);
        if (!$live)
            return; // Live deleted?

        $currentSum = $this->calculateLiveChecksum($live);
        $storedSum = $draft->syncState?->live_checksum;

        if ($storedSum && $currentSum !== $storedSum) {
            $draft->syncState()->update(['status' => 'stale']);
        }
    }

    /**
     * Discard ALL drafts in the system.
     * Use this for the "Discard All" button to ensure complete reset.
     */
    public function discardAllDrafts()
    {
        return DB::transaction(function () {
            // 1. Get ALL Draft Roots
            $roots = AreaDraft::whereNull('parent_id')->get();

            foreach ($roots as $root) {
                // Delete Sync State
                $root->syncState()->delete();
                // Recursive Hard Delete
                $this->forceDeleteDraftTree($root);
            }

            // 2. Re-init Drafts for ALL Live Roots
            $liveRoots = Area::whereNull('parent_id')->get();
            $newDrafts = [];
            foreach ($liveRoots as $liveRoot) {
                $newDrafts[] = $this->initDrafts($liveRoot);
            }
            return $newDrafts;
        });
    }

    /**
     * Discard all drafts for a given Root Area
     * Effectively "Reset to Live"
     */
    public function discardDrafts(AreaDraft $root)
    {
        return DB::transaction(function () use ($root) {
            $liveId = $root->published_id;

            $root->syncState()->delete();
            $this->forceDeleteDraftTree($root);

            if ($liveId) {
                $liveRoot = Area::find($liveId);
                if ($liveRoot) {
                    return $this->initDrafts($liveRoot);
                }
            }
            return null;
        });
    }

    private function forceDeleteDraftTree($draft)
    {
        // 1. Recurse Children First
        if ($draft instanceof AreaDraft) {
            foreach ($draft->children as $child) {
                $this->forceDeleteDraftTree($child);
            }
            foreach ($draft->scenes as $scene) {
                $this->forceDeleteDraftTree($scene);
            }
        } elseif ($draft instanceof SceneDraft) {
            foreach ($draft->links as $link) {
                $this->forceDeleteDraftTree($link);
            }
        }

        // 2. Delete Self
        $draft->delete();
    }

    public function getPendingChanges(AreaDraft $root)
    {
        // PERFORMANCE OPTIMIZATION: Eager Load Live Data
        // Collect all published IDs to fetch in batch (avoid N+1)
        $ids = [
            'Area' => [],
            'Scene' => [],
            'Link' => []
        ];

        $collect = function ($node) use (&$ids, &$collect) {
            if ($node->published_id) {
                if ($node instanceof AreaDraft)
                    $ids['Area'][] = $node->published_id;
                elseif ($node instanceof SceneDraft)
                    $ids['Scene'][] = $node->published_id;
                elseif ($node instanceof LinkDraft)
                    $ids['Link'][] = $node->published_id;
            }

            if ($node instanceof AreaDraft) {
                foreach ($node->children as $child)
                    $collect($child);
                foreach ($node->scenes as $scene)
                    $collect($scene);
            }
            if ($node instanceof SceneDraft) {
                foreach ($node->links as $link)
                    $collect($link);
            }
        };

        $collect($root);

        // Fetch Live Records Map
        $liveContext = [
            'Area' => Area::whereIn('id', $ids['Area'])->get()->keyBy('id'),
            'Scene' => Scene::whereIn('id', $ids['Scene'])->get()->keyBy('id'),
            'Link' => Link::whereIn('id', $ids['Link'])->get()->keyBy('id'),
        ];

        return $this->formatDiffForFrontend($this->calculateDiff($root, $liveContext));
    }

    private function calculateDiff(AreaDraft $root, array $liveContext)
    {
        $changes = [];

        // Compare Root
        $rootDiff = $this->compareSingleNode($root, 'Area', $liveContext);
        if ($rootDiff)
            $changes[] = $rootDiff;

        // Recursively Compare Children
        foreach ($root->children as $child) {
            $childChanges = $this->calculateDiff($child, $liveContext) ?? [];
            if (!is_array($childChanges))
                $childChanges = [];
            $changes = array_merge($changes, $childChanges);
        }

        // Compare Scenes
        foreach ($root->scenes as $scene) {
            $sceneDiff = $this->compareSingleNode($scene, 'Scene', $liveContext);
            if ($sceneDiff)
                $changes[] = $sceneDiff;

            // Compare Links
            foreach ($scene->links as $link) {
                $linkDiff = $this->compareSingleNode($link, 'Link', $liveContext);
                if ($linkDiff)
                    $changes[] = $linkDiff;
            }
        }

        return $changes;
    }

    private function compareSingleNode($draft, $type, array $liveContext = [])
    {
        if ($type === 'Link') {
            $draft->loadMissing(['sourceScene', 'targetScene']);
            $typeName = ucfirst($draft->type);
            $name = "$typeName Link: " . ($draft->sourceScene->name ?? '?') . " → " . ($draft->targetScene->name ?? '?');
        } else {
            $name = $draft->name;
        }

        if ($draft->marked_for_deletion) {
            // NET-ZERO LOGIC: If item has no Live counterpart (published_id is null)
            // and is marked for deletion, it means it was "Created then Deleted".
            // It should NOT appear in the list.
            if (!$draft->published_id) {
                return null;
            }

            return [
                'type' => $type,
                'id' => $draft->id, // Draft ID for referencing
                'event' => 'deleted',
                'description' => "Deleted $type: $name",
                'subject_id' => $draft->published_id, // Use published ID for keying if possible
                'subject_name' => $name,
                'causer_name' => auth()->user()?->name ?? 'System',
                'created_at' => $draft->updated_at?->diffForHumans(),
                'timestamp' => $draft->updated_at,
                'old_values' => ['name' => $name], // Show what was deleted
                'changes' => [],
                'change_details' => []
            ];
        }

        if (!$draft->published_id) {
            return [
                'type' => $type,
                'id' => $draft->id,
                'event' => 'created',
                'description' => "Created new $type: $name",
                'subject_id' => $draft->id, // Use draft ID as temp subject ID
                'subject_name' => $name,
                'causer_name' => auth()->user()?->name ?? 'System',
                'created_at' => $draft->created_at?->diffForHumans(),
                'timestamp' => $draft->created_at,
                'changes' => $draft->toArray(), // Show all new values
                'old_values' => [],
                'change_details' => []
            ];
        }

        // UPDATED Logic
        $live = null;
        if ($draft->published_id && isset($liveContext[$type])) {
            $live = $liveContext[$type]->get($draft->published_id);
        } elseif ($draft->published_id) {
            // Fallback if context not passed (should not happen with new call)
            if ($type === 'Area')
                $live = Area::find($draft->published_id);
            elseif ($type === 'Scene')
                $live = Scene::find($draft->published_id);
            elseif ($type === 'Link')
                $live = Link::find($draft->published_id);
        } else {
            return null;
        }

        if (!$live)
            return null; // Should not happen unless sync issue

        $changes = [];
        $changeDetails = [];
        $oldValues = [];

        // Define attributes to compare per type
        if ($type === 'Area')
            $attributes = ['name', 'description', 'lat', 'lng', 'priority', 'is_restricted', 'level', 'is_container'];
        elseif ($type === 'Scene')
            $attributes = ['name', 'heading', 'can_be_gateway', 'lat', 'lng'];
        elseif ($type === 'Link')
            $attributes = ['yaw', 'pitch', 'type', 'distance'];

        foreach ($attributes as $attr) {
            $draftVal = $draft->$attr;
            $liveVal = $live->$attr;

            // Loose comparison for numbers/strings
            if ($draftVal != $liveVal) {
                // If numeric, check epsilon? For now simple !=
                $changes[$attr] = $draftVal;
                $oldValues[$attr] = $liveVal;
                $changeDetails[] = [
                    'field' => $attr,
                    'old' => $liveVal,
                    'new' => $draftVal
                ];
            }
        }

        if (empty($changes))
            return null;

        return [
            'type' => $type,
            'id' => $draft->id,
            'event' => 'updated',
            'description' => "Updated $type: $name",
            'subject_id' => $live->id,
            'subject_name' => $name, // Use calculated name
            'causer_name' => auth()->user()?->name ?? 'System',
            'created_at' => $draft->updated_at->diffForHumans(),
            'timestamp' => $draft->updated_at,
            'changes' => $changes,
            'old_values' => $oldValues,
            'change_details' => $changeDetails,
            'edit_count' => 1 // Simplified for now
        ];
    }

    private function formatDiffForFrontend($diffs)
    {
        $grouped = collect($diffs)->groupBy('type');

        $changes = [
            'Area' => $grouped->get('Area', collect())->sortByDesc('timestamp')->values()->all(),
            'Scene' => $grouped->get('Scene', collect())->sortByDesc('timestamp')->values()->all(),
            'Link' => $grouped->get('Link', collect())->sortByDesc('timestamp')->values()->all(),
        ];

        // Remove empty keys
        $changes = array_filter($changes, fn($c) => count($c) > 0);

        $total = count($diffs);

        return [
            'summary' => [
                'total_changes' => $total,
                'areas_count' => count($changes['Area'] ?? []),
                'scenes_count' => count($changes['Scene'] ?? []),
                'links_count' => count($changes['Link'] ?? []),
                'oldest_change' => 'Now' // Calculating oldest is tricky with diffs
            ],
            'changes' => $changes
        ];
    }
}
