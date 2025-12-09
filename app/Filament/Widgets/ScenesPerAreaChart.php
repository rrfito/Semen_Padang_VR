<?php

namespace App\Filament\Widgets;

use App\Models\Area;
use Filament\Widgets\ChartWidget;

class ScenesPerAreaChart extends ChartWidget
{
    protected ?string $heading = 'Top 5 Area dengan Foto Terbanyak';
    protected static ?int $sort = 3;

    protected function getData(): array
    {
        $areas = Area::withCount('scenes')
            ->orderByDesc('scenes_count')
            ->limit(5)
            ->get();

        return [
            'datasets' => [
                [
                    'label' => 'Jumlah Foto',
                    'data' => $areas->pluck('scenes_count')->toArray(),
                    'backgroundColor' => '#3b82f6',
                ],
            ],
            'labels' => $areas->pluck('name')->toArray(),
        ];
    }

    protected function getType(): string
    {
        return 'bar';
    }
}
