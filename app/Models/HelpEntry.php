<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HelpEntry extends Model
{
    public const AUDIENCE_PUBLIC = 'public';
    public const AUDIENCE_ADMIN = 'admin';
    public const AUDIENCE_BOTH = 'both';

    public const AUDIENCES = [
        self::AUDIENCE_PUBLIC,
        self::AUDIENCE_ADMIN,
        self::AUDIENCE_BOTH,
    ];

    protected $fillable = [
        'question',
        'answer',
        'audience',
        'sort_order',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
        'sort_order' => 'integer',
    ];
}

