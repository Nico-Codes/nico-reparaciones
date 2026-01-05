<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

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
            'phone'     => ['required', 'string', 'max:30', 'regex:/^[0-9+()\s-]{8,30}$/'],
            'email'     => ['required', 'email', 'max:255', 'unique:users,email'],
            'password'  => ['required', 'string', 'min:8', 'confirmed'],
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
}
