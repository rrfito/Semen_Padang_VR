<?php

namespace App\Observers;

use App\Models\Scene;

class SceneObserver
{
    /**
     * Handle the Scene "created" event.
     */
    public function created(Scene $scene): void
    {
        if ($scene->image_path && !str_ends_with(strtolower($scene->image_path), '.webp')) {
            \App\Jobs\ProcessSceneImage::dispatch($scene);
        }
    }

    /**
     * Handle the Scene "updated" event.
     */
    public function updated(Scene $scene): void
    {
        if ($scene->wasChanged('image_path') && $scene->image_path && !str_ends_with(strtolower($scene->image_path), '.webp')) {
            \App\Jobs\ProcessSceneImage::dispatch($scene);
        }
    }

    /**
     * Handle the Scene "updating" event.
     */
    public function updating(Scene $scene): void
    {
        // Hapus foto lama jika diganti baru
        if ($scene->isDirty('image_path')) {
            $oldImage = $scene->getOriginal('image_path');
            if ($oldImage && \Illuminate\Support\Facades\Storage::disk('public')->exists($oldImage)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($oldImage);
            }
            // Hapus thumbnail lama juga
            $this->deleteThumbnails($oldImage);
        }
    }

    /**
     * Handle the Scene "deleted" event.
     */
    public function deleted(Scene $scene): void
    {
        // Hapus foto saat scene dihapus
        if ($scene->image_path && \Illuminate\Support\Facades\Storage::disk('public')->exists($scene->image_path)) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($scene->image_path);
        }

        // Hapus Thumbnails (_v.webp dan _h.webp)
        $this->deleteThumbnails($scene->image_path);
    }

    /**
     * Handle the Scene "restored" event.
     */
    public function restored(Scene $scene): void
    {
        //
    }

    /**
     * Handle the Scene "force deleted" event.
     */
    public function forceDeleted(Scene $scene): void
    {
        //
    }

    /**
     * Helper to delete image and its thumbnails
     */
    private function deleteThumbnails($path)
    {
        if (!$path)
            return;

        $disk = \Illuminate\Support\Facades\Storage::disk('public');

        $dir = dirname($path);
        $filename = pathinfo($path, PATHINFO_FILENAME);

        // Thumbnails
        $vertical = $dir . '/' . $filename . '_v.webp';
        $horizontal = $dir . '/' . $filename . '_h.webp';

        if ($disk->exists($vertical)) {
            $disk->delete($vertical);
        }

        if ($disk->exists($horizontal)) {
            $disk->delete($horizontal);
        }
    }
}
