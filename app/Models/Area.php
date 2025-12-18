<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Area extends Model
{
    use LogsActivity;
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
        'is_published',
        'last_published_at',
    ];

    protected $casts = [
        'is_container' => 'boolean',
        'is_restricted' => 'boolean',
        'is_published' => 'boolean',
        'level' => 'integer',
        'lat' => 'decimal:8',
        'lng' => 'decimal:8',
        'last_published_at' => 'datetime',
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

    // SPATIE ACTIVITY LOG CONFIGURATION
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'description', 'lat', 'lng', 'is_restricted', 'priority'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn(string $eventName) => match ($eventName) {
                'created' => "Created area '{$this->name}'",
                'updated' => "Updated area '{$this->name}'",
                'deleted' => "Deleted area '{$this->name}'",
                default => "Event {$eventName} on area '{$this->name}'"
            });
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
