<?php

namespace App\Filament\Resources\Areas\Pages;

use App\Filament\Resources\Areas\AreaResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;
use Illuminate\Support\Facades\DB; 
use Filament\Notifications\Notification;
class EditArea extends EditRecord
{
    protected static string $resource = AreaResource::class;

    public function mount(int | string $record): void
    {
        parent::mount($record);
        
        if ($this->record->type === 'default') {
            redirect()->route('admin.editor.visual', ['area' => $this->record->id]);
        }
    }

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
            \Filament\Actions\Action::make('visual_editor')
                ->label('Buka Visual Editor')
                ->icon('heroicon-m-pencil-square')
                ->url(fn ($record) => route('admin.editor.visual', ['area' => $record->id]))
                ->openUrlInNewTab()
                ->color('primary')
                ->visible(fn ($record) => !$record->is_parent),
        ];
    }
    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }

    protected function afterSave(): void
    {
        $area = $this->record;

        // SAFEGUARD: Jika Mode Manual aktif, JANGAN hapus/regenerate link
        if ($area->use_manual_linking) {
             Notification::make()
                ->title('Perubahan Disimpan (Mode Manual)')
                ->body('Link tidak diubah otomatis. Gunakan Visual Editor untuk mengatur navigasi.')
                ->info()
                ->send();
            return;
        }

        // 1. RESET: Hapus semua link internal di area ini
        //    Agar jika ada scene baru di tengah, link lama yang "melompati" scene baru tersebut hilang.
        DB::table('links')
            ->whereIn('source_scene_id', function ($query) use ($area) {
                $query->select('id')->from('scenes')->where('area_id', $area->id);
            })
            ->whereIn('target_scene_id', function ($query) use ($area) {
                $query->select('id')->from('scenes')->where('area_id', $area->id);
            })
            ->delete();

        // 2. RE-GENERATE: Buat link baru berdasarkan posisi terbaru
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
            
            degrees(ST_Azimuth(s1.location::geometry, s2.location::geometry)) as azimuth_derajat,
            ST_Distance(s1.location, s2.location) as jarak_meter,
            
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

        // Jalankan Query
        DB::insert($sql, [$area->id, $area->id]);

        // Beri Notifikasi ke Admin
        Notification::make()
            ->title('Data Disimpan & Navigasi Diperbarui!')
            ->body('Sistem telah memperbarui titik-titik foto terdekat secara otomatis.')
            ->success()
            ->send();
    }
}
