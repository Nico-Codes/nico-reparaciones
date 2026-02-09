<?php

namespace App\Policies;

use App\Models\Repair;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class RepairPolicy
{
    public function view(User $user, Repair $repair): Response
    {
        if ((int) $repair->user_id === (int) $user->id) {
            return Response::allow();
        }

        return Response::denyAsNotFound();
    }
}
