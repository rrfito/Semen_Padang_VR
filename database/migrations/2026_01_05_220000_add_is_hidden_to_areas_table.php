<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Add is_hidden to areas table
        Schema::table('areas', function (Blueprint $table) {
            $table->boolean('is_hidden')->default(false)->after('is_restricted');
        });

        // Add is_hidden to area_drafts table
        Schema::table('area_drafts', function (Blueprint $table) {
            $table->boolean('is_hidden')->default(false)->after('is_restricted');
        });
    }

    public function down(): void
    {
        Schema::table('areas', function (Blueprint $table) {
            $table->dropColumn('is_hidden');
        });

        Schema::table('area_drafts', function (Blueprint $table) {
            $table->dropColumn('is_hidden');
        });
    }
};
