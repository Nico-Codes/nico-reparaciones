<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

class Repair extends Model
{
    protected $fillable = [
        'code',
        'user_id',
        'supplier_id',
        'customer_name',
        'customer_phone',

        'device_type_id',
        'device_brand_id',
        'device_model_id',

        'device_issue_type_id',
        'repair_type_id',
        'issue_detail',



        'device_brand',
        'device_model',

        'issue_reported',
        'diagnosis',

        'parts_cost',
        'labor_cost',
        'final_price',

        'paid_amount',
        'payment_method',
        'payment_notes',

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

        'paid_amount'  => 'decimal:2',
        'warranty_days'=> 'integer',

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

    public const PAYMENT_METHODS = [
        'cash'        => 'Efectivo',
        'transfer'    => 'Transferencia',
        'debit'       => 'Débito',
        'credit'      => 'Crédito',
        'mp'          => 'Mercado Pago',
        'other'       => 'Otro',
    ];

    public const TRANSITIONS = [
        'received' => ['diagnosing', 'waiting_approval', 'repairing', 'ready_pickup', 'cancelled'],
        'diagnosing' => ['waiting_approval', 'repairing', 'ready_pickup', 'cancelled'],
        'waiting_approval' => ['repairing', 'ready_pickup', 'cancelled'],
        'repairing' => ['ready_pickup', 'cancelled'],
        'ready_pickup' => ['delivered', 'cancelled'],
        'delivered' => [],
        'cancelled' => [],
    ];

    // Normaliza teléfono a "solo números" al guardar
    public function setCustomerPhoneAttribute($value): void
    {
        $this->attributes['customer_phone'] = preg_replace('/\D+/', '', (string) $value);
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(RepairStatusHistory::class)->orderByDesc('changed_at');
    }

    public function whatsappLogs(): HasMany
    {
        return $this->hasMany(RepairWhatsappLog::class)->orderByDesc('sent_at');
    }

    public function getTotalCostAttribute(): float
    {
        $parts = (float) ($this->parts_cost ?? 0);
        $labor = (float) ($this->labor_cost ?? 0);
        return $parts + $labor;
    }

    public function getProfitAttribute(): float
    {
        $final = (float) ($this->final_price ?? 0);
        return $final - $this->total_cost;
    }

    public function getBalanceDueAttribute(): float
    {
        $final = (float) ($this->final_price ?? 0);
        $paid  = (float) ($this->paid_amount ?? 0);
        $balance = $final - $paid;
        return $balance > 0 ? $balance : 0.0;
    }

    public function getWarrantyExpiresAtAttribute(): ?Carbon
    {
        $days = (int) ($this->warranty_days ?? 0);
        if ($days <= 0) return null;

        // Garantía empieza cuando se entrega
        if (!$this->delivered_at) return null;

        return $this->delivered_at->copy()->addDays($days)->endOfDay();
    }

    public function getInWarrantyAttribute(): bool
    {
        $exp = $this->warranty_expires_at;
        if (!$exp) return false;
        return now()->lte($exp);
    }

    public function deviceIssueType()
    {
        return $this->belongsTo(DeviceIssueType::class, 'device_issue_type_id');
    }

    public function repairType()
    {
        return $this->belongsTo(\App\Models\RepairType::class, 'repair_type_id');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public static function allowedNextStatuses(string $from): array
    {
        return self::TRANSITIONS[$from] ?? [];
    }

    public static function canTransition(string $from, string $to): bool
    {
        if ($from === $to) {
            return true;
        }

        return in_array($to, self::allowedNextStatuses($from), true);
    }

    public static function transitionErrorMessage(string $from): string
    {
        $fromLabel = self::STATUSES[$from] ?? $from;
        $allowed = self::allowedNextStatuses($from);

        if (empty($allowed)) {
            return "Una reparación en estado {$fromLabel} no puede cambiar de estado.";
        }

        $allowedLabels = array_map(function (string $status): string {
            return self::STATUSES[$status] ?? $status;
        }, $allowed);

        return "Cambio de estado inválido. Desde {$fromLabel} solo podés pasar a: " . implode(', ', $allowedLabels) . '.';
    }

}
