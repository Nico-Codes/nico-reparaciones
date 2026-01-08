<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed de la base de datos de la aplicación.
     */
    public function run(): void
    {
        // Acá llamamos a todos los seeders que queremos ejecutar
        $this->call([
            AdminUserSeeder::class,
            BusinessSettingsSeeder::class,
            CategoryProductSeeder::class,
            DeviceCatalogSeeder::class,
        ]);


    }
}
