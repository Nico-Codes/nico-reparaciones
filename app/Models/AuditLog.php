<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'event',
        'actor_id',
        'actor_role',
        'subject_type',
        'subject_id',
        'ip_address',
        'user_agent',
        'route_name',
        'http_method',
        'metadata',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'created_at' => 'datetime',
        ];
    }
}
