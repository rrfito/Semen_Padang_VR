<?php

namespace App\Jobs;

use App\Models\Scene;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Intervention\Image\Laravel\Facades\Image;

class ResizeImageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $scene;

    public function __construct(Scene $scene)
    {
        $this->scene = $scene;
    }

    public function handle()
    {
        ini_set('memory_limit', '512M');
        ini_set('upload_max_filesize', '150M');
        ini_set('post_max_size', '150M');
        $path = storage_path('app/public/' . $this->scene->image_path);

        if (!file_exists($path))
            return;

        try {
            // Resize logic for Mobile Optimization
            // Max width 4096px, Quality 80%
            $image = Image::read($path);

            if ($image->width() > 4096) {
                $image->scale(width: 4096);
                $image->save($path, quality: 80);
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Resize failed for Scene ' . $this->scene->id . ': ' . $e->getMessage());
        }
    }
}
