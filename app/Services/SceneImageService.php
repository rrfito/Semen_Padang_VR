<?php

namespace App\Services;

use App\Models\Drafts\SceneDraft;
use App\Jobs\ProcessSceneImage;
use Illuminate\Http\UploadedFile;

class SceneImageService
{
    protected $geoService;

    public function __construct(GeoService $geoService)
    {
        $this->geoService = $geoService;
    }

    /**
     * Process multiple uploaded scene images.
     * Stores files, extracts EXIF data, creates Drafts, and dispatches optimization jobs.
     *
     * @param UploadedFile[] $files
     * @param int $areaId
     * @return SceneDraft[]
     */
    public function processUploads(array $files, int $areaId)
    {
        $uploadedScenes = [];

        foreach ($files as $file) {
            // Store file
            $filename = 'pano_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('panoramas', $filename, 'public');
            $fullPath = storage_path('app/public/' . $path);

            // Extract metadata
            $lat = 0;
            $lng = 0;
            $heading = 0;

            if (function_exists('exif_read_data') && @exif_imagetype($fullPath) !== false) {
                try {
                    $exif = @exif_read_data($fullPath);
                    if ($exif && is_array($exif)) {
                        if (isset($exif['GPSLatitude'], $exif['GPSLatitudeRef'], $exif['GPSLongitude'])) {
                            $lat = $this->geoService->getGps($exif['GPSLatitude'], $exif['GPSLatitudeRef']);
                            $lng = $this->geoService->getGps($exif['GPSLongitude'], $exif['GPSLongitudeRef']);
                        }
                    }
                } catch (\Exception $e) {
                    // Fail silently on EXIF errors
                }
            }

            // Create Draft Scene
            $scene = SceneDraft::create([
                'area_id' => $areaId,
                'image_path' => $path,
                'name' => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
                'heading' => $heading,
                'lat' => $lat != 0 ? $lat : null,
                'lng' => $lng != 0 ? $lng : null,
                'published_id' => null
            ]);

            $uploadedScenes[] = $scene;

            // Dispatch Job to optimize image (Resize/WebP)
            ProcessSceneImage::dispatch($scene);
        }

        return $uploadedScenes;
    }
}
