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
        'heading',
        'can_be_gateway',
        'location', // PostGIS column
        'location', // PostGIS column
    ];
    // protected $guarded = [];
    protected $hidden = ['location']; // Sembunyikan Alien
    protected $appends = ['location_array']; // Tampilkan Manusia


    public function getLocationArrayAttribute()
    {
        if (!$this->location)
            return ['lat' => 0, 'lng' => 0];

        $result = DB::selectOne("SELECT ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng FROM scenes WHERE id = ?", [$this->id]);
        return $result ? ['lat' => $result->lat, 'lng' => $result->lng] : null;
    }

    // Individual lat/lng accessors for easier access
    public function getLatAttribute()
    {
        if (!$this->location)
            return 0;

        $result = DB::selectOne("SELECT ST_Y(location::geometry) as lat FROM scenes WHERE id = ?", [$this->id]);
        return $result ? (float) $result->lat : 0;
    }

    public function getLngAttribute()
    {
        if (!$this->location)
            return 0;

        $result = DB::selectOne("SELECT ST_X(location::geometry) as lng FROM scenes WHERE id = ?", [$this->id]);
        return $result ? (float) $result->lng : 0;
    }


    public function setLocationArrayAttribute($value)
    {
        if (is_array($value) && isset($value['lat'], $value['lng'])) {
            $lat = $value['lat'];
            $lng = $value['lng'];

            $this->attributes['location'] = DB::raw("ST_SetSRID(ST_Point($lng, $lat), 4326)::geography");
        }
    }

    // Image URL accessors
    public function getUrlAttribute()
    {
        if (!$this->image_path)
            return null;
        return asset('storage/' . $this->image_path);
    }

    public function getUrlVAttribute()
    {
        if (!$this->image_path)
            return null;
        // Generate vertical thumbnail path: panoramas/filename_v.webp
        $dir = dirname($this->image_path);
        $filename = pathinfo($this->image_path, PATHINFO_FILENAME);
        $verticalPath = $dir . '/' . $filename . '_v.webp';
        return asset('storage/' . $verticalPath);
    }

    public function getUrlHAttribute()
    {
        if (!$this->image_path)
            return null;
        // Generate horizontal thumbnail path: panoramas/filename_h.webp
        $dir = dirname($this->image_path);
        $filename = pathinfo($this->image_path, PATHINFO_FILENAME);
        $horizontalPath = $dir . '/' . $filename . '_h.webp';
        return asset('storage/' . $horizontalPath);
    }



    public function area()
    {
        return $this->belongsTo(Area::class);
    }
    public function outgoingLinks()
    {
        return $this->hasMany(Link::class, 'source_scene_id');
    }


    protected $casts = [
        'heading' => 'double',
        'can_be_gateway' => 'boolean',
    ];
}