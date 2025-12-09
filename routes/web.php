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

require __DIR__.'/auth.php';