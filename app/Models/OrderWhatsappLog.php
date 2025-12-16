<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderWhatsappLog extends Model
{
    protected $fillable = [
        'order_id',
        'notified_status',
        'phone',
        'message',
        'sent_by',
        'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function sentBy()
    {
        return $this->belongsTo(User::class, 'sent_by');
    }
}
