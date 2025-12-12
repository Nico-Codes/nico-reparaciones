<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RepairWhatsappLog extends Model
{
    protected $fillable = [
        'repair_id',
        'notified_status',
        'phone',
        'message',
        'sent_by',
        'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];

    public function repair()
    {
        return $this->belongsTo(Repair::class);
    }

    public function sentBy()
    {
        return $this->belongsTo(User::class, 'sent_by');
    }
}
