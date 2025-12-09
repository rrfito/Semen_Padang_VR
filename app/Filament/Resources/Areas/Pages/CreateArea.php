<?php

namespace App\Filament\Resources\Areas\Pages;

use App\Filament\Resources\Areas\AreaResource;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Support\Facades\DB;
use Filament\Notifications\Notification;
class CreateArea extends CreateRecord
{
    protected static string $resource = AreaResource::class;
    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }

    protected function afterCreate(): void
    {
        $area = $this->record;

        // Query PostGIS Canggih: 8 Sektor Mata Angin
        // PERBAIKAN: Simpan TRUE BEARING (Azimuth Global), bukan Relative Yaw.
        $sql = "
    INSERT INTO links (source_scene_id, target_scene_id, yaw, distance, created_at, updated_at)
    SELECT 
        id_asal, 
        id_tujuan, 
        azimuth_derajat,
        jarak_meter,
        NOW(), 
        NOW()
    FROM (
        SELECT 
            s1.id as id_asal,
            s2.id as id_tujuan,
            
            -- PERBAIKAN: Simpan GLOBAL AZIMUTH (0-360)
            degrees(ST_Azimuth(s1.location::geometry, s2.location::geometry)) as azimuth_derajat,
            
            ST_Distance(s1.location, s2.location) as jarak_meter,
            
            -- Sektor tetap pakai Relative untuk penentuan 'Link Terbaik per Arah'
            floor(((degrees(ST_Azimuth(s1.location::geometry, s2.location::geometry)) - s1.heading) + 360)::numeric % 360 / 45) as sektor,
            
            ROW_NUMBER() OVER (
                PARTITION BY s1.id, floor(((degrees(ST_Azimuth(s1.location::geometry, s2.location::geometry)) - s1.heading) + 360)::numeric % 360 / 45)
                ORDER BY ST_Distance(s1.location, s2.location) ASC
            ) as ranking
            
        FROM scenes s1
        JOIN scenes s2 ON s1.id <> s2.id 
        WHERE s1.area_id = ? AND s2.area_id = ? 
          AND ST_DWithin(s1.location, s2.location, 100) 
          AND ST_Distance(s1.location, s2.location) > 0.5 
    ) as kandidat
    WHERE ranking = 1 
";

    DB::insert($sql, [$area->id, $area->id]);

        // Beri tahu Admin kalau sistem sudah bekerja
        Notification::make()
            ->title('Area Dibuat & Navigasi Otomatis Terbentuk!')
            ->body('Sistem telah menghubungkan titik-titik foto terdekat secara otomatis.')
            ->success()
            ->send();
    }

    
}
