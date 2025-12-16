<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderWhatsappTemplate extends Model
{
    protected $fillable = [
        'status',
        'template',
        'updated_by',
    ];

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
