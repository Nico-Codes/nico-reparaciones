<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LedgerEntry extends Model
{
    public const DIRECTIONS = [
        'inflow' => 'Ingreso',
        'outflow' => 'Egreso',
    ];

    protected $fillable = [
        'happened_at',
        'direction',
        'amount',
        'category',
        'description',
        'source_type',
        'source_id',
        'event_key',
        'created_by',
        'meta',
    ];

    protected $casts = [
        'happened_at' => 'datetime',
        'amount' => 'integer',
        'meta' => 'array',
    ];
}

