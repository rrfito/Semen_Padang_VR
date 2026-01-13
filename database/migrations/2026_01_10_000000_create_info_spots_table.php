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
        // Live table: info_spots
        Schema::create('info_spots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scene_id')->constrained('scenes')->cascadeOnDelete();
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->double('yaw')->default(0);
            $table->double('pitch')->default(0);
            $table->timestamps();
        });

        // Draft table: info_spot_drafts
        Schema::create('info_spot_drafts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('published_id')->nullable()->constrained('info_spots')->nullOnDelete();
            $table->foreignId('scene_id')->constrained('scene_drafts')->cascadeOnDelete();
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->double('yaw')->default(0);
            $table->double('pitch')->default(0);
            $table->boolean('marked_for_deletion')->default(false);
            $table->timestamps();

            $table->index('published_id');
            $table->index('scene_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('info_spot_drafts');
        Schema::dropIfExists('info_spots');
    }
};
