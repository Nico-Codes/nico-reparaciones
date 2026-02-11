<?php

return [
    'enabled' => (bool) env('MONITORING_ENABLED', true),

    'sentry' => [
        'dsn' => (string) env('SENTRY_DSN', env('SENTRY_LARAVEL_DSN', '')),
    ],

    'alerts' => [
        'enabled' => (bool) env('OPS_ALERTS_ENABLED', true),
        'channel' => (string) env('OPS_ALERTS_CHANNEL', 'ops_alerts'),
        'dedupe_minutes' => (int) env('OPS_ALERTS_DEDUPE_MINUTES', 10),
    ],

    'ignore_exceptions' => [
        \Illuminate\Validation\ValidationException::class,
        \Illuminate\Auth\AuthenticationException::class,
        \Illuminate\Auth\Access\AuthorizationException::class,
        \Symfony\Component\HttpKernel\Exception\NotFoundHttpException::class,
        \Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException::class,
        \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException::class,
        \Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException::class,
    ],

    'ignore_http_statuses' => [401, 403, 404, 405, 419, 422, 429],
];
