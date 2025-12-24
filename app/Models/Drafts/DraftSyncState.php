<?php

namespace App\Models\Drafts;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DraftSyncState extends Model
{
    use HasFactory;

    protected $fillable = [
        'root_draft_id',
        'status',
        'live_checksum',
        'last_synced_at'
    ];

    protected $casts = [
        'last_synced_at' => 'datetime',
    ];

    public function rootDraft()
    {
        return $this->belongsTo(AreaDraft::class, 'root_draft_id');
    }
}
