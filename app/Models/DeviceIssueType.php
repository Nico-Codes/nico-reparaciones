<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeviceIssueType extends Model
{
    protected $fillable = ['device_type_id', 'name', 'slug'];

    public function deviceType()
    {
        return $this->belongsTo(DeviceType::class);
    }
}
