<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Area;
use App\Models\Scene;
use App\Models\Drafts\AreaDraft;
use App\Models\Drafts\SceneDraft;
use App\Models\User;
use App\Services\DraftService;
use App\Services\PublishService;

class DualEntityDraftTest extends TestCase
{
    use RefreshDatabase;

    protected $draftService;
    protected $publishService;
    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->draftService = new DraftService();
        $this->publishService = new PublishService();
        $this->user = User::factory()->create(['role' => 'admin']);
    }

    /** @test */
    public function it_initializes_drafts_from_live_data()
    {
        // 1. Arrange: Create Live Data
        $liveArea = Area::create(['name' => 'Live Area', 'level' => 1]);
        $liveScene = Scene::create([
            'area_id' => $liveArea->id,
            'name' => 'Live Scene',
            'image_path' => 'path.jpg'
        ]);

        // 2. Act: Initialize Drafts
        // Editor logic normally calls this on index
        $draftArea = $this->draftService->initDrafts($liveArea);

        // 3. Assert: Draft Exists and matches Live
        $this->assertNotNull($draftArea);
        $this->assertEquals('Live Area', $draftArea->name);
        $this->assertEquals($liveArea->id, $draftArea->published_id);

        $this->assertCount(1, $draftArea->scenes);
        $this->assertEquals('Live Scene', $draftArea->scenes->first()->name);

        // Assert Sync State
        $this->assertNotNull($draftArea->syncState);
        $this->assertEquals('synced', $draftArea->syncState->status);
    }

    /** @test */
    public function modifying_draft_does_not_affect_live_until_publish()
    {
        // 1. Setup
        $liveArea = Area::create(['name' => 'Original Name', 'level' => 1]);
        $draftArea = $this->draftService->initDrafts($liveArea);

        // 2. Act: Modify Draft
        $draftArea->update(['name' => 'Draft Name']);

        // 3. Assert Isolation
        $this->assertEquals('Draft Name', $draftArea->fresh()->name);
        $this->assertEquals('Original Name', $liveArea->fresh()->name); // LIVE UNCHANGED

        // 4. Act: Publish
        $this->publishService->publish($draftArea, $this->user);

        // 5. Assert: Live Updated
        $this->assertEquals('Draft Name', $liveArea->fresh()->name);
    }

    /** @test */
    public function it_detects_pending_changes()
    {
        // 1. Setup
        $liveArea = Area::create(['name' => 'Original', 'level' => 1]);
        $draftArea = $this->draftService->initDrafts($liveArea);

        // 2. Report should be empty
        $reportCheck1 = $this->draftService->getPendingChanges($draftArea);
        $this->assertEquals(0, $reportCheck1['summary']['total_changes']);

        // 3. Modify Draft
        $draftArea->update(['name' => 'Unified']);

        // 4. Report should show change
        $reportCheck2 = $this->draftService->getPendingChanges($draftArea);
        $this->assertEquals(1, $reportCheck2['summary']['total_changes']);
        $this->assertEquals('updated', $reportCheck2['changes']['Area'][0]['event']);
        $this->assertEquals('Unified', $reportCheck2['changes']['Area'][0]['changes']['name']);
    }
}
