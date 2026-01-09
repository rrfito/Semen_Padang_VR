<?php

namespace App\Providers;

use App\Models\Scene;
use App\Observers\SceneObserver;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {


        Vite::prefetch(concurrency: 3);
        Scene::observe(SceneObserver::class);
        \App\Models\Drafts\SceneDraft::observe(\App\Observers\SceneDraftObserver::class);
    }
}
