<?php

namespace App\Models\Drafts;

use App\Models\Area;
use App\Models\User; // Assuming User exists
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class AreaDraft extends Model
{
    use HasFactory;

    protected $fillable = [
        'published_id',
        'parent_id',
        'name',
        'description',
        'level',
        'is_container',
        'priority',
        'lat',
        'lng',
        'is_restricted',
        'marked_for_deletion'
    ];

    protected $casts = [
        'is_container' => 'boolean',
        'is_restricted' => 'boolean',
        'marked_for_deletion' => 'boolean',
        'level' => 'integer',
        'priority' => 'integer',
        'lat' => 'decimal:8',
        'lng' => 'decimal:8',
    ];

    // Relations
    public function published()
    {
        return $this->belongsTo(Area::class, 'published_id');
    }

    public function parent()
    {
        return $this->belongsTo(AreaDraft::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(AreaDraft::class, 'parent_id')->orderBy('priority');
    }

    public function scenes()
    {
        return $this->hasMany(SceneDraft::class, 'area_id');
    }

    public function syncState()
    {
        return $this->hasOne(DraftSyncState::class, 'root_draft_id');
    }
}
