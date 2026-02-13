<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('warranty_incidents', function (Blueprint $table) {
            if (!Schema::hasColumn('warranty_incidents', 'cost_origin')) {
                $table->enum('cost_origin', ['manual', 'repair', 'product'])
                    ->default('manual')
                    ->after('unit_cost');
            }
        });
    }

    public function down(): void
    {
        Schema::table('warranty_incidents', function (Blueprint $table) {
            if (Schema::hasColumn('warranty_incidents', 'cost_origin')) {
                $table->dropColumn('cost_origin');
            }
        });
    }
};

