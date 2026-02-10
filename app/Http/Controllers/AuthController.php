<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
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

            $fallback = (Auth::user()->role ?? 'user') === 'admin'
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

        return redirect()->intended(route('home'))
            ->with('success', 'Cuenta creada correctamente.');

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
