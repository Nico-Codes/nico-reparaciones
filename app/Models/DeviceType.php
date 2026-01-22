<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeviceType extends Model
{
    protected $fillable = ['name', 'slug', 'active'];

    protected $casts = [
        'active' => 'boolean',
    ];


    public function brands()
    {
        return $this->hasMany(DeviceBrand::class);
    }

    public function issueTypes()
    {
        return $this->hasMany(DeviceIssueType::class);
    }

}
