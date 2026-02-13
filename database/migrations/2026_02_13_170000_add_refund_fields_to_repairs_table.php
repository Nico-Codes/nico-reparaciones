<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('repairs', function (Blueprint $table) {
            if (!Schema::hasColumn('repairs', 'refunded_total')) {
                $table->boolean('refunded_total')->default(false)->after('delivered_at');
            }

            if (!Schema::hasColumn('repairs', 'refunded_amount')) {
                $table->unsignedInteger('refunded_amount')->default(0)->after('refunded_total');
            }

            if (!Schema::hasColumn('repairs', 'refund_reason')) {
                $table->string('refund_reason', 255)->nullable()->after('refunded_amount');
            }

            if (!Schema::hasColumn('repairs', 'refunded_at')) {
                $table->timestamp('refunded_at')->nullable()->after('refund_reason');
            }
        });
    }

    public function down(): void
    {
        Schema::table('repairs', function (Blueprint $table) {
            foreach (['refunded_at', 'refund_reason', 'refunded_amount', 'refunded_total'] as $column) {
                if (Schema::hasColumn('repairs', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};

