<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('repairs', function (Blueprint $table) {
            if (!Schema::hasColumn('repairs', 'supplier_part_name')) {
                $table->string('supplier_part_name', 255)->nullable()->after('supplier_id');
            }
            if (!Schema::hasColumn('repairs', 'purchase_reference')) {
                $table->string('purchase_reference', 500)->nullable()->after('supplier_part_name');
            }
        });
    }

    public function down(): void
    {
        Schema::table('repairs', function (Blueprint $table) {
            foreach (['purchase_reference', 'supplier_part_name'] as $column) {
                if (Schema::hasColumn('repairs', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};

