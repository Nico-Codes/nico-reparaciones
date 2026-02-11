<?php

return [
    'headers' => [
        'enabled' => (bool) env('SECURITY_HEADERS_ENABLED', true),
        'csp_enabled' => (bool) env('SECURITY_CSP_ENABLED', true),
        'csp' => (string) env(
            'SECURITY_CSP',
            "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; object-src 'none'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; font-src 'self' data: https:; connect-src 'self' https: ws: wss:;"
        ),
    ],

    'admin' => [
        'allowed_emails' => (string) env('ADMIN_ALLOWED_EMAILS', ''),
        'allowed_ips' => (string) env('ADMIN_ALLOWED_IPS', ''),
        'enforce_allowlist_in_production' => (bool) env('ADMIN_ENFORCE_ALLOWLIST_IN_PRODUCTION', true),
        'require_reauth_minutes' => (int) env('ADMIN_REQUIRE_REAUTH_MINUTES', 0),
        'two_factor_session_minutes' => (int) env('ADMIN_2FA_SESSION_MINUTES', 0),
        'two_factor_recovery_codes_count' => (int) env('ADMIN_2FA_RECOVERY_CODES_COUNT', 8),
        'two_factor_recovery_export_ttl_minutes' => (int) env('ADMIN_2FA_RECOVERY_EXPORT_TTL_MINUTES', 30),
    ],

    'rate_limits' => [
        'auth_login_per_minute' => (int) env('RATE_LIMIT_AUTH_LOGIN_PER_MINUTE', 12),
        'cart_write_per_minute' => (int) env('RATE_LIMIT_CART_WRITE_PER_MINUTE', 80),
        'checkout_confirm_per_minute' => (int) env('RATE_LIMIT_CHECKOUT_CONFIRM_PER_MINUTE', 10),
        'admin_requests_per_minute' => (int) env('RATE_LIMIT_ADMIN_REQUESTS_PER_MINUTE', 240),
        'admin_2fa_per_minute' => (int) env('RATE_LIMIT_ADMIN_2FA_PER_MINUTE', 12),
    ],
];
