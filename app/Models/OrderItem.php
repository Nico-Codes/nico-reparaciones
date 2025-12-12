<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'product_id',
        'product_name',
        'price',
        'quantity',
        'subtotal',
    ];

    /**
     * Item pertenece a un pedido.
     */
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Item está asociado a un producto (por si querés ver stock, etc.).
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
