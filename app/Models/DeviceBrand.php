<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeviceBrand extends Model
{
    protected $fillable = ['device_type_id', 'name', 'slug'];

    public function type(): BelongsTo
    {
        return $this->belongsTo(DeviceType::class, 'device_type_id');
    }

    public function models(): HasMany
    {
        return $this->hasMany(DeviceModel::class, 'device_brand_id');
    }
}
