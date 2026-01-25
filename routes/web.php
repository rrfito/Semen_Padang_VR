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

Route::get('/approval-pending', function () {
    return Inertia::render('Auth/ApprovalPending');
})->name('approval.notice');

// 2. HALAMAN VIRTUAL TOUR (360 Viewer)
Route::get('/tour/{scene}', [TourController::class, 'show'])->name('tour.show');


// 4. PROFILE MANAGEMENT (Bawaan Breeze)
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// 5. ADMIN VISUAL EDITOR (GLOBAL WORKSPACE)
// Apply 'admin' middleware (EnsureUserIsAdmin)
Route::middleware(['auth', 'admin'])->prefix('admin')->group(function () {

    // Redirect /admin to /admin/dashboard
    Route::get('/', function () {
        return redirect()->route('admin.dashboard');
    });

    // Admin Dashboard
    Route::get('/dashboard', [\App\Http\Controllers\Admin\AdminDashboardController::class, 'index'])->name('admin.dashboard');
    Route::get('/UserManagement', [\App\Http\Controllers\Admin\UserManagementController::class, 'index'])->name('admin.user-management');
    Route::put('/UserManagement/{user}/role', [\App\Http\Controllers\Admin\UserManagementController::class, 'updateRole'])->name('admin.users.update-role');
    Route::post('/UserManagement/{user}/approve', [\App\Http\Controllers\Admin\UserManagementController::class, 'approve'])->name('admin.users.approve');
    Route::post('/UserManagement/{user}/reject', [\App\Http\Controllers\Admin\UserManagementController::class, 'reject'])->name('admin.users.reject');

    // Main Global Route
    Route::get('/visual-editor', [EditorController::class, 'index'])->name('admin.editor.index');

    // Manual Book PDF Route
    Route::get('/manual-book', [EditorController::class, 'showManualBook'])->name('admin.manual-book');


    // API Routes for Editor
    Route::prefix('visual-editor/api')->middleware('auth')->name('admin.editor.')->group(function () {
        // Area Management
        Route::post('/sub-area', [EditorController::class, 'createSubArea'])->name('subarea.create');
        Route::get('/area/{id}', [EditorController::class, 'showArea'])->name('area.show');
        Route::patch('/area/{id}', [EditorController::class, 'updateArea'])->name('area.update');
        Route::delete('/area/{id}', [EditorController::class, 'destroyArea'])->name('area.destroy');
        Route::get('/area/{id}/deletion-impact', [EditorController::class, 'getDeletionImpact'])->name('area.deletion-impact');

        // Scene Management
        Route::post('/scenes/bulk-upload', [EditorController::class, 'bulkUploadScenes'])->name('scenes.bulk-upload');
        Route::get('/scene/{id}', [EditorController::class, 'showScene'])->name('scene.details'); // Replaces details
        Route::patch('/scene/{id}', [EditorController::class, 'updateScene'])->name('scene.update');
        Route::delete('/scene/{id}', [EditorController::class, 'destroyScene'])->name('scene.destroy');

        // Link Management
        Route::post('/scene/{sceneId}/link', [EditorController::class, 'createLink'])->name('scene.link.create');
        Route::patch('/scene/{sceneId}/link/{linkId}', [EditorController::class, 'updateLink'])->name('scene.link.update');
        Route::delete('/scene/{sceneId}/link/{linkId}', [EditorController::class, 'deleteLink'])->name('scene.link.delete');

        // Info Spot Management
        Route::post('/scene/{sceneId}/info-spot', [EditorController::class, 'createInfoSpot'])->name('scene.info-spot.create');
        Route::patch('/scene/{sceneId}/info-spot/{infoSpotId}', [EditorController::class, 'updateInfoSpot'])->name('scene.info-spot.update');
        Route::delete('/scene/{sceneId}/info-spot/{infoSpotId}', [EditorController::class, 'deleteInfoSpot'])->name('scene.info-spot.delete');

        // Publish Workflow
        Route::get('/pending-changes', [EditorController::class, 'getPendingChanges'])->name('pending-changes');
        Route::post('/publish-all', [EditorController::class, 'publishAll'])->name('publish-all');
        Route::post('/discard-all/{rootDraftId}', [EditorController::class, 'discardDrafts'])->name('discard-all');
        Route::post('/autolink/execute', [EditorController::class, 'autoLinkExecute'])->name('autolink.execute');
        Route::post('/{type}/{id}/reorder', [EditorController::class, 'reorderNode'])->name('reorder');
    });

    // LEGACY REDIRECT: /admin/editor/{area} -> /admin/visual-editor?focus=area:{id}
    Route::get('/editor/{area}', function ($area) {
        return redirect()->route('admin.editor.index', ['focus' => 'area:' . $area]);
    });
});

require __DIR__ . '/auth.php';