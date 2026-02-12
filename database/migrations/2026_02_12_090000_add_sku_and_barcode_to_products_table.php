<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('sku', 64)->nullable()->after('slug');
            $table->string('barcode', 64)->nullable()->after('sku');
        });

        DB::table('products')
            ->select(['id', 'sku'])
            ->orderBy('id')
            ->chunkById(500, function ($rows): void {
                foreach ($rows as $row) {
                    $currentSku = trim((string) ($row->sku ?? ''));
                    if ($currentSku !== '') {
                        continue;
                    }

                    $generated = 'SKU-' . str_pad((string) $row->id, 6, '0', STR_PAD_LEFT);
                    DB::table('products')
                        ->where('id', (int) $row->id)
                        ->update(['sku' => $generated]);
                }
            });

        Schema::table('products', function (Blueprint $table) {
            $table->unique('sku');
            $table->unique('barcode');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique(['sku']);
            $table->dropUnique(['barcode']);
            $table->dropColumn(['sku', 'barcode']);
        });
    }
};
