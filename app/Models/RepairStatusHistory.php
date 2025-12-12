<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RepairStatusHistory extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'repair_id',
        'from_status',
        'to_status',
        'changed_by',
        'changed_at',
        'comment',
    ];

    protected $casts = [
        'changed_at' => 'datetime',
    ];

    public function repair()
    {
        return $this->belongsTo(Repair::class);
    }
}
