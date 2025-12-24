<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
class Area extends Model
{
    protected $fillable = [
        'name',
        'description',
        'parent_id',
        'level',
        'is_container',
        'priority',
        'lat',
        'lng',
        'is_restricted',
    ];

    protected $casts = [
        'is_container' => 'boolean',
        'is_restricted' => 'boolean',
        'lat' => 'decimal:8',
        'lng' => 'decimal:8',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Area::class, 'parent_id');
    }
    public function children(): HasMany
    {
        return $this->hasMany(Area::class, 'parent_id')
            ->orderBy('priority', 'asc')
            ->orderBy('name', 'asc');
    }
    public function scenes(): HasMany
    {
        return $this->hasMany(Scene::class)
            ->orderBy('created_at')
            ->orderBy('id');
    }


    // SCOPES
    public function scopeContainers($query)
    {
        return $query->where('is_container', true);
    }

    public function scopeLeafAreas($query)
    {
        return $query->where('is_container', false);
    }

    // ACCESSORS
    public function getTypeLabelAttribute()
    {
        return $this->is_container ? 'Container Area' : 'Scene Area';
    }

    public function getMarkerColorAttribute()
    {
        return $this->is_container ? 'red' : 'blue';
    }
}
