<?php

namespace App\Filament\Resources\Areas\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Components\Fieldset;
use Filament\Schemas\Components\Section;

class AreaForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Informasi Area Grup')
                    ->columnSpanFull()
                    ->schema([
                        TextInput::make('name')
                            ->label('Nama Grup Area')
                            ->required(),

                        Textarea::make('description')
                            ->label('Deskripsi')
                            ->placeholder('Tuliskan penjelasan singkat mengenai grup area ini...')
                            ->rows(3)
                            ->columnSpanFull()
                            ->maxLength(75535),

                        Fieldset::make('Lokasi Global (Peta)')
                            ->schema([
                                TextInput::make('lat')
                                    ->label('Latitude')
                                    ->numeric()
                                    ->required()
                                    ->columnSpan(1),
                                TextInput::make('lng')
                                    ->label('Longitude')
                                    ->numeric()
                                    ->required()
                                    ->columnSpan(1),
                            ])
                            ->columns(2),
                    ]),

                \Filament\Forms\Components\Hidden::make('type')
                    ->default('group'),

                Section::make('Pengaturan Struktur')
                    ->description('Atur posisi hierarki dan urutan tampilan grup ini')
                    ->schema([
                        \Filament\Forms\Components\Hidden::make('parent_id'),

                        Fieldset::make('Hirarki Grup')
                            ->schema([
                                Select::make('level_1_id')
                                    ->label('Grup Induk (Utama)')
                                    ->placeholder('Pilih Grup Induk')
                                    ->helperText('Level 1: Isi jika grup ini adalah sub-grup.')
                                    ->options(fn () => \App\Models\Area::whereNull('parent_id')->scopeGroups()->pluck('name', 'id'))
                                    ->live()
                                    ->dehydrated(false)
                                    ->afterStateUpdated(function ($set, $state) {
                                        $set('parent_id', $state);
                                        $set('level_2_id', null);
                                    })
                                    ->afterStateHydrated(function ($set, $get, $record) {
                                        if (!$record || !$record->parent_id) return;
                                        $parent = \App\Models\Area::find($record->parent_id);
                                        if (!$parent) return;

                                        if ($parent->parent_id) {
                                            $set('level_1_id', $parent->parent_id);
                                            $set('level_2_id', $parent->id);
                                        } else {
                                            $set('level_1_id', $parent->id);
                                        }
                                    }),

                                Select::make('level_2_id')
                                    ->label('Sub-Grup Induk')
                                    ->placeholder('Pilih Sub-Grup (Opsional)')
                                    ->helperText('Level 2: Isi jika grup ini adalah sub-sub-grup.')
                                    ->options(function ($get) {
                                        $level1Id = $get('level_1_id');
                                        if (!$level1Id) return [];
                                        return \App\Models\Area::where('parent_id', $level1Id)->scopeGroups()->pluck('name', 'id');
                                    })
                                    ->visible(fn ($get) => filled($get('level_1_id')))
                                    ->live()
                                    ->dehydrated(false)
                                    ->afterStateUpdated(function ($set, $get, $state) {
                                        if ($state) {
                                            $set('parent_id', $state);
                                        } else {
                                            $set('parent_id', $get('level_1_id'));
                                        }
                                    }),
                            ])
                            ->columns(2),

                        TextInput::make('priority')
                            ->label('Prioritas Urutan')
                            ->numeric()
                            ->default(0)
                            ->helperText('Angka lebih kecil muncul lebih dulu di sidebar.'),
                            
                        Toggle::make('is_restricted')
                            ->label('Area Grup Terbatas')
                            ->helperText('Aktifkan jika grup ini hanya boleh diakses pegawai.')
                            ->default(false),
                    ]),
            ]);
    }
}
