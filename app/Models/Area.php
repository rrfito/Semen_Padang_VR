<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Area extends Model
{
    protected $guarded = [];

    public function parent(): BelongsTo { return $this->belongsTo(Area::class, 'parent_id'); }
    public function children(): HasMany { 
        return $this->hasMany(Area::class, 'parent_id')
            ->orderBy('priority', 'asc')
            ->orderBy('name', 'asc'); 
    }
    public function scenes(): HasMany { return $this->hasMany(Scene::class)->orderBy('sort_order'); }
}
