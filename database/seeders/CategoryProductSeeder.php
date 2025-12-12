<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class CategoryProductSeeder extends Seeder
{
    /**
     * Carga categorías y productos de ejemplo para NicoReparaciones.
     */
    public function run(): void
    {
        // 1) Crear categorías base
        $categorias = [
            [
                'name'        => 'Fundas y vidrios',
                'slug'        => 'fundas-vidrios',
                'description' => 'Fundas de silicona, rígidas y vidrios templados.',
                'icon'        => '📱',
            ],
            [
                'name'        => 'Cables y cargadores',
                'slug'        => 'cables-cargadores',
                'description' => 'Cables USB, cargadores originales y genéricos.',
                'icon'        => '🔌',
            ],
            [
                'name'        => 'Auriculares y audio',
                'slug'        => 'auriculares-audio',
                'description' => 'Auriculares con cable, Bluetooth y parlantes.',
                'icon'        => '🎧',
            ],
        ];

        foreach ($categorias as $data) {
            Category::firstOrCreate(
                ['slug' => $data['slug']], // criterio único
                $data
            );
        }

        // 2) Buscar las categorías recién creadas
        $fundas = Category::where('slug', 'fundas-vidrios')->first();
        $cables = Category::where('slug', 'cables-cargadores')->first();
        $auris  = Category::where('slug', 'auriculares-audio')->first();

        // 3) Crear productos de ejemplo por categoría

        // FUNDAS Y VIDRIOS
        if ($fundas) {
            Product::firstOrCreate(
                ['slug' => 'funda-silicona-transparente-a52'],
                [
                    'category_id'       => $fundas->id,
                    'name'              => 'Funda silicona transparente Samsung A52',
                    'brand'             => 'Genérica',
                    'quality'           => 'premium',
                    'price'             => 4500,
                    'stock'             => 5,
                    'short_description' => 'Funda flexible con protección extra en esquinas.',
                    'description'       => 'Funda de silicona transparente, anti shock, con recortes precisos para cámaras, puertos y botones. Ideal para uso diario.',
                    'image'             => 'funda-a52-transparente.jpg',
                    'featured'          => true,
                ]
            );

            Product::firstOrCreate(
                ['slug' => 'vidrio-templado-a52'],
                [
                    'category_id'       => $fundas->id,
                    'name'              => 'Vidrio templado Samsung A52',
                    'brand'             => 'Genérica',
                    'quality'           => 'generico',
                    'price'             => 2500,
                    'stock'             => 10,
                    'short_description' => 'Vidrio templado 9H con bordes 2.5D.',
                    'description'       => 'Protector de pantalla de vidrio templado, dureza 9H, alta transparencia, bordes 2.5D y recubrimiento oleofóbico.',
                    'image'             => 'vidrio-a52.jpg',
                    'featured'          => true,
                ]
            );
        }

        // CABLES Y CARGADORES
        if ($cables) {
            Product::firstOrCreate(
                ['slug' => 'cable-usb-c-reforzado-1m'],
                [
                    'category_id'       => $cables->id,
                    'name'              => 'Cable USB-C reforzado 1m',
                    'brand'             => 'Genérica',
                    'quality'           => 'premium',
                    'price'             => 3000,
                    'stock'             => 15,
                    'short_description' => 'Cable mallado reforzado 1m, 2.4A.',
                    'description'       => 'Cable USB-C mallado reforzado, 1 metro de largo, ideal para carga rápida hasta 2.4A y transferencia de datos estable.',
                    'image'             => 'cable-usbc-reforzado.jpg',
                    'featured'          => false,
                ]
            );

            Product::firstOrCreate(
                ['slug' => 'cargador-usb-c-20w'],
                [
                    'category_id'       => $cables->id,
                    'name'              => 'Cargador USB-C 20W',
                    'brand'             => 'Genérica',
                    'quality'           => 'premium',
                    'price'             => 6500,
                    'stock'             => 8,
                    'short_description' => 'Cargador rápido 20W compatible con la mayoría de celulares.',
                    'description'       => 'Cargador rápido USB-C 20W, ideal para equipos Android y iPhone compatibles con carga rápida.',
                    'image'             => 'cargador-20w.jpg',
                    'featured'          => true,
                ]
            );
        }

        // AURICULARES Y AUDIO
        if ($auris) {
            Product::firstOrCreate(
                ['slug' => 'auriculares-bluetooth-basic'],
                [
                    'category_id'       => $auris->id,
                    'name'              => 'Auriculares Bluetooth básicos',
                    'brand'             => 'Genérica',
                    'quality'           => 'generico',
                    'price'             => 9000,
                    'stock'             => 8,
                    'short_description' => 'Auriculares inalámbricos con estuche de carga.',
                    'description'       => 'Auriculares Bluetooth con estuche cargador, buena autonomía, micrófono integrado y controles táctiles.',
                    'image'             => 'auris-bluetooth-basic.jpg',
                    'featured'          => true,
                ]
            );

            Product::firstOrCreate(
                ['slug' => 'parlante-bluetooth-portatil'],
                [
                    'category_id'       => $auris->id,
                    'name'              => 'Parlante Bluetooth portátil',
                    'brand'             => 'Genérica',
                    'quality'           => 'generico',
                    'price'             => 12000,
                    'stock'             => 4,
                    'short_description' => 'Parlante portátil con Bluetooth y batería recargable.',
                    'description'       => 'Parlante Bluetooth portátil, ideal para uso en casa, taller o reuniones. Batería recargable y buen nivel de volumen.',
                    'image'             => 'parlante-portatil.jpg',
                    'featured'          => false,
                ]
            );
        }
    }
}
