<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Link extends Model {
    protected $guarded = [];
    public function sourceScene() { return $this->belongsTo(Scene::class, 'source_scene_id'); }
    public function targetScene() { return $this->belongsTo(Scene::class, 'target_scene_id'); }
}
