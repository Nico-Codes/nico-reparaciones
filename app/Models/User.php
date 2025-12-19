<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * Nota: este proyecto usa registro custom y además un campo `role` (user/admin).
     */
    protected $fillable = [
        'name',
        'last_name',
        'phone',
        'email',
        'password',
        'role',

        // legado (por compatibilidad si quedó en alguna DB vieja)
        'is_admin',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
        ];
    }

    /**
     * Pedidos realizados por el usuario.
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Reparaciones asociadas al usuario.
     */
    public function repairs(): HasMany
    {
        return $this->hasMany(Repair::class);
    }

    /**
     * Helper para chequear admin (soporta `role` y `is_admin` legado).
     */
    public function isAdmin(): bool
    {
        return ($this->role ?? null) === 'admin' || (bool) ($this->is_admin ?? false);
    }
}
