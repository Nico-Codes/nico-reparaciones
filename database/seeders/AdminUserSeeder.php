<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        // ⚠️ Cambiá estas credenciales al usar en producción
        $email = env('ADMIN_EMAIL', 'admin@nico.local');
        $pass  = env('ADMIN_PASSWORD', 'admin1234');

        User::firstOrCreate(
            ['email' => $email],
            [
                'name' => 'Admin',
                'last_name' => 'NicoReparaciones',
                'phone' => '0000000000',
                'password' => Hash::make($pass),
                'role' => 'admin',
            ]
        );
    }
}
