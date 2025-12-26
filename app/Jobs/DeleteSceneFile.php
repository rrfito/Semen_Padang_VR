<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class DeleteSceneFile implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public string $path
    ) {
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if (file_exists($this->path)) {
            if (unlink($this->path)) {
                \Log::info("Delayed Cleanup: Deleted file {$this->path}");
            } else {
                \Log::warning("Delayed Cleanup: Failed to delete file {$this->path}");
            }
        } else {
            \Log::info("Delayed Cleanup: File not found or already deleted {$this->path}");
        }
    }
}
