<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    public const STATUSES = [
        'pendiente'     => 'Pendiente',
        'confirmado'    => 'Confirmado',
        'preparando'    => 'Preparando',
        'listo_retirar' => 'Listo para retirar',
        'entregado'     => 'Entregado',
        'cancelado'     => 'Cancelado',
    ];

    public const PAYMENT_METHODS = [
        'local'         => 'Pago en el local',
        'mercado_pago'  => 'Mercado Pago',
        'transferencia' => 'Transferencia',
    ];

    public const TRANSITIONS = [
        'pendiente' => ['confirmado', 'preparando', 'listo_retirar', 'cancelado'],
        'confirmado' => ['preparando', 'listo_retirar', 'entregado', 'cancelado'],
        'preparando' => ['listo_retirar', 'entregado', 'cancelado'],
        'listo_retirar' => ['entregado', 'cancelado'],
        'entregado' => [],
        'cancelado' => [],
    ];

    protected $fillable = [
        'user_id',
        'status',
        'payment_method',
        'total',
        'pickup_name',
        'pickup_phone',
        'pickup_delegate_name',
        'pickup_delegate_phone',
        'notes',
        'is_quick_sale',
        'quick_sale_admin_id',

    ];

    protected $casts = [
        'is_quick_sale' => 'boolean',
    ];

    // Normaliza teléfono a "solo números" al guardar
    public function setPickupPhoneAttribute($value): void
    {
        $this->attributes['pickup_phone'] = preg_replace('/\D+/', '', (string) $value);
    }

    public function setPickupDelegatePhoneAttribute($value): void
    {
        $this->attributes['pickup_delegate_phone'] = preg_replace('/\D+/', '', (string) $value);
    }


    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function quickSaleAdmin()
    {
        return $this->belongsTo(User::class, 'quick_sale_admin_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class)->orderByDesc('changed_at');
    }

    public function whatsappLogs(): HasMany
    {
        return $this->hasMany(OrderWhatsappLog::class)->orderByDesc('sent_at');
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
            return "Un pedido en estado {$fromLabel} no puede cambiar de estado.";
        }

        $allowedLabels = array_map(function (string $status): string {
            return self::STATUSES[$status] ?? $status;
        }, $allowed);

        return "Cambio de estado inválido. Desde {$fromLabel} solo podés pasar a: " . implode(', ', $allowedLabels) . '.';
    }
}
