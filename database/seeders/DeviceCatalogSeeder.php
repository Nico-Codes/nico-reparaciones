<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\DeviceType;
use App\Models\DeviceBrand;
use App\Models\DeviceModel;
use App\Models\DeviceIssueType;



class DeviceCatalogSeeder extends Seeder
{
    public function run(): void
    {
        // Tipos (en el orden que querés)
        $cel = $this->type('Celular', 'celular');
        $tab = $this->type('Tablet', 'tablet');
        $con = $this->type('Consola', 'consola');
        $joy = $this->type('Joystick', 'joystick');
        $otr = $this->type('Otro', 'otro');

        // Marcas base (minimalista + útil)
        $samsung  = $this->brand($cel, 'Samsung');
        $apple    = $this->brand($cel, 'Apple');
        $xiaomi   = $this->brand($cel, 'Xiaomi');
        $moto     = $this->brand($cel, 'Motorola');

        $tabSam   = $this->brand($tab, 'Samsung');
        $tabApp   = $this->brand($tab, 'Apple');

        $ps       = $this->brand($con, 'PlayStation');
        $xbox     = $this->brand($con, 'Xbox');
        $nintendo = $this->brand($con, 'Nintendo');

        $joyPs    = $this->brand($joy, 'PlayStation');
        $joyXbox  = $this->brand($joy, 'Xbox');
        $joyNin   = $this->brand($joy, 'Nintendo');
        $generico = $this->brand($otr, 'Genérico');

        // Modelos base (pocos, y después sumás desde el selector)
        foreach (['A10','A20','A30','A50','A51','A52','S20 FE','S21','S22','S23'] as $m) $this->model($samsung, $m);
        foreach (['iPhone 11','iPhone 12','iPhone 13','iPhone 14','iPhone 15'] as $m) $this->model($apple, $m);
        foreach (['Redmi Note 10','Redmi Note 11','Redmi Note 12'] as $m) $this->model($xiaomi, $m);
        foreach (['G20','G30','G60','E13'] as $m) $this->model($moto, $m);

        foreach (['Tab A','Tab S6','Tab S7','Tab S8'] as $m) $this->model($tabSam, $m);
        foreach (['iPad 9','iPad 10','iPad Air','iPad Pro'] as $m) $this->model($tabApp, $m);

        foreach (['PS4','PS4 Pro','PS5'] as $m) $this->model($ps, $m);
        foreach (['Xbox One S','Xbox One X','Series S','Series X'] as $m) $this->model($xbox, $m);
        foreach (['Switch','Switch Lite','Switch OLED'] as $m) $this->model($nintendo, $m);

        foreach (['DualShock 4','DualSense'] as $m) $this->model($joyPs, $m);
        foreach (['Xbox One Controller','Xbox Series Controller'] as $m) $this->model($joyXbox, $m);
        foreach (['Joy-Con'] as $m) $this->model($joyNin, $m);

        $this->model($generico, 'Otro');


        $issue = function (DeviceType $type, string $name) {
            $slug = Str::slug($name);
            DeviceIssueType::updateOrCreate(
                ['device_type_id' => $type->id, 'slug' => $slug],
                ['name' => $name]
            );
        };

        // Celular
        $issue($cel, 'Pantalla');
        $issue($cel, 'Batería');
        $issue($cel, 'Pin de carga');
        $issue($cel, 'Software');
        $issue($cel, 'Cámara');
        $issue($cel, 'Otro');

        // Tablet
        $issue($tab, 'Pantalla');
        $issue($tab, 'Batería');
        $issue($tab, 'Pin de carga');
        $issue($tab, 'Software');
        $issue($tab, 'Otro');

        // Consola
        $issue($con, 'No enciende');
        $issue($con, 'HDMI / Video');
        $issue($con, 'Sobrecalentamiento');
        $issue($con, 'Software');
        $issue($con, 'Limpieza');
        $issue($con, 'Otro');

        // Joystick
        $issue($joy, 'Drift');
        $issue($joy, 'Botones');
        $issue($joy, 'Gatillos');
        $issue($joy, 'Batería / Carga');
        $issue($joy, 'Otro');

        // Otro
        $issue($otr, 'Diagnóstico');
        $issue($otr, 'Otro');


    }

    private function type(string $name, string $slug): DeviceType
    {
        return DeviceType::firstOrCreate(['slug' => $slug], ['name' => $name]);
    }

    private function brand(DeviceType $type, string $name): DeviceBrand
    {
        $base = Str::slug($name) ?: 'marca';
        $slug = $base;
        $i = 2;

        while (DeviceBrand::where('device_type_id', $type->id)->where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }

        return DeviceBrand::firstOrCreate(
            ['device_type_id' => $type->id, 'slug' => $slug],
            ['name' => $name]
        );
    }

    private function model(DeviceBrand $brand, string $name): DeviceModel
    {
        $base = Str::slug($name) ?: 'modelo';
        $slug = $base;
        $i = 2;

        while (DeviceModel::where('device_brand_id', $brand->id)->where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }

        return DeviceModel::firstOrCreate(
            ['device_brand_id' => $brand->id, 'slug' => $slug],
            ['name' => $name]
        );
    }
}
