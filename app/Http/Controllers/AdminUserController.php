<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        $q    = trim((string) $request->query('q', ''));
        $role = (string) $request->query('role', ''); // user|admin|''

        $query = User::query()->withCount(['orders', 'repairs']);

        if ($role !== '') {
            $query->where('role', $role);
        }

        if ($q !== '') {
            $qDigits = preg_replace('/\D+/', '', $q);

            $query->where(function ($sub) use ($q, $qDigits) {
                $sub->where('name', 'like', "%{$q}%")
                    ->orWhere('last_name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");

                if ($qDigits !== '') {
                    $sub->orWhere('phone', 'like', "%{$qDigits}%");
                }
            });
        }

        $users = $query->orderByDesc('created_at')->paginate(20)->withQueryString();

        $roleCounts = User::query()
            ->selectRaw('role, COUNT(*) as c')
            ->groupBy('role')
            ->pluck('c', 'role')
            ->toArray();

        return view('admin.users.index', [
            'users' => $users,
            'q' => $q,
            'role' => $role,
            'roleCounts' => $roleCounts,
        ]);
    }

    public function show(User $user)
    {
        $user->loadCount(['orders', 'repairs']);

        return view('admin.users.show', [
            'user' => $user,
        ]);
    }

    public function updateRole(Request $request, User $user)
    {
        $data = $request->validate([
            'role' => ['required', 'in:user,admin'],
        ]);

        $from = (string) ($user->role ?? 'user');
        $to   = (string) $data['role'];

        if ($from === $to) {
            return redirect()
                ->route('admin.users.show', $user)
                ->with('success', 'El usuario ya tenía ese rol.');
        }

        // ✅ Protección 1: no te podés quitar admin a vos mismo
        if ($user->id === Auth::id() && $to !== 'admin') {
            return back()->withErrors([
                'role' => 'No podés quitarte permisos de admin a vos mismo.',
            ]);
        }

        // ✅ Protección 2: no permitir dejar el sistema sin admins
        if ($from === 'admin' && $to === 'user') {
            $admins = User::where('role', 'admin')->count();
            if ($admins <= 1) {
                return back()->withErrors([
                    'role' => 'No podés quitar el rol al último admin del sistema.',
                ]);
            }
        }

        $user->role = $to;
        $user->save();

        AuditLogger::log($request, 'admin.user.role_changed', [
            'subject_type' => User::class,
            'subject_id' => $user->id,
            'metadata' => [
                'from_role' => $from,
                'to_role' => $to,
            ],
        ]);

        return redirect()
            ->route('admin.users.show', $user)
            ->with('success', 'Rol actualizado correctamente.');
    }
}
