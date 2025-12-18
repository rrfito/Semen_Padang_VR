<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Link extends Model {
    use LogsActivity;
    
    protected $fillable = ['source_scene_id', 'target_scene_id', 'yaw', 'pitch', 'type', 'distance', 'is_published', 'last_published_at'];
    // protected $guarded = [];
    public function sourceScene() { return $this->belongsTo(Scene::class, 'source_scene_id'); }
    public function targetScene() { return $this->belongsTo(Scene::class, 'target_scene_id'); }
    
    // SPATIE ACTIVITY LOG CONFIGURATION
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['yaw', 'pitch', 'type'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn(string $eventName) => match($eventName) {
                'created' => "Created link from scene to scene",
                'updated' => "Updated link properties",
                'deleted' => "Deleted link",
                default => "Event {$eventName} on link"
            });
    }
    
    protected $casts = [
        'yaw' => 'double',
        'pitch' => 'double',
        'is_published' => 'boolean',
        'last_published_at' => 'datetime',
    ];
}
