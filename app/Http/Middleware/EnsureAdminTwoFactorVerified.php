<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminTwoFactorVerified
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !$user->isAdmin() || !$user->hasAdminTwoFactorEnabled()) {
            return $next($request);
        }

        $verifiedAt = (int) $request->session()->get('admin_2fa_passed_at', 0);
        $maxAgeMinutes = max(0, (int) config('security.admin.two_factor_session_minutes', 0));
        $sessionStillValid = $verifiedAt > 0
            && ($maxAgeMinutes === 0 || (time() - $verifiedAt) <= ($maxAgeMinutes * 60));

        if ($sessionStillValid) {
            return $next($request);
        }

        $request->session()->forget('admin_2fa_passed_at');
        $request->session()->put('url.intended', $request->fullUrl());

        return redirect()
            ->route('admin.two_factor.challenge')
            ->withErrors([
                'code' => 'Ingresa tu codigo 2FA para continuar al panel admin.',
            ]);
    }
}
