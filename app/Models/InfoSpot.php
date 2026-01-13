<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InfoSpot extends Model
{
    protected $fillable = [
        'scene_id',
        'title',
        'description',
        'yaw',
        'pitch',
    ];

    protected $casts = [
        'yaw' => 'double',
        'pitch' => 'double',
    ];

    public function scene()
    {
        return $this->belongsTo(Scene::class);
    }
}
