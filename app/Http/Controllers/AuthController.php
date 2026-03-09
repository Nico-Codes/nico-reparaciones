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
            'email' => ['required', 'email'],
            'password' => ['required'],
        ], [
            'email.required' => 'Ingresa tu email.',
            'email.email' => 'Ingresa un email valido.',
            'password.required' => 'Ingresa tu contrasena.',
        ]);

        $credentials['email'] = Str::lower(trim($credentials['email']));

        $throttleKey = 'login:' . Str::transliterate($credentials['email']) . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return back()->withErrors([
                'email' => "Demasiados intentos. Proba de nuevo en {$seconds} segundos.",
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
                ->with('success', 'Sesion iniciada correctamente.');
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
            'name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30', 'regex:/^(?=(?:\\D*\\d){8,15}\\D*$)[0-9+()\\s-]{8,30}$/'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'name.required' => 'Ingresa tu nombre.',
            'name.max' => 'El nombre no puede superar :max caracteres.',
            'last_name.required' => 'Ingresa tu apellido.',
            'last_name.max' => 'El apellido no puede superar :max caracteres.',
            'phone.required' => 'Ingresa tu telefono/WhatsApp.',
            'phone.regex' => 'Ingresa un telefono valido (solo numeros, espacios, +, -, parentesis).',
            'phone.max' => 'El telefono no puede superar :max caracteres.',
            'email.required' => 'Ingresa tu email.',
            'email.email' => 'Ingresa un email valido.',
            'email.unique' => 'Este email ya esta registrado. Proba ingresar.',
            'email.max' => 'El email no puede superar :max caracteres.',
            'password.required' => 'Ingresa una contrasena.',
            'password.min' => 'La contrasena debe tener al menos :min caracteres.',
            'password.confirmed' => 'Las contrasenas no coinciden.',
        ]);

        $user = User::create([
            'name' => trim($data['name']),
            'last_name' => trim($data['last_name']),
            'phone' => trim($data['phone']),
            'email' => Str::lower(trim($data['email'])),
            'password' => Hash::make($data['password']),
            'role' => 'user',
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
            $redirectTo = (string) $request->session()->pull('post_verification_redirect', route('home'));

            return redirect()->to($redirectTo);
        }

        return view('auth.verify-email', [
            'verificationRequiredFor' => (string) $request->session()->get('verification_required_for', ''),
            'postVerificationRedirect' => (string) $request->session()->get('post_verification_redirect', ''),
        ]);
    }

    public function verifyEmail(EmailVerificationRequest $request)
    {
        $request->fulfill();

        $request->session()->forget('verification_required_for');
        $redirectTo = (string) $request->session()->pull('post_verification_redirect', route('home'));

        return redirect()
            ->to($redirectTo)
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
     * Cerrar sesion.
     */
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home')
            ->with('success', 'Sesion cerrada.');
    }
}