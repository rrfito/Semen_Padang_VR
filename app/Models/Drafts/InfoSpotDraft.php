<?php

namespace App\Models\Drafts;

use App\Models\InfoSpot;
use Illuminate\Database\Eloquent\Model;

class InfoSpotDraft extends Model
{
    protected $fillable = [
        'published_id',
        'scene_id',
        'title',
        'description',
        'yaw',
        'pitch',
        'marked_for_deletion',
    ];

    protected $casts = [
        'yaw' => 'double',
        'pitch' => 'double',
        'marked_for_deletion' => 'boolean',
    ];

    /**
     * Relationship to the published (Live) version.
     */
    public function published()
    {
        return $this->belongsTo(InfoSpot::class, 'published_id');
    }

    /**
     * Relationship to the parent scene draft.
     */
    public function scene()
    {
        return $this->belongsTo(SceneDraft::class, 'scene_id');
    }
}
