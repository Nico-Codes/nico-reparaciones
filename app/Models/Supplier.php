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
    ];

    protected $casts = [
        'active' => 'boolean',
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
