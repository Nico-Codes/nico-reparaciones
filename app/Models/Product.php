<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'brand',
        'quality',
        'price',
        'stock',
        'short_description',
        'description',
        'image',
        'featured',
    ];

    protected $casts = [
        'price' => 'integer',
        'stock' => 'integer',
        'featured' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
