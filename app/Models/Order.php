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
}
