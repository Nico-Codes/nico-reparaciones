<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\IpUtils;
use Symfony\Component\HttpFoundation\Response;

class RestrictAdminAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user) {
            abort(403, 'Acceso no autorizado.');
        }

        $allowedEmails = $this->parseCsv((string) config('security.admin.allowed_emails', ''));
        if ($allowedEmails !== []) {
            $currentEmail = Str::lower((string) $user->email);
            $emailAllowed = in_array($currentEmail, array_map(
                static fn (string $email): string => Str::lower($email),
                $allowedEmails
            ), true);

            if (!$emailAllowed) {
                abort(403, 'Tu usuario no esta habilitado para ingresar al panel admin.');
            }
        }

        $allowedIps = $this->parseCsv((string) config('security.admin.allowed_ips', ''));
        if ($allowedIps !== []) {
            $requestIp = (string) $request->ip();
            $ipAllowed = false;

            foreach ($allowedIps as $allowedIp) {
                if (IpUtils::checkIp($requestIp, $allowedIp)) {
                    $ipAllowed = true;
                    break;
                }
            }

            if (!$ipAllowed) {
                abort(403, 'La IP actual no esta habilitada para el panel admin.');
            }
        }

        $requireReauthMinutes = max(0, (int) config('security.admin.require_reauth_minutes', 0));
        if ($requireReauthMinutes > 0) {
            $authTime = (int) $request->session()->get('auth_time', 0);
            $maxAgeSeconds = $requireReauthMinutes * 60;

            if ($authTime <= 0 || (time() - $authTime) > $maxAgeSeconds) {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect()
                    ->route('login')
                    ->withErrors([
                        'email' => 'Por seguridad, volve a iniciar sesion para entrar al panel admin.',
                    ]);
            }
        }

        return $next($request);
    }

    /**
     * @return array<int, string>
     */
    private function parseCsv(string $raw): array
    {
        $raw = trim($raw);
        if ($raw === '') {
            return [];
        }

        return array_values(array_filter(array_map(
            static fn (string $value): string => trim($value),
            explode(',', $raw)
        )));
    }
}
