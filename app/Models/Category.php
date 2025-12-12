<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    // Campos que se pueden cargar masivamente
    protected $fillable = [
        'name',
        'slug',
        'description',
        'icon',
    ];

    /**
     * Una categoría tiene muchos productos.
     */
    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
