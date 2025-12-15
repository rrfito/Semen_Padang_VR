<?php

namespace App\Filament\Resources\Areas\Pages;

use App\Filament\Resources\Areas\AreaResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;
use Filament\Schemas\Components\Tabs\Tab;
use Illuminate\Database\Eloquent\Builder;
class ListAreas extends ListRecords
{
    protected static string $resource = AreaResource::class;

    protected function getHeaderActions(): array
    {
        return [
            \Filament\Actions\Action::make('create_group')
                ->label('Buat Area Grup')
                ->icon('heroicon-o-folder')
                ->color('danger')
                ->url(fn () => CreateArea::getUrl(['type' => 'group'])),

            \Filament\Actions\Action::make('create_scene')
                ->label('Buat Area Scene')
                ->icon('heroicon-o-photo')
                ->color('primary')
                ->action(function () {
                    $area = \App\Models\Area::create([
                        'name' => 'New Scene Area ' . date('His'),
                        'type' => 'default',
                        'is_restricted' => 0,
                        'priority' => 10,
                    ]);
                    return redirect()->route('admin.editor.visual', ['area' => $area->id]);
                }),
        ];
    }
    public function getTabs(): array
{
    return [
       
        'utama' => Tab::make('Area Utama')
            ->icon('heroicon-m-building-office-2')
            ->modifyQueryUsing(fn (Builder $query) => $query->whereNull('parent_id'))
            ->badge(\App\Models\Area::whereNull('parent_id')->count()),

       
        'sub_area' => Tab::make('Sub Area / Unit')
            ->icon('heroicon-m-rectangle-group')
            ->modifyQueryUsing(fn (Builder $query) => $query
                ->whereNotNull('parent_id')
                ->whereHas('parent', fn ($q) => $q->whereNull('parent_id')) 
            )
            ->badge(
                \App\Models\Area::whereNotNull('parent_id')
                    ->whereHas('parent', fn ($q) => $q->whereNull('parent_id'))
                    ->count()
            ),
        'ruangan' => Tab::make('Ruangan')
            ->icon('heroicon-m-map-pin')
            ->modifyQueryUsing(fn (Builder $query) => $query
                ->whereNotNull('parent_id')
                ->whereHas('parent', fn ($q) => $q->whereNotNull('parent_id'))
            )
            ->badge(
                \App\Models\Area::whereNotNull('parent_id')
                    ->whereHas('parent', fn ($q) => $q->whereNotNull('parent_id'))
                    ->count()
            )
            ->badgeColor('warning'), 

       
        'semua' => Tab::make('Semua Area')
            ->icon('heroicon-m-list-bullet'),
    ];
}
}
