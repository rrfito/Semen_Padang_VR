<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Models\Scene;
use App\Models\Link;
use App\Models\Drafts\AreaDraft;
use App\Models\Drafts\SceneDraft;
use App\Models\Drafts\LinkDraft;
use App\Services\DraftService; // Added this use statement
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Carbon;

class AdminDashboardController extends Controller
{
    protected $draftService;

    public function __construct(DraftService $draftService)
    {
        $this->draftService = $draftService;
    }

    public function index()
    {
        // 1. General Statistics (Live Data)
        $stats = [
            'totalAreas' => Area::count(),
            'totalScenes' => Scene::count(),
            'totalLinks' => Link::count(),
        ];

        // 2. Draft Status (Pending Changes)
        // STRATEGY: Do not rely solely on 'draft_sync_states' table which might be desynced.
        // Instead, check ALL Draft Roots for actual diffs.
        $allRoots = AreaDraft::whereNull('parent_id')->get();

        $diffCounts = [
            'areas' => 0,
            'scenes' => 0,
            'links' => 0
        ];

        foreach ($allRoots as $root) {
            // Calculate Diff for every root
            // This ensures we catch changes even if SyncState is missing or stuck on 'synced'
            $changes = $this->draftService->getPendingChanges($root);

            // Sum up changes
            $diffCounts['areas'] += $changes['summary']['areas_count'] ?? 0;
            $diffCounts['scenes'] += $changes['summary']['scenes_count'] ?? 0;
            $diffCounts['links'] += $changes['summary']['links_count'] ?? 0;
        }

        $totalPending = $diffCounts['areas'] + $diffCounts['scenes'] + $diffCounts['links'];

        $draftStats = [
            'areaCount' => $diffCounts['areas'],
            'sceneCount' => $diffCounts['scenes'],
            'linkCount' => $diffCounts['links'],
            'isSynced' => $totalPending === 0, // True Source of Truth
            'lastEdited' => $this->getLastDraftEditTime(),
        ];

        // 3. Restricted Areas
        $restrictedAreas = Area::where('is_restricted', true)
            ->select('id', 'name', 'description')
            ->orderBy('name')
            ->get()
            ->map(function ($area) {
                return [
                    'id' => $area->id,
                    'name' => $area->name,
                    'icon' => 'lock',
                    'type' => 'restricted',
                    'action' => 'view',
                    'description' => $area->description, // Optional
                ];
            });

        // Calculate Integrity Metrics (Read-Only Diagnostic)
        $integrityStats = [
            'draftMismatch' => \App\Models\Drafts\DraftSyncState::whereIn('status', ['dirty', 'stale'])->count(),
            'orphanScenes' => \App\Models\Scene::doesntHave('outgoingLinks')

                ->orWhereDoesntHave('area')
                ->count(),
            'brokenLinks' => \App\Models\Link::doesntHave('targetScene')->count(),
            'scenesWithoutGps' => \App\Models\Scene::whereNull('location')->count(),
        ];

        return Inertia::render('Admin/AdminDashboard', [
            'stats' => $stats,
            'draftStats' => $draftStats,
            'integrityStats' => $integrityStats, // New Integrity Data
            'restrictedAreas' => $restrictedAreas,
        ]);
    }

    private function getLastDraftEditTime()
    {
        $dates = [
            AreaDraft::max('updated_at'),
            SceneDraft::max('updated_at'),
            LinkDraft::max('updated_at'),
        ];

        $latest = null;
        foreach ($dates as $date) {
            if ($date && (!$latest || $date > $latest)) {
                $latest = $date;
            }
        }

        return $latest ? Carbon::parse($latest)->diffForHumans() : 'No changes';
    }
}
