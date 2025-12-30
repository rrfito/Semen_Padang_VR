<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class UserManagementController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $sortField = $request->input('sort_field', 'name');
        $sortDirection = $request->input('sort_direction', 'asc');

        $users = User::query()
            ->leftJoin('sessions', 'users.id', '=', 'sessions.user_id')
            ->select('users.*', DB::raw('MAX(sessions.last_activity) as last_activity'))
            ->groupBy('users.id')
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('users.name', 'like', "%{$search}%")
                        ->orWhere('users.email', 'like', "%{$search}%");
                });
            })
            ->orderBy($sortField, $sortDirection)
            ->paginate(10)
            ->withQueryString()
            ->through(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'last_activity' => $user->last_activity
                        ? Carbon::createFromTimestamp($user->last_activity)->locale('id')->diffForHumans()
                        : 'Tidak pernah aktif',
                ];
            });

        return Inertia::render('Admin/UserManagement', [
            'users' => $users,
            'filters' => $request->only(['search', 'sort_field', 'sort_direction']),
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
