<?php

namespace App\Filament\Widgets;

use App\Models\Area;
use Filament\Widgets\ChartWidget;

class AreaDistributionChart extends ChartWidget
{
    protected ?string $heading = 'Distribusi Area';
    protected ?string $maxHeight = '300px';
    protected static ?int $sort = 2;

    protected function getData(): array
    {
        $restricted = Area::where('is_restricted', true)->count();
        $public = Area::where('is_restricted', false)->count();

        return [
            'datasets' => [
                [
                    'label' => 'Area Distribution',
                    'data' => [$restricted, $public],
                    'backgroundColor' => ['#ef4444', '#22c55e'],
                ],
            ],
            'labels' => ['Restricted', 'Public'],
        ];
    }

    protected function getType(): string
    {
        return 'pie';
    }
}
