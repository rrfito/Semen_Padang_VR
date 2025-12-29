<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Admin Semen Padang',
            'email' => 'admin@semenpadang.co.id',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        User::factory()->create([
            'name' => 'Pegawai 1',
            'email' => 'pegawai@semenpadang.co.id',
            'password' => bcrypt('password'),
            'role' => 'pegawai',
        ]);

        // $this->call(SemenPadangSeeder::class);
    }
}
