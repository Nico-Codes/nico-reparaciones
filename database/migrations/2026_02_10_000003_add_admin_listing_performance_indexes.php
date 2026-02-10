<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Legacy rows can have NULL received_at; align it so status+received_at indexes are usable.
        DB::statement('UPDATE repairs SET received_at = created_at WHERE received_at IS NULL');

        Schema::table('orders', function (Blueprint $table) {
            $table->index('created_at', 'orders_created_at_idx');
            $table->index(['status', 'pickup_phone'], 'orders_status_pickup_phone_idx');
        });

        Schema::table('repairs', function (Blueprint $table) {
            $table->index('created_at', 'repairs_created_at_idx');
            $table->index(['status', 'customer_phone'], 'repairs_status_customer_phone_idx');
        });

        Schema::table('order_whatsapp_logs', function (Blueprint $table) {
            $table->index(['order_id', 'notified_status', 'sent_at'], 'order_wa_order_status_sent_idx');
        });

        Schema::table('repair_whatsapp_logs', function (Blueprint $table) {
            $table->index(['repair_id', 'notified_status', 'sent_at'], 'repair_wa_repair_status_sent_idx');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_created_at_idx');
            $table->dropIndex('orders_status_pickup_phone_idx');
        });

        Schema::table('repairs', function (Blueprint $table) {
            $table->dropIndex('repairs_created_at_idx');
            $table->dropIndex('repairs_status_customer_phone_idx');
        });

        Schema::table('order_whatsapp_logs', function (Blueprint $table) {
            $table->dropIndex('order_wa_order_status_sent_idx');
        });

        Schema::table('repair_whatsapp_logs', function (Blueprint $table) {
            $table->dropIndex('repair_wa_repair_status_sent_idx');
        });
    }
};
