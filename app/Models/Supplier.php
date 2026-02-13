<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $fillable = [
        'name',
        'phone',
        'notes',
        'active',
        'search_enabled',
        'search_priority',
        'search_mode',
        'search_endpoint',
        'search_config',
        'last_probe_status',
        'last_probe_query',
        'last_probe_count',
        'last_probe_error',
        'last_probe_at',
    ];

    protected $casts = [
        'active' => 'boolean',
        'search_enabled' => 'boolean',
        'search_priority' => 'integer',
        'search_config' => 'array',
        'last_probe_at' => 'datetime',
    ];

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function warrantyIncidents()
    {
        return $this->hasMany(WarrantyIncident::class);
    }

    public function repairs()
    {
        return $this->hasMany(Repair::class);
    }
}
