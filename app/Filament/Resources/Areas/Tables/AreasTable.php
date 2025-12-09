<?php

namespace App\Filament\Resources\Areas\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Filament\Tables\Columns\SelectColumn;
use Filament\Tables\Columns\ToggleColumn;

class AreasTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('parent.name') 
                    ->label('Induk Area')
                    ->searchable()
                    ->placeholder(' Area Utama')
                    ->sortable(),
                ToggleColumn::make('is_restricted')
                    ->label('Area Terbatas')
                    ->onColor('danger')  // Merah kalau aktif
                    ->offColor('success')
                    ->alignCenter() // Hijau kalau mati
                    ->sortable(),
                TextColumn::make('scenes_count')
                    ->label('Jumlah Foto')
                    ->counts('scenes')
                    ->sortable()
                    ->alignCenter()
                    ->badge()
                    ->color(fn ($state) => $state > 0 ? 'success' : 'gray'),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                
            ])
            
            ->filters([
            ])
            ->recordActions([
                EditAction::make()
                
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
