<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Repair extends Model
{
    protected $fillable = [
        'code',
        'user_id',
        'customer_name',
        'customer_phone',
        'device_brand',
        'device_model',
        'issue_reported',
        'diagnosis',
        'parts_cost',
        'labor_cost',
        'final_price',
        'status',
        'warranty_days',
        'received_at',
        'delivered_at',
        'notes',
    ];

    protected $casts = [
        'parts_cost'   => 'decimal:2',
        'labor_cost'   => 'decimal:2',
        'final_price'  => 'decimal:2',
        'received_at'  => 'datetime',
        'delivered_at' => 'datetime',
    ];

    public const STATUSES = [
        'received'         => 'Recibido',
        'diagnosing'       => 'Diagnosticando',
        'waiting_approval' => 'Esperando aprobación',
        'repairing'        => 'En reparación',
        'ready_pickup'     => 'Listo para retirar',
        'delivered'        => 'Entregado',
        'cancelled'        => 'Cancelado',
    ];

    // Normaliza teléfono a "solo números" al guardar
    public function setCustomerPhoneAttribute($value): void
    {
        $this->attributes['customer_phone'] = preg_replace('/\D+/', '', (string) $value);
    }

    public function statusHistory()
    {
        return $this->hasMany(RepairStatusHistory::class)->orderByDesc('changed_at');
    }

    public function whatsappLogs()
    {
        return $this->hasMany(RepairWhatsappLog::class)->orderByDesc('sent_at');
    }

    public function getProfitAttribute(): float
    {
        $final = (float) ($this->final_price ?? 0);
        $parts = (float) ($this->parts_cost ?? 0);
        $labor = (float) ($this->labor_cost ?? 0);

        return $final - ($parts + $labor);
    }
}
