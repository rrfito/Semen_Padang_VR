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
        // 1. Drop Activity Logs Table
        Schema::dropIfExists('activity_log'); // Standard Spatie table name usually 'activity_log'. 
        // My migration named it 'activity_logs' or 'activity_log'?
        // Checking file: 2025_12_16_145519_create_activity_log_table.php
        // Standard spatie config uses `activity_log`.
        // I will check the migration file content in a sec or just try to drop both if unsure.
        // Assuming 'activity_log' as Spatie default.

        // 2. Drop Legacy Columns from Areas
        Schema::table('areas', function (Blueprint $table) {
            $table->dropColumn(['is_published', 'last_published_at']);
        });

        // 3. Drop Legacy Columns from Scenes
        Schema::table('scenes', function (Blueprint $table) {
            $table->dropColumn(['is_published', 'last_published_at']);
        });

        // 4. Drop Legacy Columns from Links
        Schema::table('links', function (Blueprint $table) {
            $table->dropColumn(['is_published', 'last_published_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restoration omitted for cleanup migration generally, or best effort.
        Schema::table('areas', function (Blueprint $table) {
            $table->boolean('is_published')->default(true); // Default true if restoring Live
            $table->timestamp('last_published_at')->nullable();
        });

        Schema::table('scenes', function (Blueprint $table) {
            $table->boolean('is_published')->default(true);
            $table->timestamp('last_published_at')->nullable();
        });

        Schema::table('links', function (Blueprint $table) {
            $table->boolean('is_published')->default(true);
            $table->timestamp('last_published_at')->nullable();
        });

        // Cannot easily restore activity_log table structure without copying full definition.
    }
};
