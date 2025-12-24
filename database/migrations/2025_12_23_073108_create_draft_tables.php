<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Table: area_drafts
        Schema::create('area_drafts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('published_id')->nullable()->constrained('areas')->nullOnDelete(); // Link to Live
            $table->foreignId('parent_id')->nullable()->constrained('area_drafts')->nullOnDelete(); // Self-Ref Draft
            $table->string('name');
            $table->text('description')->nullable();
            $table->tinyInteger('level')->default(3);
            $table->boolean('is_container')->default(false);
            $table->integer('priority')->default(100);
            $table->decimal('lat', 10, 8)->nullable();
            $table->decimal('lng', 11, 8)->nullable();
            $table->boolean('is_restricted')->default(false);
            $table->boolean('marked_for_deletion')->default(false); // Tombstone
            $table->timestamps();

            $table->index('published_id');
        });

        // Table: scene_drafts
        Schema::create('scene_drafts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('published_id')->nullable()->constrained('scenes')->nullOnDelete(); // Link to Live
            $table->foreignId('area_id')->constrained('area_drafts')->cascadeOnDelete(); // Parent Draft
            $table->string('name')->nullable();
            $table->integer('priority')->default(0);
            $table->string('image_path');
            $table->float('heading')->default(0);
            $table->boolean('can_be_gateway')->default(false);
            $table->decimal('lat', 10, 8)->nullable(); // [NEW]
            $table->decimal('lng', 11, 8)->nullable(); // [NEW]
            $table->boolean('marked_for_deletion')->default(false); // Tombstone
            $table->timestamps();

            $table->index('published_id');
        });

        // Table: link_drafts
        Schema::create('link_drafts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('published_id')->nullable()->constrained('links')->nullOnDelete(); // Link to Live
            $table->foreignId('source_scene_id')->constrained('scene_drafts')->cascadeOnDelete(); // Source Draft
            $table->foreignId('target_scene_id')->nullable()->constrained('scene_drafts')->cascadeOnDelete(); // Target Draft
            $table->string('type')->default('navigasi');
            $table->double('yaw')->default(0);
            $table->double('pitch')->default(0);
            $table->float('distance')->nullable();
            $table->boolean('marked_for_deletion')->default(false); // Tombstone
            $table->timestamps();

            $table->index('published_id');
        });

        // Table: draft_sync_states (Root Scope Level)
        Schema::create('draft_sync_states', function (Blueprint $table) {
            $table->id();
            $table->foreignId('root_draft_id')->constrained('area_drafts')->cascadeOnDelete();
            $table->string('status')->default('synced'); // synced | dirty | stale | publishing
            $table->string('live_checksum'); // MD5/Hash of Live State at time of Clone/Sync
            $table->timestamp('last_synced_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('draft_sync_states');
        Schema::dropIfExists('link_drafts');
        Schema::dropIfExists('scene_drafts');
        Schema::dropIfExists('area_drafts');
    }
};
