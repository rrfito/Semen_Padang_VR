<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Scene extends Model
{
    protected $fillable = [
        'area_id',
        'name',
        'image_path',
        'type',
        'heading',
        'pitch',
        'roll',
        'hfov',
        'sort_order',
        'is_restricted',
        'location', // PostGIS column
    ];
    // protected $guarded = [];
    protected $hidden = ['location']; // Sembunyikan Alien
    protected $appends = ['location_array']; // Tampilkan Manusia

    
    public function getLocationArrayAttribute()
    {
        if (!$this->location) return ['lat' => 0, 'lng' => 0]; 
        
        $result = DB::selectOne("SELECT ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng FROM scenes WHERE id = ?", [$this->id]);
        return $result ? ['lat' => $result->lat, 'lng' => $result->lng] : null;
    }

    
    public function setLocationArrayAttribute($value)
    {
        if (is_array($value) && isset($value['lat'], $value['lng'])) {
            $lat = $value['lat'];
            $lng = $value['lng'];
        
            $this->attributes['location'] = DB::raw("ST_SetSRID(ST_Point($lng, $lat), 4326)::geography");
        }
    }

    public function area() { return $this->belongsTo(Area::class); }
    public function outgoingLinks() { return $this->hasMany(Link::class, 'source_scene_id'); }
}