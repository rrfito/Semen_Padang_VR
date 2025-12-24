<?php

namespace App\Jobs;

use App\Models\Scene;
use App\Models\Drafts\SceneDraft;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ProcessSceneImage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Scene|SceneDraft $scene
    ) {
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if (!$this->scene->image_path)
            return;

        $path = Storage::disk('public')->path($this->scene->image_path);

        if (!file_exists($path))
            return;

        try {
            // 1. Naikkan Memory Limit (Penting untuk gambar besar)
            ini_set('memory_limit', '2048M');
            ini_set('upload_max_filesize', '150M');
            ini_set('post_max_size', '150M');

            // 2. Setup Image Manager
            $manager = new ImageManager(new Driver());
            $image = $manager->read($path);

            // 3. Resize jika lebar > 4096px (4K)
            // Ini akan mengurangi ukuran file secara drastis dari 20MB -> ~2-4MB
            if ($image->width() > 4096) {
                $image->scale(width: 4096);
            }

            // 4. Encode ke WebP (Quality 80)
            // WebP lebih ringan 30-50% dibanding JPG dengan kualitas setara
            $encoded = $image->toWebp(quality: 80);

            // 5. Simpan sebagai file baru (.webp)
            $oldPath = $path;
            $filename = pathinfo($this->scene->image_path, PATHINFO_FILENAME);
            $newRelativePath = 'panoramas/' . $filename . '.webp';
            $newAbsolutePath = Storage::disk('public')->path($newRelativePath);

            file_put_contents($newAbsolutePath, (string) $encoded);

            // 6. Update Database using DB Transaction to ensure consistency
            \Illuminate\Support\Facades\DB::transaction(function () use ($newRelativePath, $oldPath) {
                $originalImagePassed = $this->scene->image_path;

                // A. Update the Job's Scene (Draft)
                $this->scene->image_path = $newRelativePath;
                $this->scene->saveQuietly();

                // B. Check for Live Counterpart (Race Condition Fix)
                // If user Published while job was running, the Live scene might still point to the old JPG.
                // We must update it to the new WebP as well.
                if ($this->scene instanceof SceneDraft && $this->scene->published_id) {
                    $liveScene = Scene::find($this->scene->published_id);
                    if ($liveScene && $liveScene->image_path === $originalImagePassed) {
                        $liveScene->image_path = $newRelativePath;
                        $liveScene->saveQuietly();
                        \Log::info("ProcessSceneImage: Also updated Live Scene {$liveScene->id} to WebP.");
                    }
                }

                // C. Safe Deletion Logic
                // Only delete the old JPG if NO other scene is using it.
                // This prevents deleting a file that might be referenced by another entity (though unlikely with unique filenames).
                // For now, simpler approach: we just updated the known references.
                // But let's be safe: Check if any Scene or SceneDraft still uses the old path.

                $stillInUse = Scene::where('image_path', $originalImagePassed)->exists()
                    || SceneDraft::where('image_path', $originalImagePassed)->exists();

                if (!$stillInUse && file_exists($oldPath)) {
                    if (unlink($oldPath)) {
                        \Log::info("ProcessSceneImage: Successfully deleted original file: " . $oldPath);
                    } else {
                        \Log::warning("ProcessSceneImage: Failed to delete original file: " . $oldPath);
                    }
                } else {
                    \Log::info("ProcessSceneImage: Skipped deletion, file still in use or not found: " . $originalImagePassed);
                }
            });

            // Optional: Log success
            \Log::info("Scene {$this->scene->id} converted to WebP successfully.");

        } catch (\Exception $e) {
            \Log::error("Failed to process scene image: " . $e->getMessage());
            // Jangan throw exception agar job tidak retry terus menerus jika file corrupt
        }
    }
}
