<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
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
            $table->string('slug')->nullable(); // Good practice
            $table->text('description')->nullable();
            
            // Core Logic Columns
            $table->string('type')->default('default'); // 'default' (Scene Area) or 'group' (Container)
            $table->integer('priority')->default(10); // Sorting
            
            // Location (For Map Markers)
            $table->decimal('lat', 10, 8)->nullable();
            $table->decimal('lng', 11, 8)->nullable();
            
            // Settings
            $table->boolean('is_restricted')->default(false); // Access Control
            // use_manual_linking removed as per cleanup request (unless critical? User said "hapus atribut yang tidak digunakan")
            // Assuming use_manual_linking was for old logic. New auto-link is dynamic.
            
            $table->timestamps();
        });

        // 2. Scenes Table
        Schema::create('scenes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('area_id')->constrained()->cascadeOnDelete();
            $table->string('name')->nullable(); // Display Name
            $table->string('image_path');
            $table->string('type')->default('image'); // image/video
            
            // Orientation / Visuals
            $table->float('heading')->default(0);
            $table->float('pitch')->default(0);
            $table->float('roll')->default(0);
            $table->float('hfov')->default(100);
            
            // Sorting & Access
            $table->integer('sort_order')->default(0);
            $table->boolean('is_restricted')->default(false); // Granular Access Control
            
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
            // Note: target_scene_id nullable only if we support external links, but usually it's required for internal nav.
            // Let's keep it standard.
            
            $table->string('type')->default('navigasi'); // navigasi / portal
            $table->double('yaw')->default(0);
            $table->double('pitch')->default(0);
            
            // Optional: for Portals usually we link to an Area, but effective link is always Scene-to-Scene.
            // frontend resolves "Portal to Area X" as "Link to Scene Y (which is first scene of Area X)".
            // So DB structure stays simple: Scene to Scene.
            
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
