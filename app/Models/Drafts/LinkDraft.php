<?php

namespace App\Models\Drafts;

use App\Models\Link;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LinkDraft extends Model
{
    use HasFactory;

    protected $fillable = [
        'published_id',
        'source_scene_id',
        'target_scene_id',
        'type',
        'yaw',
        'pitch',
        'distance',
        'marked_for_deletion'
    ];

    protected $casts = [
        'yaw' => 'float',
        'pitch' => 'float',
        'distance' => 'float',
        'marked_for_deletion' => 'boolean',
    ];

    // Relations
    public function published()
    {
        return $this->belongsTo(Link::class, 'published_id');
    }

    public function sourceScene()
    {
        return $this->belongsTo(SceneDraft::class, 'source_scene_id');
    }

    public function targetScene()
    {
        return $this->belongsTo(SceneDraft::class, 'target_scene_id');
    }
}
