<?php

namespace App\Support;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogger
{
    public static function log(Request $request, string $event, array $context = []): AuditLog
    {
        $actor = $request->user();
        $subjectType = (string) ($context['subject_type'] ?? '');
        $subjectId = $context['subject_id'] ?? null;
        $metadata = $context['metadata'] ?? null;

        return AuditLog::create([
            'event' => $event,
            'actor_id' => $actor?->id,
            'actor_role' => $actor?->role,
            'subject_type' => $subjectType !== '' ? $subjectType : null,
            'subject_id' => is_numeric($subjectId) ? (int) $subjectId : null,
            'ip_address' => (string) ($request->ip() ?? ''),
            'user_agent' => substr((string) ($request->userAgent() ?? ''), 0, 255),
            'route_name' => optional($request->route())->getName(),
            'http_method' => strtoupper((string) $request->method()),
            'metadata' => is_array($metadata) ? $metadata : null,
            'created_at' => now(),
        ]);
    }
}
