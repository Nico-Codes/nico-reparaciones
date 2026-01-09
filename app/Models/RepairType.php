<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RepairType extends Model
{
    protected $fillable = ['name', 'slug', 'active'];

    protected $casts = [
        'active' => 'bool',
    ];

    public function pricingRules(): HasMany
    {
        return $this->hasMany(PricingRule::class);
    }
}
