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

            // 6. Update Database (PENTING: saveQuietly agar tidak trigger Observer lagi/Looping)
            if ($this->scene->image_path !== $newRelativePath) {
                $this->scene->image_path = $newRelativePath;
                $this->scene->saveQuietly();

                // 7. Hapus file lama (JPG)
                if (file_exists($oldPath)) {
                    if (unlink($oldPath)) {
                        \Log::info("ProcessSceneImage: Successfully deleted original file: " . $oldPath);
                    } else {
                        \Log::warning("ProcessSceneImage: Failed to delete original file: " . $oldPath);
                    }
                } else {
                    \Log::warning("ProcessSceneImage: Original file not found for deletion: " . $oldPath);
                }
            }

            // Optional: Log success
            \Log::info("Scene {$this->scene->id} converted to WebP successfully.");

        } catch (\Exception $e) {
            \Log::error("Failed to process scene image: " . $e->getMessage());
            // Jangan throw exception agar job tidak retry terus menerus jika file corrupt
        }
    }
}
