<?php

namespace App\Http\Controllers;

use App\Models\Drafts\AreaDraft;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AreaManagementController extends Controller
{
    public function index(Request $request)
    {
        $query = AreaDraft::whereNull('parent_id')
            ->where('marked_for_deletion', false)
            ->with(['creator:id,name'])
            ->withCount(['scenes' => fn($q) => $q->where('marked_for_deletion', false)]);

        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $sortField = $request->input('sort_field', 'name');
        $sortDirection = $request->input('sort_direction', 'asc');
        $query->orderBy($sortField, $sortDirection);

        $areas = $query->paginate(15)->through(fn($area) => [
            'id' => $area->id,
            'name' => $area->name,
            'created_by' => $area->created_by,
            'creator_name' => $area->creator->name ?? null,
            'scenes_count' => $area->scenes_count,
        ]);

        $admins = User::where('role', 'admin')
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Admin/AreaManagement', [
            'areas' => $areas,
            'admins' => $admins,
            'filters' => $request->only(['search', 'status', 'sort_field', 'sort_direction']),
        ]);
    }

    public function updateOwner(Request $request, $id)
    {
        $area = AreaDraft::findOrFail($id);

        $this->authorize('transferOwnership', $area);

        $validated = $request->validate([
            'created_by' => 'nullable|exists:users,id',
        ]);

        $area->update(['created_by' => $validated['created_by']]);

        return back()->with('success', 'Pemilik area berhasil diubah');
    }
}
