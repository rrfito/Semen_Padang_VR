<?php

namespace App\Policies;

use App\Models\Drafts\AreaDraft;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class AreaDraftPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }


    public function view(User $user, AreaDraft $areaDraft): bool
    {
        return $areaDraft->isOwnedBy($user);
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, AreaDraft $areaDraft): bool
    {
        return $areaDraft->isOwnedBy($user);
    }

    public function delete(User $user, AreaDraft $areaDraft): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        // For regular admins, must be the owner (not just unassigned)
        return $areaDraft->created_by === $user->id;
    }

    public function transferOwnership(User $user, AreaDraft $areaDraft): bool
    {
        return $user->isSuperAdmin();
    }


    public function restore(User $user, AreaDraft $areaDraft): bool
    {
        return $user->isSuperAdmin();
    }


    public function forceDelete(User $user, AreaDraft $areaDraft): bool
    {
        return $user->isSuperAdmin();
    }
}
