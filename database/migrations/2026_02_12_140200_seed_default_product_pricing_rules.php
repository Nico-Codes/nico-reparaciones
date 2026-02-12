<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('product_pricing_rules') || !Schema::hasTable('categories')) {
            return;
        }

        $hasRules = DB::table('product_pricing_rules')->exists();
        if ($hasRules) {
            return;
        }

        $now = now();

        DB::table('product_pricing_rules')->insert([
            'name' => 'Margen general +35%',
            'category_id' => null,
            'product_id' => null,
            'cost_min' => null,
            'cost_max' => null,
            'margin_percent' => 35.00,
            'priority' => 0,
            'active' => 1,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $cablesCategoryId = DB::table('categories')
            ->where('slug', 'cables')
            ->value('id');

        if ($cablesCategoryId) {
            DB::table('product_pricing_rules')->insert([
                'name' => 'Cables <= 5000 +50%',
                'category_id' => (int) $cablesCategoryId,
                'product_id' => null,
                'cost_min' => 0,
                'cost_max' => 5000,
                'margin_percent' => 50.00,
                'priority' => 100,
                'active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('product_pricing_rules')) {
            return;
        }

        DB::table('product_pricing_rules')
            ->whereIn('name', ['Margen general +35%', 'Cables <= 5000 +50%'])
            ->delete();
    }
};
