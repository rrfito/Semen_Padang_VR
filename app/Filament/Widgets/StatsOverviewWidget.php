<?php

namespace App\Filament\Widgets;

use App\Models\Area;
use App\Models\Link;
use App\Models\Scene;
use App\Models\User;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class StatsOverviewWidget extends BaseWidget
{
    protected function getStats(): array
    {
        return [
            Stat::make('Total Area', Area::count())
                ->description('Total area yang terdaftar')
                ->descriptionIcon('heroicon-m-map')
                ->color('primary'),
            Stat::make('Total Foto 360', Scene::count())
                ->description('Total scene panorama')
                ->descriptionIcon('heroicon-m-photo')
                ->color('success'),
            Stat::make('Total Koneksi', Link::count())
                ->description('Total hubungan antar scene')
                ->descriptionIcon('heroicon-m-link')
                ->color('warning'),
            Stat::make('Total Pengguna', User::count())
                ->description('Pengguna terdaftar')
                ->descriptionIcon('heroicon-m-users')
                ->color('info'),
        ];
    }
}
