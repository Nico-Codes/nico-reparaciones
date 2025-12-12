<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'status',
        'payment_method',
        'total',
        'pickup_name',
        'pickup_phone',
        'notes',
    ];

    /**
     * Pedido pertenece a un usuario (cliente).
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Items del pedido.
     */
    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}
