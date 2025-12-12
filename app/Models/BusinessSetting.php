<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BusinessSetting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'updated_by',
    ];

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public static function getValue(string $key, string $default = ''): string
    {
        $val = static::where('key', $key)->value('value');
        return $val !== null ? (string)$val : $default;
    }
}
