<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Drafts\AreaDraft;
use App\Models\Drafts\SceneDraft;
use App\Models\Drafts\LinkDraft;
use App\Http\Controllers\EditorController;
use Illuminate\Http\Request;

class AutoLinkTest extends TestCase
{
    use RefreshDatabase;

    protected $controller;

    protected function setUp(): void
    {
        parent::setUp();
        // We can instantiate the controller directly or test via route.
        // Testing via instance allows easier mocking if needed, but integration test with route is better.
        // Let's use direct controller instance for unit-like speed or route if we prefer full stack.
        // Given we need to mock DB transaction or just check DB results, direct instance is fine.
        $this->controller = app(EditorController::class);
    }

    /** @test */
    public function it_links_scenes_in_same_area_regardless_of_gateway_status()
    {
        // 1. Setup Area and Scenes
        $area = AreaDraft::create(['name' => 'Area 1']);

        $s1 = SceneDraft::create([
            'area_id' => $area->id,
            'image_path' => 's1.jpg',
            'lat' => -0.950000,
            'lng' => 100.350000, // Point A
            'can_be_gateway' => false
        ]);

        $s2 = SceneDraft::create([
            'area_id' => $area->id,
            'image_path' => 's2.jpg',
            'lat' => -0.950010,
            'lng' => 100.350000, // Very close
            'can_be_gateway' => false
        ]);

        // 2. Act
        $request = new Request([
            'radius' => 50,
            'replace_existing' => true
        ]);

        $this->controller->autoLinkExecute($request);

        // 3. Assert
        $this->assertDatabaseHas('link_drafts', [
            'source_scene_id' => $s1->id,
            'target_scene_id' => $s2->id,
            'type' => 'navigasi'
        ]);
    }

    /** @test */
    public function it_links_scenes_across_areas_only_if_both_are_gateways()
    {
        // Area 1
        $a1 = AreaDraft::create(['name' => 'Area 1']);
        // Area 2
        $a2 = AreaDraft::create(['name' => 'Area 2']);

        // Scenario A: Both Gateways -> Should Link
        $s1 = SceneDraft::create([
            'area_id' => $a1->id,
            'image_path' => 's1.jpg',
            'lat' => -0.950000,
            'lng' => 100.350000,
            'can_be_gateway' => true
        ]);

        $s2 = SceneDraft::create([
            'area_id' => $a2->id,
            'image_path' => 's2.jpg',
            'lat' => -0.950010,
            'lng' => 100.350000,
            'can_be_gateway' => true
        ]);

        // Scenario B: One Gateway, One Normal -> Should NOT Link
        $s3 = SceneDraft::create([
            'area_id' => $a1->id,
            'image_path' => 's3.jpg',
            'lat' => -0.951000,
            'lng' => 100.351000,
            'can_be_gateway' => true
        ]);

        $s4 = SceneDraft::create([
            'area_id' => $a2->id,
            'image_path' => 's4.jpg',
            'lat' => -0.951010,
            'lng' => 100.351000, // Close to s3
            'can_be_gateway' => false
        ]);

        // Act
        $request = new Request([
            'radius' => 100,
            'replace_existing' => true
        ]);

        $this->controller->autoLinkExecute($request);

        // Assert Scenario A: Linked
        $this->assertDatabaseHas('link_drafts', [
            'source_scene_id' => $s1->id,
            'target_scene_id' => $s2->id,
            'type' => 'gateway'
        ]);

        // Assert Scenario B: NOT Linked
        $this->assertDatabaseMissing('link_drafts', [
            'source_scene_id' => $s3->id,
            'target_scene_id' => $s4->id
        ]);
    }
}
