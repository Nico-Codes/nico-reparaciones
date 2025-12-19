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
        'brand',
        'quality',
        'price',
        'stock',
        'short_description',
        'description',
        'image',       // legado
        'image_path',  // actual (public disk)
        'featured',
    ];

    protected $casts = [
        'price' => 'integer',
        'stock' => 'integer',
        'featured' => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * URL lista para usar en <img>.
     * Prioriza `image_path` (nuevo) y cae a `image` (legacy).
     */
    public function getImageUrlAttribute(): ?string
    {
        if (!empty($this->image_path)) {
            return route('storage.local', $this->image_path);
        }

        if (!empty($this->image)) {
            // legacy: si viene solo el filename, asumimos carpeta products/
            $path = str_contains($this->image, '/')
                ? $this->image
                : ('products/' . ltrim($this->image, '/'));

            return route('storage.local', $path);
        }

        return null;
    }
}
