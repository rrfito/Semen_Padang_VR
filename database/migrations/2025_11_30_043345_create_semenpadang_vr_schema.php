<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('CREATE EXTENSION IF NOT EXISTS postgis');
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('pegawai'); 
        });

       
        Schema::create('areas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->nullable()->constrained('areas')->nullOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_parent')->default(false)->after('description');
            $table->boolean('is_restricted')->default(true); 
            $table->timestamps();
        });
       
        DB::statement("ALTER TABLE areas ADD COLUMN center_location GEOGRAPHY(POINT, 4326)");

        
        Schema::create('scenes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('area_id')->constrained()->cascadeOnDelete();
            $table->string('image_path');
            $table->string('type')->default('navigasi');
            $table->timestamps();
        });
        
        DB::statement("ALTER TABLE scenes ADD COLUMN location GEOGRAPHY(POINT, 4326)");
        DB::statement("CREATE INDEX scenes_location_idx ON scenes USING GIST (location)");

       
        Schema::create('links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('source_scene_id')->constrained('scenes')->cascadeOnDelete();
            $table->foreignId('target_scene_id')->constrained('scenes')->cascadeOnDelete();
            $table->double('yaw')->nullable();
            $table->double('distance')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('links');
        Schema::dropIfExists('scenes');
        Schema::dropIfExists('areas');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};