<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Spatie\Activitylog\Models\Activity;

class CleanupActivityLog extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'activitylog:cleanup {--days=90 : Number of days to retain published logs}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete published activity logs older than specified days (default: 90)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $days = $this->option('days');
        $cutoff = now()->subDays($days);

        $this->info("Deleting published activity logs older than {$days} days ({$cutoff->toDateTimeString()})...");

        $count = Activity::where('is_published', true)
            ->where('created_at', '<', $cutoff)
            ->delete();

        $this->info("✅ Deleted {$count} old activity logs");

        return 0;
    }
}
