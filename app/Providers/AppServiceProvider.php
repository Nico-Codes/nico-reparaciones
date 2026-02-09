<?php

namespace App\Providers;

use App\Models\Order;
use App\Models\Repair;
use App\Policies\OrderPolicy;
use App\Policies\RepairPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

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
    }
}
