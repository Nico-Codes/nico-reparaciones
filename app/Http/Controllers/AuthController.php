<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    /**
     * Mostrar formulario de login.
     */
    public function showLogin()
    {
        return view('auth.login');
    }

    /**
     * Procesar login.
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required'],
        ], [
            'email.required'    => 'Ingresá tu email.',
            'email.email'       => 'Ingresá un email válido.',
            'password.required' => 'Ingresá tu contraseña.',
        ]);


        // Normalización
        $credentials['email'] = Str::lower(trim($credentials['email']));

        // Rate limit (5 intentos / 60s por email+ip)
        $throttleKey = 'login:' . Str::transliterate($credentials['email']) . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return back()->withErrors([
                'email' => "Demasiados intentos. Probá de nuevo en {$seconds} segundos.",
            ])->onlyInput('email');
        }

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            RateLimiter::clear($throttleKey);

            $request->session()->regenerate();
            $request->session()->put('auth_time', time());
            $request->session()->forget('admin_2fa_passed_at');

            $user = Auth::user();
            if ($user && method_exists($user, 'hasVerifiedEmail') && ! $user->hasVerifiedEmail()) {
                $user->sendEmailVerificationNotification();

                return redirect()
                    ->route('verification.notice')
                    ->with('status', 'verification-link-sent');
            }

            $fallback = ($user->role ?? 'user') === 'admin'
                ? route('admin.dashboard')
                : route('home');

            return redirect()->intended($fallback)
                ->with('success', 'Sesión iniciada correctamente.');
        }

        RateLimiter::hit($throttleKey, 60);

        return back()->withErrors([
            'email' => 'Las credenciales no coinciden con nuestros registros.',
        ])->onlyInput('email');
    }


    /**
     * Mostrar formulario de registro.
     */
    public function showRegister()
    {
        return view('auth.register');
    }

    /**
     * Procesar registro.
     */
    public function register(Request $request)
    {
        $data = $request->validate([
            'name'      => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'phone'     => ['required', 'string', 'max:30', 'regex:/^(?=(?:\\D*\\d){8,15}\\D*$)[0-9+()\\s-]{8,30}$/'],
            'email'     => ['required', 'email', 'max:255', 'unique:users,email'],
            'password'  => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'name.required'       => 'Ingresá tu nombre.',
            'name.max'            => 'El nombre no puede superar :max caracteres.',
            'last_name.required'  => 'Ingresá tu apellido.',
            'last_name.max'       => 'El apellido no puede superar :max caracteres.',

            'phone.required'      => 'Ingresá tu teléfono/WhatsApp.',
            'phone.regex'         => 'Ingresá un teléfono válido (solo números, espacios, +, -, paréntesis).',
            'phone.max'           => 'El teléfono no puede superar :max caracteres.',

            'email.required'      => 'Ingresá tu email.',
            'email.email'         => 'Ingresá un email válido.',
            'email.unique'        => 'Este email ya está registrado. Probá ingresar.',
            'email.max'           => 'El email no puede superar :max caracteres.',

            'password.required'   => 'Ingresá una contraseña.',
            'password.min'        => 'La contraseña debe tener al menos :min caracteres.',
            'password.confirmed'  => 'Las contraseñas no coinciden.',
        ]);


        $user = User::create([
            'name'      => trim($data['name']),
            'last_name' => trim($data['last_name']),
            'phone'     => trim($data['phone']),
            'email'     => Str::lower(trim($data['email'])),
            'password'  => Hash::make($data['password']),
            'role'      => 'user',
        ]);

        Auth::login($user);
        $request->session()->regenerate();
        $request->session()->put('auth_time', time());
        $request->session()->forget('admin_2fa_passed_at');

        $user->sendEmailVerificationNotification();

        return redirect()
            ->route('verification.notice')
            ->with('success', 'Cuenta creada. Te enviamos un correo para verificar tu cuenta.');

    }

    public function showForgotPassword()
    {
        return view('auth.forgot-password');
    }

    public function sendResetLinkEmail(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ], [
            'email.required' => 'Ingresa tu email.',
            'email.email' => 'Ingresa un email valido.',
        ]);

        $status = Password::sendResetLink([
            'email' => Str::lower(trim($data['email'])),
        ]);

        if ($status === Password::RESET_LINK_SENT) {
            return back()->with('status', 'Te enviamos un enlace para restablecer tu contrasena.');
        }

        return back()
            ->withInput($request->only('email'))
            ->withErrors([
                'email' => $this->passwordBrokerStatusMessage($status),
            ]);
    }

    public function showResetPassword(Request $request, string $token)
    {
        return view('auth.reset-password', [
            'token' => $token,
            'email' => (string) $request->query('email', ''),
        ]);
    }

    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'email.required' => 'Ingresa tu email.',
            'email.email' => 'Ingresa un email valido.',
            'password.required' => 'Ingresa una contrasena.',
            'password.min' => 'La contrasena debe tener al menos :min caracteres.',
            'password.confirmed' => 'Las contrasenas no coinciden.',
        ]);

        $status = Password::reset(
            [
                'email' => Str::lower(trim($data['email'])),
                'password' => $data['password'],
                'password_confirmation' => (string) $request->input('password_confirmation', ''),
                'token' => $data['token'],
            ],
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return redirect()
                ->route('login')
                ->with('success', 'Contrasena restablecida correctamente. Ya puedes iniciar sesion.');
        }

        return back()
            ->withInput($request->only('email'))
            ->withErrors([
                'email' => $this->passwordBrokerStatusMessage($status),
            ]);
    }

    public function showEmailVerificationNotice(Request $request)
    {
        if ($request->user()?->hasVerifiedEmail()) {
            return redirect()->route('home');
        }

        return view('auth.verify-email');
    }

    public function verifyEmail(EmailVerificationRequest $request)
    {
        $request->fulfill();

        return redirect()
            ->route('home')
            ->with('success', 'Correo verificado correctamente.');
    }

    public function resendVerification(Request $request)
    {
        $user = $request->user();
        if ($user && $user->hasVerifiedEmail()) {
            return redirect()->route('home');
        }

        $user?->sendEmailVerificationNotification();

        return back()->with('status', 'verification-link-sent');
    }

    private function passwordBrokerStatusMessage(string $status): string
    {
        return match ($status) {
            Password::INVALID_USER => 'No encontramos una cuenta con ese email.',
            Password::INVALID_TOKEN => 'El enlace de recuperacion no es valido o ya expiro.',
            default => 'No se pudo completar la operacion. Intenta nuevamente.',
        };
    }

    /**
     * Cerrar sesión.
     */
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home')
            ->with('success', 'Sesión cerrada.');
    }

    public function googleRedirect()
    {
        if (!config('services.google.client_id') || !config('services.google.client_secret')) {
            return redirect()->route('login')->withErrors([
                'email' => 'Login con Google no está configurado.',
            ]);
        }

        return Socialite::driver('google')->redirect();
    }


    public function googleCallback(Request $request)
    {
        try {
            $g = Socialite::driver('google')->user();
        } catch (\Throwable $e) {
            return redirect()
                ->route('login')
                ->withErrors(['email' => 'No se pudo iniciar sesión con Google. Intentá de nuevo.']);
        }

        $googleId = $g->getId();
        $email    = Str::lower(trim((string) $g->getEmail()));
        $fullName = trim((string) ($g->getName() ?: $g->getNickname() ?: ''));

        $first = 'Usuario';
        $last  = null;

        if ($fullName !== '') {
            $parts = preg_split('/\s+/', $fullName);
            $first = $parts[0] ?? 'Usuario';
            $last  = isset($parts[1]) ? implode(' ', array_slice($parts, 1)) : null;
        }

        // 1) Buscar por google_id
        $user = User::where('google_id', $googleId)->first();

        // 2) Si no existe, buscar por email y linkear
        if (!$user && $email) {
            $user = User::where('email', $email)->first();
            if ($user && !$user->google_id) {
                $user->google_id = $googleId;
                $user->save();
            }
        }

        // 3) Si no existe, crear usuario
        if (!$user) {
            $user = User::create([
                'name'      => $first,
                'last_name' => $last,
                'phone'     => null,
                'email'     => $email ?: ("google_{$googleId}@example.local"),
                'google_id' => $googleId,
                'password'  => Hash::make(Str::random(40)),
                'role'      => 'user',
            ]);
        }

        if (method_exists($user, 'hasVerifiedEmail') && ! $user->hasVerifiedEmail()) {
            $user->forceFill([
                'email_verified_at' => now(),
            ])->save();
        }

                Auth::login($user, true);
                $request->session()->regenerate();
                $request->session()->put('auth_time', time());
                $request->session()->forget('admin_2fa_passed_at');

                $fallback = ($user->role ?? 'user') === 'admin'
                    ? route('admin.dashboard')
                    : route('home');

                $needsProfile =
                    empty(trim((string)($user->last_name ?? ''))) ||
                    empty(trim((string)($user->phone ?? '')));

                if ($needsProfile) {
                    // Guardamos a dónde quería ir (checkout u otra sección)
                    $returnTo = $request->session()->get('url.intended') ?: $fallback;

                    $request->session()->put('profile_return_to', $returnTo);
                    $request->session()->forget('url.intended');

                    return redirect()
                        ->route('account.edit')
                        ->withErrors(['profile' => 'Completá tu apellido y teléfono para poder comprar.']);
                }

                return redirect()->intended($fallback)
                    ->with('success', 'Sesión iniciada con Google.');

    }


}
