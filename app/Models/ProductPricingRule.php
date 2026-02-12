<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductPricingRule extends Model
{
    protected $fillable = [
        'name',
        'category_id',
        'product_id',
        'cost_min',
        'cost_max',
        'margin_percent',
        'priority',
        'active',
    ];

    protected $casts = [
        'cost_min' => 'integer',
        'cost_max' => 'integer',
        'margin_percent' => 'decimal:2',
        'priority' => 'integer',
        'active' => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
