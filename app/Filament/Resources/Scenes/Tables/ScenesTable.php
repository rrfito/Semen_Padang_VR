<?php

namespace App\Filament\Resources\Scenes\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\SelectColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class ScenesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
               TextColumn::make('area.name') 
                ->label('Lokasi Area')
                ->icon('heroicon-m-building-office') 
                ->searchable() 
                ->sortable()
                ->badge() 
                ->color('info'),
                ImageColumn::make('image_path')
                    ->label('Foto 360')
                    ->square()
                    ->disk('public') 
                    ->visibility('public') 
                    ->imageSize(120),
                SelectColumn::make('type')
                    ->label('Tipe')
                    ->options([
                        'navigasi' => 'Navigasi',
                        'portal' => 'Portal',
                    ])
                    ->searchable(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                
            ]);
           
    }
}
