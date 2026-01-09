<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PricingRule extends Model
{
    protected $fillable = [
        'device_type_id',
        'repair_type_id',
        'device_brand_id',
        'device_model_group_id',
        'device_model_id',
        'mode',
        'multiplier',
        'min_profit',
        'fixed_total',
        'shipping_default',
        'priority',
        'active',
    ];

    protected $casts = [
        'active' => 'bool',
        'multiplier' => 'decimal:2',
    ];

    public function deviceType(): BelongsTo { return $this->belongsTo(DeviceType::class); }
    public function repairType(): BelongsTo { return $this->belongsTo(RepairType::class); }
    public function brand(): BelongsTo { return $this->belongsTo(DeviceBrand::class, 'device_brand_id'); }
    public function modelGroup(): BelongsTo { return $this->belongsTo(DeviceModelGroup::class, 'device_model_group_id'); }
    public function model(): BelongsTo { return $this->belongsTo(DeviceModel::class, 'device_model_id'); }
}
