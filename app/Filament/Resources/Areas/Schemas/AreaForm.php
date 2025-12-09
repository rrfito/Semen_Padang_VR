<?php

namespace App\Filament\Resources\Areas\Schemas;

use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Components\Fieldset;
use Filament\Schemas\Components\Section;
use Filament\Forms\Get;
use Filament\Forms\Set;
use Filament\Forms\Components\Actions\Action;
use Illuminate\Support\Str;
class AreaForm
{
       
    protected static function getGps($exifCoord, $hemi) {
        $degrees = count($exifCoord) > 0 ? self::gps2Num($exifCoord[0]) : 0;
        $minutes = count($exifCoord) > 1 ? self::gps2Num($exifCoord[1]) : 0;
        $seconds = count($exifCoord) > 2 ? self::gps2Num($exifCoord[2]) : 0;

        $flip = ($hemi == 'W' or $hemi == 'S') ? -1 : 1;
        return $flip * ($degrees + $minutes / 60 + $seconds / 3600);
    }

    protected static function gps2Num($coordPart) {
        $parts = explode('/', $coordPart);
        if (count($parts) <= 0) return 0;
        if (count($parts) == 1) return $parts[0];
        return floatval($parts[0]) / floatval($parts[1]);
    }

    protected static function getXmpHeading($filepath) {
        $content = file_get_contents($filepath);
        $xmp_start = strpos($content, '<x:xmpmeta');
        $xmp_end = strpos($content, '</x:xmpmeta>');
        
        if ($xmp_start === false || $xmp_end === false) return null;
        
        $xmp_length = $xmp_end - $xmp_start + 12;
        $xmp_data = substr($content, $xmp_start, $xmp_length);
        
        // Cari PoseHeadingDegrees (Google Street View / Ricoh Theta)
        if (preg_match('/PoseHeadingDegrees="([^"]+)"/', $xmp_data, $matches)) {
            return floatval($matches[1]);
        }
        if (preg_match('/<GPano:PoseHeadingDegrees>([^<]+)<\/GPano:PoseHeadingDegrees>/', $xmp_data, $matches)) {
            return floatval($matches[1]);
        }
        
        return null;
    }
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([

                
                        Section::make('Informasi Utama')
                            ->columnSpanFull()
                            ->schema([
                                TextInput::make('name')
                                    ->label('Nama Area')
                                    
                                    ->required(),

                                Textarea::make('description')
                                    ->label('Deskripsi Area')
                                    ->placeholder('Tuliskan penjelasan singkat mengenai area ini...')
                                    ->rows(6)
                                    ->columnSpanFull()
                                    ->maxLength(75535),
                            ]),
                        Section::make('Pengaturan Struktur')
                            ->description('Atur posisi hierarki dan urutan tampilan area di sidebar')
                            ->schema([
                                \Filament\Forms\Components\Hidden::make('parent_id'),

                                Fieldset::make('Hirarki Area')
                                    ->schema([
                                        Select::make('level_1_id')
                                            ->label('Area Utama')
                                            ->placeholder('Pilih Area Utama')
                                            ->helperText('Level 1: Isi jika bagian dari utama. Kosongkan jika sebagai area utama.')
                                            ->options(fn () => \App\Models\Area::whereNull('parent_id')->pluck('name', 'id'))
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
                                                    // Parent is Level 2, so Grandparent is Level 1
                                                    $set('level_1_id', $parent->parent_id);
                                                    $set('level_2_id', $parent->id);
                                                } else {
                                                    // Parent is Level 1
                                                    $set('level_1_id', $parent->id);
                                                }
                                            }),

                                        Select::make('level_2_id')
                                            ->label('Sub Area')
                                            ->placeholder('Pilih Sub Area (Opsional)')
                                            ->helperText('Level 2: isi jika bagian dari sub area. Kosongkan jika sebagai sub area')
                                            ->options(function ($get) {
                                                $level1Id = $get('level_1_id');
                                                if (!$level1Id) return [];
                                                return \App\Models\Area::where('parent_id', $level1Id)->pluck('name', 'id');
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
                                    ->helperText('Angka lebih kecil muncul lebih dulu di sidebar. Contoh: 1 muncul sebelum 10.'),
                            ]),
                        Section::make('Status')
                            ->description('Atur status atau sifat dari area ')
                            ->schema([
                                Toggle::make('is_restricted')
                                    ->label('Area Terbatas')
                                    
                                    ->helperText('Aktifkan jika area ini hanya boleh diakses pegawai.')
                                    
                                    ->default(false)
                                    ->inline(false),
                                Toggle::make('is_parent')
                                    ->label('Area Grup')                       
                                    ->helperText('Aktifkan jika area ini hanya berfungsi sebagai grup/folder (seperti nama gedung atau nama jalan).')                                   
                                    ->default(false)
                                    ->inline(false)
                                    ->live()
                            ]),
                
                        
               
                Section::make('Daftar Foto 360')
                   ->visible(fn ($get) => $get('is_parent') == false)
                   
                    ->schema([
                        Repeater::make('scenes')
                            ->relationship()
                            ->required()
                            ->grid(2)
                            ->label('Foto 360')
                            
                            ->defaultItems(2)
                            ->cloneable()
                            ->collapsible()
                            ->helperText('PENTING: Foto pada urutan PERTAMA akan digunakan sebagai ikon/titik utama di Peta.')
                            ->reorderableWithDragAndDrop()
                            ->orderColumn('sort_order')
                            ->addAction(fn ($action) => $action
                                ->form([
                                    TextInput::make('numberOfItems')
                                        ->label('Jumlah Foto yang ingin ditambahkan')
                                        ->numeric()
                                        ->default(1)
                                        ->minValue(1)
                                        ->maxValue(50)
                                        ->required(),
                                ])
                                ->modalHeading('Tambah Foto 360')
                                ->modalSubmitActionLabel('Tambah')
                                ->action(function (array $data, $component) {
                                    $count = $data['numberOfItems'];
                                    $state = $component->getState() ?? [];
                                    
                                    for ($i = 0; $i < $count; $i++) {
                                        $state[(string) Str::uuid()] = [
                                            'type' => 'navigasi', // Default value
                                            'heading' => 0, // Default value
                                        ];
                                    }
                                    
                                    $component->state($state);
                                })
                            )
                            
                            ->schema([

                                FileUpload::make('image_path')
                                    ->label('Unggah Foto 360')
                                    ->image()
                                    ->directory('panoramas')
                                    ->disk('public')
                                    ->visibility('public')
                                    ->acceptedFileTypes(['image/jpeg', 'image/png', 'image/webp'])
                                    ->maxSize(30720)
                                    ->fetchFileInformation(false)
                                    ->helperText('Unggah foto dengan format JPG, PNG, atau WebP. Resolusi maksimal 30mb.')
                                    ->required()
                                    ->live()
                                    ->afterStateUpdated(function ($state, $set) {
                                        if (!$state) return;

                                        $file = $state;
                                        if (is_array($state)) {
                                            $file = reset($state);
                                        }

                                        if (!($file instanceof \Livewire\Features\SupportFileUploads\TemporaryUploadedFile)) {
                                            return;
                                        }

                                        $path = $file->getRealPath();
                                        
                                        if (!file_exists($path)) return;

                                        // Skip processing if not JPG/PNG (extra safety)
                                        $mime = $file->getMimeType();
                                        if (!in_array($mime, ['image/jpeg', 'image/png', 'image/jpg'])) {
                                            return;
                                        }

                                        try {
                                            $exif = @exif_read_data($path);
                                        } catch (\Throwable $e) {
                                            $exif = null;
                                        }
                                        
                                        if (!$exif) return;

                                        $gps2Num = function($coordPart) {
                                            $parts = explode('/', $coordPart);
                                            if (count($parts) <= 0) return 0;
                                            if (count($parts) == 1) return $parts[0];
                                            return floatval($parts[0]) / floatval($parts[1]);
                                        };

                                        $getGps = function($exifCoord, $hemi) use ($gps2Num) {
                                            $degrees = count($exifCoord) > 0 ? $gps2Num($exifCoord[0]) : 0;
                                            $minutes = count($exifCoord) > 1 ? $gps2Num($exifCoord[1]) : 0;
                                            $seconds = count($exifCoord) > 2 ? $gps2Num($exifCoord[2]) : 0;

                                            $flip = ($hemi == 'W' || $hemi == 'S') ? -1 : 1;

                                            return $flip * ($degrees + $minutes / 60 + $seconds / 3600);
                                        };

                                        if (isset($exif['GPSLatitude']) && isset($exif['GPSLatitudeRef']) &&
                                            isset($exif['GPSLongitude']) && isset($exif['GPSLongitudeRef'])) {
                                            
                                            $lat = $getGps($exif['GPSLatitude'], $exif['GPSLatitudeRef']);
                                            $lng = $getGps($exif['GPSLongitude'], $exif['GPSLongitudeRef']);

                                            $set('location_array.lat', $lat);
                                            $set('location_array.lng', $lng);
                                        }

                                        // --- EKSTRAKSI HEADING (ARAH HADAP) ---
                                        $heading = 0;
                                        
                                        // 1. Coba dari EXIF GPSImgDirection
                                        if (isset($exif['GPSImgDirection'])) {
                                            $heading = $gps2Num($exif['GPSImgDirection']);
                                        } 
                                        // 2. Coba dari XMP (Google Street View / Ricoh Theta)
                                        else {
                                            try {
                                                $xmpHeading = self::getXmpHeading($path);
                                                if ($xmpHeading !== null) {
                                                    $heading = $xmpHeading;
                                                }
                                            } catch (\Throwable $e) {
                                                // Ignore XMP errors
                                            }
                                        }

                                        $set('heading', $heading);
                                    }),
                                    
                                
                                Select::make('type')
                                    ->label('Tipe Tautan Default')
                                    ->options([
                                        'navigasi' => 'Navigasi',
                                        'portal' => 'Portal',
                                    ])
                                    ->helperText('Pilih Portal jika foto ini adalah pintu masuk ke area lain.')
                                    ->default('navigasi')
                                    ->required(),
                                

                                Fieldset::make('Posisi GPS')
                                    ->schema([
                                        TextInput::make('lat')
                                            ->label('Latitude')
                                            ->numeric()
                                            ->required(),

                                        TextInput::make('lng')
                                            ->label('Longitude')
                                            ->numeric()
                                            ->required(),
                                    ])
                                    ->statePath('location_array'),

                                TextInput::make('heading')
                                    ->label('Arah Hadap Kamera (Heading)')
                                    ->numeric()
                                    ->default(0)
                                    ->required()
                                    ->helperText('0=Utara, 90=Timur, 180=Selatan, 270=Barat. Otomatis terisi jika ada metadata.'),
                            ]),
                    ])
                    ->columnSpanFull(),
            ]);
    }
}
