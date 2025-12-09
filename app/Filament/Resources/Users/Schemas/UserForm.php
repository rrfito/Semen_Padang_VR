<?php

namespace App\Filament\Resources\Users\Schemas;

use Filament\Actions\SelectAction;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Placeholder;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;
use Filament\Forms\Components\Select;

class UserForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
           
            ->components([
                TextInput::make('name')
                    ->required(),
                TextInput::make('email')
                    ->label('Email address')
                    ->email()
                    ->required(),
                Select::make('role')
                    ->options([
                    'admin' => 'Administrator',
                    'pegawai' => 'Pegawai Semen Padang',
                    ])
                    ->Placeholder('Pilih Peran Pengguna'),
                TextInput::make('password')
                    ->password()
                    ->required(),
                
            ]);
    }
}
