<?php

namespace App\Providers;

use App\Models\Order;
use App\Models\OrderWhatsappLog;
use App\Models\Repair;
use App\Models\RepairWhatsappLog;
use App\Models\User;
use App\Observers\OrderObserver;
use App\Observers\OrderWhatsappLogObserver;
use App\Observers\RepairObserver;
use App\Observers\RepairWhatsappLogObserver;
use App\Policies\OrderPolicy;
use App\Policies\RepairPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Order::class, OrderPolicy::class);
        Gate::policy(Repair::class, RepairPolicy::class);
        Order::observe(OrderObserver::class);
        OrderWhatsappLog::observe(OrderWhatsappLogObserver::class);
        Repair::observe(RepairObserver::class);
        RepairWhatsappLog::observe(RepairWhatsappLogObserver::class);
        Gate::define('access-admin', fn (User $user): bool => $user->isAdmin());

        RateLimiter::for('repair-lookup', function (Request $request) {
            return Limit::perMinute(8)->by($request->ip());
        });

        RateLimiter::for('auth-register', function (Request $request) {
            return Limit::perMinute(6)
                ->by($request->ip())
                ->response(function (Request $request, array $headers) {
                    $retryAfter = (int) ($headers['Retry-After'] ?? 60);

                    return back()
                        ->withErrors([
                            'email' => "Demasiados intentos de registro. Proba de nuevo en {$retryAfter} segundos.",
                        ])
                        ->withInput($request->except(['password', 'password_confirmation']));
                });
        });

        RateLimiter::for('auth-login', function (Request $request) {
            $email = Str::lower(trim((string) $request->input('email', 'guest')));
            $key = Str::transliterate($email).'|'.$request->ip();

            return Limit::perMinute((int) config('security.rate_limits.auth_login_per_minute', 12))
                ->by($key)
                ->response(function (Request $request, array $headers) {
                    $retryAfter = (int) ($headers['Retry-After'] ?? 60);

                    return back()
                        ->withErrors([
                            'email' => "Demasiados intentos de inicio de sesion. Proba de nuevo en {$retryAfter} segundos.",
                        ])
                        ->withInput($request->only('email'));
                });
        });

        RateLimiter::for('cart-write', function (Request $request) {
            $sessionId = (string) ($request->session()->getId() ?: 'session-missing');
            $key = $request->ip().'|'.$sessionId;

            return Limit::perMinute((int) config('security.rate_limits.cart_write_per_minute', 80))
                ->by($key)
                ->response(function (Request $request, array $headers) {
                    $retryAfter = (int) ($headers['Retry-After'] ?? 30);

                    return back()
                        ->withErrors([
                            'cart' => "Demasiadas acciones en carrito. Espera {$retryAfter} segundos.",
                        ]);
                });
        });

        RateLimiter::for('checkout-confirm', function (Request $request) {
            $userPart = (string) ($request->user()?->id ?? 'guest');
            $key = $userPart.'|'.$request->ip();

            return Limit::perMinute((int) config('security.rate_limits.checkout_confirm_per_minute', 10))
                ->by($key)
                ->response(function (Request $request, array $headers) {
                    $retryAfter = (int) ($headers['Retry-After'] ?? 60);

                    return back()
                        ->withErrors([
                            'checkout' => "Demasiados intentos de confirmacion. Proba de nuevo en {$retryAfter} segundos.",
                        ]);
                });
        });

        RateLimiter::for('admin-requests', function (Request $request) {
            $userPart = (string) ($request->user()?->id ?? 'guest');
            $key = $userPart.'|'.$request->ip();

            return Limit::perMinute((int) config('security.rate_limits.admin_requests_per_minute', 240))
                ->by($key)
                ->response(function (Request $request, array $headers) {
                    $retryAfter = (int) ($headers['Retry-After'] ?? 60);

                    return response(
                        "Demasiadas solicitudes al panel admin. Intenta nuevamente en {$retryAfter} segundos.",
                        429
                    );
                });
        });

        RateLimiter::for('admin-2fa', function (Request $request) {
            $userPart = (string) ($request->user()?->id ?? 'guest');
            $key = '2fa|'.$userPart.'|'.$request->ip();

            return Limit::perMinute((int) config('security.rate_limits.admin_2fa_per_minute', 12))
                ->by($key)
                ->response(function (Request $request, array $headers) {
                    $retryAfter = (int) ($headers['Retry-After'] ?? 60);

                    return back()->withErrors([
                        'code' => "Demasiados intentos de codigo 2FA. Reintenta en {$retryAfter} segundos.",
                    ]);
                });
        });
    }
}
