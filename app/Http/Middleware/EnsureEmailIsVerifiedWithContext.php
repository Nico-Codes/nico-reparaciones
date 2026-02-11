<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureEmailIsVerifiedWithContext
{
    public function handle(Request $request, Closure $next, string $context = 'general'): Response
    {
        $user = $request->user();
        if (! $user) {
            return redirect()->route('login');
        }

        if (! method_exists($user, 'hasVerifiedEmail') || $user->hasVerifiedEmail()) {
            return $next($request);
        }

        $request->session()->put('verification_required_for', $context);

        if ($context === 'checkout') {
            $request->session()->put('post_verification_redirect', route('checkout'));
        }

        return redirect()->route('verification.notice');
    }
}

