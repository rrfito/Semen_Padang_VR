<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Enable PostGIS
        DB::statement('CREATE EXTENSION IF NOT EXISTS postgis');

        // Users Role (if not exists)
        if (Schema::hasTable('users') && !Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('role')->default('pegawai');
            });
        }

        // 1. Areas Table
        Schema::create('areas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->nullable()->constrained('areas')->nullOnDelete();
            $table->string('name');
            $table->tinyInteger('level')->default(3);
            $table->text('description')->nullable();

            // Core Logic Columns
            $table->boolean('is_container')->default(false); // Container area vs scene area
            $table->integer('priority')->default(100); // Sorting

            // Location (For Map Markers)
            $table->decimal('lat', 10, 8)->nullable();
            $table->decimal('lng', 11, 8)->nullable();

            // Settings
            $table->boolean('is_restricted')->default(false); // Access Control
            // use_manual_linking removed as per cleanup request (unless critical? User said "hapus atribut yang tidak digunakan")
            // Assuming use_manual_linking was for old logic. New auto-link is dynamic.
            $table->boolean('is_published')->default(false); // ADD
            $table->timestamp('last_published_at')->nullable(); // ADD
            $table->timestamps();
        });
        DB::table('areas')->update(['level' => 3]); // Default all to 3

        // Level 1: Roots (No Parent)
        $level1Ids = DB::table('areas')->whereNull('parent_id')->pluck('id');
        DB::table('areas')->whereIn('id', $level1Ids)->update(['level' => 1]);

        // Level 2: Children of Level 1
        // We can find them by looking for areas whose parent is in Level 1
        if ($level1Ids->isNotEmpty()) {
            DB::table('areas')
                ->whereIn('parent_id', $level1Ids)
                ->update(['level' => 2]);
        }

        // 2. Scenes Table
        Schema::create('scenes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('area_id')->constrained()->cascadeOnDelete();
            $table->string('name')->nullable();
            $table->string('image_path');

            // Camera settings
            $table->float('heading')->default(0);
            $table->boolean('can_be_gateway')->default(false); // ADD - CRITICAL

            // Publishing
            $table->boolean('is_published')->default(false); // ADD
            $table->timestamp('last_published_at')->nullable(); // ADD

            $table->timestamps();
        });

        // PostGIS for Scenes (for fast nearest-neighbor search)
        DB::statement("ALTER TABLE scenes ADD COLUMN location GEOGRAPHY(POINT, 4326)");
        DB::statement("CREATE INDEX scenes_location_idx ON scenes USING GIST (location)");

        // 3. Links Table
        Schema::create('links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('source_scene_id')->constrained('scenes')->cascadeOnDelete();
            $table->foreignId('target_scene_id')->nullable()->constrained('scenes')->cascadeOnDelete(); // Target Scene

            $table->float('distance')->nullable();

            $table->string('type')->default('navigasi'); // navigasi / gateway
            $table->double('yaw')->default(0);
            $table->double('pitch')->default(0);
            $table->boolean('is_published')->default(false); // ADD
            $table->timestamp('last_published_at')->nullable(); // ADD


            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('links');
        Schema::dropIfExists('scenes');
        Schema::dropIfExists('areas');

        if (Schema::hasTable('users') && Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('role');
            });
        }
    }
};
