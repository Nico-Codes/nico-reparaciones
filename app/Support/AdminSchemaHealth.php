<?php

namespace App\Support;

use Illuminate\Support\Facades\Schema;
use Throwable;

class AdminSchemaHealth
{
    private static ?array $cache = null;

    /**
     * @return array{ok:bool,issues:array<int,string>,command:string}
     */
    public static function evaluate(bool $refresh = false): array
    {
        if ($refresh) {
            self::$cache = null;
        }

        if (self::$cache !== null) {
            return self::$cache;
        }

        $issues = [];

        try {
            $checks = [
                ['table' => 'products', 'column' => 'sku', 'label' => 'products.sku'],
                ['table' => 'products', 'column' => 'barcode', 'label' => 'products.barcode'],
                ['table' => 'orders', 'column' => 'is_quick_sale', 'label' => 'orders.is_quick_sale'],
                ['table' => 'orders', 'column' => 'quick_sale_admin_id', 'label' => 'orders.quick_sale_admin_id'],
            ];

            foreach ($checks as $check) {
                if (!Schema::hasTable($check['table'])) {
                    $issues[] = "Tabla faltante: {$check['table']}";

                    continue;
                }

                if (!Schema::hasColumn($check['table'], $check['column'])) {
                    $issues[] = "Columna faltante: {$check['label']}";
                }
            }
        } catch (Throwable $e) {
            $issues[] = 'No se pudo verificar el estado de migraciones: '.$e->getMessage();
        }

        self::$cache = [
            'ok' => $issues === [],
            'issues' => $issues,
            'command' => 'php artisan migrate',
        ];

        return self::$cache;
    }
}
