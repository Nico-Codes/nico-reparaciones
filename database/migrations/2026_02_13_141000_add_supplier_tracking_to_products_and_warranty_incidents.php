<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'supplier_id')) {
                $table->foreignId('supplier_id')
                    ->nullable()
                    ->after('category_id')
                    ->constrained('suppliers')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('products', 'purchase_reference')) {
                $table->string('purchase_reference', 120)->nullable()->after('supplier_id');
            }
        });

        Schema::table('warranty_incidents', function (Blueprint $table) {
            if (!Schema::hasColumn('warranty_incidents', 'supplier_id')) {
                $table->foreignId('supplier_id')
                    ->nullable()
                    ->after('product_id')
                    ->constrained('suppliers')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('warranty_incidents', function (Blueprint $table) {
            if (Schema::hasColumn('warranty_incidents', 'supplier_id')) {
                $table->dropConstrainedForeignId('supplier_id');
            }
        });

        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'supplier_id')) {
                $table->dropConstrainedForeignId('supplier_id');
            }
            if (Schema::hasColumn('products', 'purchase_reference')) {
                $table->dropColumn('purchase_reference');
            }
        });
    }
};

