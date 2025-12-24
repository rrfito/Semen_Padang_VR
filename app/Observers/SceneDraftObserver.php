<?php

namespace App\Observers;

use App\Models\Drafts\SceneDraft;
use App\Models\Scene;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class SceneDraftObserver
{
    /**
     * Handle the SceneDraft "deleted" event.
     */
    public function deleted(SceneDraft $sceneDraft): void
    {
        // Debug Log
        Log::info("SceneDraftObserver: Deleting Draft ID {$sceneDraft->id} (Published ID: {$sceneDraft->published_id})");

        // Logic Cleanup Image
        if ($sceneDraft->image_path) {

            // Cek apakah ini draft baru (belum publish) ATAU gambar diganti di draft
            $shouldDelete = false;

            if (!$sceneDraft->published_id) {
                // Kasus 1: Draft Baru (New Record)
                // Hapus gambarnya karena belum ada di Live
                $shouldDelete = true;
                Log::info("SceneDraftObserver: Draft is NEW. Deleting image.");
            } else {
                // Kasus 2: Draft Edit (Existing Record)
                // Cek apakah gambarnya BEDA dengan Live
                $liveScene = Scene::find($sceneDraft->published_id);

                if ($liveScene && $liveScene->image_path !== $sceneDraft->image_path) {
                    // Gambar diedit di draft, lalu draft dihapus/discard.
                    // Gambar draft (yg baru) adalah yatim piatu -> HAPUS.
                    $shouldDelete = true;
                    Log::info("SceneDraftObserver: Draft image differs from Live. Deleting orphaned draft image.");
                }
            }

            if ($shouldDelete) {
                $this->deleteImageAndThumbnails($sceneDraft->image_path);
            }
        }
    }

    /**
     * Handle the SceneDraft "updating" event.
     */
    public function updating(SceneDraft $sceneDraft): void
    {
        // Jika gambar diganti DI DALAM DRAFT (misal upload ulang sebelum publish)
        // Hapus gambar lama DRAFT tersebut
        if ($sceneDraft->isDirty('image_path')) {
            $oldImage = $sceneDraft->getOriginal('image_path');

            // Pastikan gambar lama bukan gambar Live (Safety Check)
            // Agar tidak tidak sengaja menghapus gambar Live jika logic revert terjadi
            $isLiveImage = false;
            if ($sceneDraft->published_id) {
                $liveScene = Scene::find($sceneDraft->published_id);
                if ($liveScene && $liveScene->image_path === $oldImage) {
                    $isLiveImage = true;
                }
            }

            if ($oldImage && !$isLiveImage) {
                Log::info("SceneDraftObserver: Image replaced in draft. Deleting old draft image.");
                $this->deleteImageAndThumbnails($oldImage);
            }
        }
    }

    /**
     * Helper to delete image and its thumbnails
     */
    private function deleteImageAndThumbnails($path)
    {
        $disk = Storage::disk('public');

        if ($disk->exists($path)) {
            $disk->delete($path);
            Log::info("Deleted: $path");
        }

        // Cek dan hapus thumbnails (_v.webp dan _h.webp)
        // Pola: folder/filename_v.webp
        $dir = dirname($path);
        $filename = pathinfo($path, PATHINFO_FILENAME);

        // Thumbnails (Asumsi format dari Scene Model getters)
        $vertical = $dir . '/' . $filename . '_v.webp';
        $horizontal = $dir . '/' . $filename . '_h.webp';

        if ($disk->exists($vertical)) {
            $disk->delete($vertical);
            Log::info("Deleted Thumbnail: $vertical");
        }

        if ($disk->exists($horizontal)) {
            $disk->delete($horizontal);
            Log::info("Deleted Thumbnail: $horizontal");
        }
    }
}
