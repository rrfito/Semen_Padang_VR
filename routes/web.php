<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\TourController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// 1. HALAMAN UTAMA (Peta & Sidebar)
// Ini menggantikan halaman Welcome default
Route::get('/', [TourController::class, 'index'])->name('tour.index');

// 2. HALAMAN VIRTUAL TOUR (360 Viewer)
Route::get('/tour/{scene}', [TourController::class, 'show'])->name('tour.show');

// 3. DASHBOARD USER (Setelah Login)
// Opsional: Halaman ini muncul setelah Pegawai login
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// 4. PROFILE MANAGEMENT (Bawaan Breeze)
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// 5. ADMIN EDITOR (VISUAL TOOL)
Route::middleware(['auth'])->prefix('admin/editor')->name('admin.editor.')->group(function() {
    Route::get('/{area}', [App\Http\Controllers\EditorController::class, 'edit'])->name('visual');
    Route::post('/link', [App\Http\Controllers\EditorController::class, 'saveLink'])->name('link.save');
    Route::delete('/link/{link}', [App\Http\Controllers\EditorController::class, 'deleteLink'])->name('link.delete');
    Route::post('/location', [App\Http\Controllers\EditorController::class, 'updateLocation'])->name('location.update');
    Route::post('/{area}/autolink', [App\Http\Controllers\EditorController::class, 'autoLink'])->name('autolink');
    Route::post('/upload-temp', [App\Http\Controllers\EditorController::class, 'uploadTemp'])->name('upload.temp');
    Route::post('/{area}/save-batch', [App\Http\Controllers\EditorController::class, 'sync'])->name('save.batch');
    Route::post('/{area}/create-sub-area', [App\Http\Controllers\EditorController::class, 'createSubArea'])->name('subarea.create');
    Route::post('/scene/update', [App\Http\Controllers\EditorController::class, 'updateScene'])->name('scene.update');
    Route::delete('/scene/{scene}', [App\Http\Controllers\EditorController::class, 'deleteScene'])->name('scene.delete');
});

require __DIR__.'/auth.php';