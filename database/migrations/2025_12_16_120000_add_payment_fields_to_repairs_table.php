<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Migration "safe": solo agrega lo que falte.
        Schema::table('repairs', function (Blueprint $table) {
            if (!Schema::hasColumn('repairs', 'paid_amount')) {
                $table->decimal('paid_amount', 10, 2)->nullable()->default(0);
            }

            if (!Schema::hasColumn('repairs', 'payment_method')) {
                $table->string('payment_method', 50)->nullable();
            }

            if (!Schema::hasColumn('repairs', 'payment_notes')) {
                $table->string('payment_notes', 500)->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('repairs', function (Blueprint $table) {
            $toDrop = [];
            foreach (['paid_amount', 'payment_method', 'payment_notes'] as $col) {
                if (Schema::hasColumn('repairs', $col)) {
                    $toDrop[] = $col;
                }
            }

            if (!empty($toDrop)) {
                $table->dropColumn($toDrop);
            }
        });
    }
};
