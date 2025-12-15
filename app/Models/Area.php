<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Area extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'parent_id',
        'type', // group / default
        'priority',
        'lat',
        'lng',
        'is_restricted',
    ];

    protected $casts = [
        'is_restricted' => 'boolean',
        'lat' => 'decimal:8',
        'lng' => 'decimal:8',
    ];

    public function parent(): BelongsTo { return $this->belongsTo(Area::class, 'parent_id'); }
    public function children(): HasMany { 
        return $this->hasMany(Area::class, 'parent_id')
            ->orderBy('priority', 'asc')
            ->orderBy('name', 'asc'); 
    }
    public function scenes(): HasMany { return $this->hasMany(Scene::class)->orderBy('sort_order'); }

    // SCOPES
    public function scopeGroups($query)
    {
        return $query->where('type', 'group');
    }

    public function scopeScenes($query)
    {
        return $query->where('type', 'default');
    }

    // ACCESSORS
    public function getTypeLabelAttribute()
    {
        return $this->type === 'group' ? 'Area Group' : 'Area Scene';
    }

    public function getMarkerColorAttribute()
    {
        // Example Logic (Adjust as needed)
        if ($this->type === 'group') return 'red';
        return 'blue';
    }
}
