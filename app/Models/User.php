<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

// 1. IMPORT CLASS FILAMENT (Wajib)
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;

// 2. TAMBAHKAN 'implements FilamentUser'
class User extends Authenticatable implements FilamentUser
{
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role', // 3. TAMBAHKAN INI (Agar bisa simpan role admin/pegawai)
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // 4. LOGIC KEAMANAN FILAMENT
    // Fungsi ini menentukan siapa yang boleh masuk ke /admin
    public function canAccessPanel(Panel $panel): bool
    {
        // Hanya user dengan role 'admin' yang boleh masuk dashboard
        // Pegawai biasa akan ditolak (Error 403 Forbidden)
        return $this->role === 'admin';
    }
}