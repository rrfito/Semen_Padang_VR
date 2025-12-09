<?php

namespace App\Filament\Resources\Scenes\Pages;

use App\Filament\Resources\Scenes\SceneResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditScene extends EditRecord
{
    protected static string $resource = SceneResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
