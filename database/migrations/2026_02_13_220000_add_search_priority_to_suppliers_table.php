<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('suppliers', function (Blueprint $table): void {
            $table->unsignedInteger('search_priority')->default(100)->after('search_enabled');
        });

        $suppliers = DB::table('suppliers')->orderBy('id')->get(['id']);
        $priority = 10;
        foreach ($suppliers as $supplier) {
            DB::table('suppliers')
                ->where('id', $supplier->id)
                ->update(['search_priority' => $priority]);
            $priority += 10;
        }
    }

    public function down(): void
    {
        Schema::table('suppliers', function (Blueprint $table): void {
            $table->dropColumn('search_priority');
        });
    }
};

