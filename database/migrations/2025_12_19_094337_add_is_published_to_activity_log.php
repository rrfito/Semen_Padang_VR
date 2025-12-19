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
        Schema::table('activity_log', function (Blueprint $table) {
            // Add is_published column to track which logs have been published
            // Default false = unpublished (pending changes)
            $table->boolean('is_published')->default(false)->after('batch_uuid');

            // Add index for performance when querying pending changes
            $table->index('is_published');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('activity_log', function (Blueprint $table) {
            // Drop index first, then column
            $table->dropIndex(['is_published']);
            $table->dropColumn('is_published');
        });
    }
};
