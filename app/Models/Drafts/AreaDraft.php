<?php

namespace App\Models\Drafts;

use App\Models\Area;
use App\Models\User;
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
        'is_hidden',
        'marked_for_deletion',
        'created_by',
    ];

    protected $casts = [
        'is_container' => 'boolean',
        'is_restricted' => 'boolean',
        'is_hidden' => 'boolean',
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
        return $this->hasMany(AreaDraft::class, 'parent_id')->orderBy('priority')->orderBy('name');
    }

    public function scenes()
    {
        return $this->hasMany(SceneDraft::class, 'area_id')->orderBy('priority')->orderBy('name');
    }

    public function syncState()
    {
        return $this->hasOne(DraftSyncState::class, 'root_draft_id');
    }

    /**
     * Get the user who created/owns this area draft.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Check if this area is owned by the given user.
     * Returns true if:
     * - User is super_admin (full access)
     * - Area has no owner (legacy/unassigned)
     * - User is the owner
     */
    public function isOwnedBy(User $user): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($this->created_by === null) {
            return true; // Unassigned area - anyone can edit
        }

        return $this->created_by === $user->id;
    }

    /**
     * Get the root area (Level 1 ancestor) for ownership checks.
     */
    public function getRootArea(): ?AreaDraft
    {
        if ($this->level === 1 || $this->parent_id === null) {
            return $this;
        }

        $parent = $this->parent;
        while ($parent && $parent->parent_id !== null) {
            $parent = $parent->parent;
        }

        return $parent ?? $this;
    }
}
