<?php

namespace App\Models\Drafts;

use App\Models\Scene;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SceneDraft extends Model
{
    use HasFactory;

    protected $fillable = [
        'published_id',
        'area_id',
        'name',
        'image_path',
        'heading',
        'can_be_gateway',
        'lat',
        'lng',
        'marked_for_deletion'
    ];

    protected $casts = [
        'heading' => 'float',
        'can_be_gateway' => 'boolean',
        'lat' => 'decimal:8',
        'lng' => 'decimal:8',
        'marked_for_deletion' => 'boolean',
    ];

    // Relations
    public function published()
    {
        return $this->belongsTo(Scene::class, 'published_id');
    }

    public function area()
    {
        return $this->belongsTo(AreaDraft::class, 'area_id');
    }

    public function links()
    {
        return $this->hasMany(LinkDraft::class, 'source_scene_id');
    }

    public function incomingLinks()
    {
        return $this->hasMany(LinkDraft::class, 'target_scene_id');
    }
}
