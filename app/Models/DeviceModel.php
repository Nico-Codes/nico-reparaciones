<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeviceModel extends Model
{
    protected $fillable = ['device_brand_id', 'name', 'slug'];

    public function brand(): BelongsTo
    {
        return $this->belongsTo(DeviceBrand::class, 'device_brand_id');
    }
}
