<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeviceModelGroup extends Model
{
    protected $fillable = ['device_brand_id', 'name', 'slug', 'active'];

    protected $casts = [
        'active' => 'bool',
    ];

    public function brand(): BelongsTo
    {
        return $this->belongsTo(DeviceBrand::class, 'device_brand_id');
    }

    public function models(): HasMany
    {
        return $this->hasMany(DeviceModel::class);
    }
}
