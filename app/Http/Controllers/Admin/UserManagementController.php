<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Drafts\AreaDraft;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class UserManagementController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $sortField = $request->input('sort_field', 'name');
        $sortDirection = $request->input('sort_direction', 'asc');
        $status = $request->input('status', 'active');

        $users = User::query()
            ->where('status', $status)
            ->where('users.id', '!=', Auth::id()) // Exclude current user
            ->where('role', '!=', 'super_admin') // Exclude super admin
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
                $ownedAreas = AreaDraft::where('created_by', $user->id)
                    ->whereNull('parent_id')
                    ->where('marked_for_deletion', false)
                    ->get(['id', 'name']);

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                    'created_at' => $user->created_at->format('d M Y H:i'),
                    'last_activity' => $user->last_activity
                        ? Carbon::createFromTimestamp($user->last_activity)->locale('id')->diffForHumans()
                        : 'Tidak pernah aktif',
                    'owned_areas' => $ownedAreas->map(fn($a) => ['id' => $a->id, 'name' => $a->name]),
                    'owned_areas_count' => $ownedAreas->count(),
                ];
            });

        return Inertia::render('Admin/UserManagement', [
            'users' => $users,
            'filters' => $request->only(['search', 'sort_field', 'sort_direction', 'status']),
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

    public function transferSuperAdmin(User $user)
    {
        $currentUser = Auth::user();


        if (!$currentUser->isSuperAdmin()) {
            abort(403, 'Hanya Super Admin yang dapat melakukan transfer.');
        }


        if ($user->id === $currentUser->id) {
            abort(400, 'Tidak dapat transfer ke diri sendiri.');
        }


        DB::transaction(function () use ($currentUser, $user) {

            AreaDraft::where('created_by', $user->id)
                ->update(['created_by' => $currentUser->id]);


            User::where('id', $currentUser->id)->update(['role' => 'admin']);


            $user->update(['role' => 'super_admin']);
        });


        Auth::logout();
        request()->session()->invalidate();
        request()->session()->regenerateToken();

        return redirect()->route('login')->with('success', 'Transfer Super Admin berhasil. Silakan login kembali.');
    }

    public function approve(Request $request, User $user)
    {

        $data = $request->validate([
            'role' => 'nullable|in:admin,pegawai,pro',
        ]);

        $updateData = ['status' => 'active'];
        if (isset($data['role'])) {
            $updateData['role'] = $data['role'];
        }

        $user->update($updateData);

        return back()->with('success', 'User approved successfully.');
    }

    public function reject(User $user)
    {
        $user->update(['status' => 'rejected']);


        return back()->with('success', 'User request rejected.');
    }
}

