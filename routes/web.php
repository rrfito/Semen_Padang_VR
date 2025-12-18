<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\TourController;
use App\Http\Controllers\EditorController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// 1. HALAMAN UTAMA (Peta & Sidebar)
Route::get('/', [TourController::class, 'index'])->name('tour.index');

// 2. HALAMAN VIRTUAL TOUR (360 Viewer)
Route::get('/tour/{scene}', [TourController::class, 'show'])->name('tour.show');

// 3. DASHBOARD USER (Setelah Login)
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// 4. PROFILE MANAGEMENT (Bawaan Breeze)
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// 5. ADMIN VISUAL EDITOR (GLOBAL WORKSPACE)
Route::middleware(['auth'])->prefix('admin')->group(function () {

    // Main Global Route
    Route::get('/visual-editor', [EditorController::class, 'index'])->name('admin.editor.index');

    // API Routes for Editor
    Route::prefix('visual-editor/api')->name('admin.editor.')->group(function () {
        Route::get('/scene/{scene}', [EditorController::class, 'sceneDetails'])->name('scene.details');
        Route::post('/sync', [EditorController::class, 'sync'])->name('sync');
        Route::post('/upload-temp', [EditorController::class, 'uploadTemp'])->name('upload.temp');
        Route::post('/sub-area', [EditorController::class, 'createSubArea'])->name('subarea.create');
        Route::patch('/area/{area}', [EditorController::class, 'updateArea'])->name('area.update');
        Route::post('/autolink/execute', [EditorController::class, 'autoLinkAll'])->name('autolink.execute');
        Route::get('/area/{area}/deletion-impact', [EditorController::class, 'getAreaDeletionImpact'])->name('area.deletion-impact');
        Route::delete('/area/{area}', [EditorController::class, 'destroyArea'])->name('area.destroy');
        Route::delete('/scene/{scene}', [EditorController::class, 'destroyScene'])->name('scene.destroy');
        Route::patch('/scene/{scene}', [EditorController::class, 'updateScene'])->name('scene.update');

        // Scene upload routes
        Route::post('/scenes/bulk-upload', [EditorController::class, 'bulkUploadScenes'])->name('scenes.bulk-upload');
        Route::get('/area/{area}', [EditorController::class, 'showArea'])->name('area.show');

        // Publish workflow routes
        Route::get('/pending-changes', [EditorController::class, 'getPendingChanges'])->name('pending-changes');
        Route::post('/publish-all', [EditorController::class, 'publishAll'])->name('publish-all');
        Route::post('/publish-area/{area}', [EditorController::class, 'publishArea'])->name('publish-area');
    });

    // LEGACY REDIRECT: /admin/editor/{area} -> /admin/visual-editor?focus=area:{id}
    Route::get('/editor/{area}', function ($area) {
        return redirect()->route('admin.editor.index', ['focus' => 'area:' . $area]);
    });
});

require __DIR__ . '/auth.php';