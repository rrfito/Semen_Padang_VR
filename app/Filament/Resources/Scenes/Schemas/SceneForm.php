<?php

namespace App\Filament\Resources\Scenes\Schemas;

use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class SceneForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('area_id')
                    ->relationship('area', 'name')
                    ->required()
                    ->label('Area')
                    ->searchable(),

                TextInput::make('name')
                    ->label('Nama Scene')
                    ->placeholder('Contoh: Bagian Depan, Lobby')
                    ->nullable(),

                FileUpload::make('image_path')
                    ->label('Panorama 360')
                    ->image()
                    ->required()
                    ->directory('panoramas')
                    ->maxSize(30720), // 30MB

                TextInput::make('heading')
                    ->numeric()
                    ->label('Initial Heading (0-360)')
                    ->default(0),
            ]);
    }
}
