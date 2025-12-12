<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'price',
        'stock',
        'description',
        'image_path',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'stock' => 'integer',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * URL pública de la imagen (usa tu ruta storage.local).
     * En blades podés usar: $product->image_url
     */
    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image_path) return null;

        // Si existe la route storage.local en tu proyecto (ya aparece en tu route:list), esto funciona siempre.
        return route('storage.local', $this->image_path);
    }
}
