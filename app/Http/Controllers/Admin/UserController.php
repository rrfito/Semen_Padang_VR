<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class UserController extends Controller
{
    public function index()
    {
        $users = User::query()
            ->leftJoin('sessions', 'users.id', '=', 'sessions.user_id')
            ->select('users.*', DB::raw('MAX(sessions.last_activity) as last_activity'))
            ->groupBy('users.id')
            ->orderBy('name')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'last_activity' => $user->last_activity
                        ? Carbon::createFromTimestamp($user->last_activity)->diffForHumans()
                        : 'Never',
                ];
            });

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
        ]);
    }

    public function updateRole(Request $request, User $user)
    {
        $validated = $request->validate([
            'role' => 'required|in:admin,pegawai,pro',
        ]);

        $user->update(['role' => $validated['role']]);

        return back()->with('success', 'User role updated successfully.');
    }
}
