<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeviceModel extends Model
{
    protected $fillable = [
        'device_brand_id',
        'device_model_group_id',
        'name',
        'slug',
        'active',
    ];

    public function brand()
    {
        return $this->belongsTo(DeviceBrand::class, 'device_brand_id');
    }

    public function group()
    {
        return $this->belongsTo(DeviceModelGroup::class, 'device_model_group_id');
    }
}
