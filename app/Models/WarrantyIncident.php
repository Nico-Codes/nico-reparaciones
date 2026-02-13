<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WarrantyIncident extends Model
{
    public const SOURCE_TYPES = [
        'repair' => 'Reparacion',
        'product' => 'Producto',
    ];

    public const STATUSES = [
        'open' => 'Abierto',
        'closed' => 'Cerrado',
    ];

    public const COST_ORIGINS = [
        'manual' => 'Manual',
        'repair' => 'Reparación',
        'product' => 'Producto',
    ];

    protected $fillable = [
        'source_type',
        'status',
        'title',
        'reason',
        'repair_id',
        'product_id',
        'order_id',
        'supplier_id',
        'quantity',
        'unit_cost',
        'cost_origin',
        'extra_cost',
        'recovered_amount',
        'loss_amount',
        'happened_at',
        'resolved_at',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_cost' => 'integer',
        'cost_origin' => 'string',
        'extra_cost' => 'integer',
        'recovered_amount' => 'integer',
        'loss_amount' => 'integer',
        'happened_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    public function repair()
    {
        return $this->belongsTo(Repair::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
