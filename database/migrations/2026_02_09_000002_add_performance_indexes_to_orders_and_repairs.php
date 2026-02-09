<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->index(['status', 'created_at'], 'orders_status_created_at_idx');
            $table->index(['user_id', 'created_at'], 'orders_user_created_at_idx');
        });

        Schema::table('repairs', function (Blueprint $table) {
            $table->index(['status', 'created_at'], 'repairs_status_created_at_idx');
            $table->index(['status', 'received_at'], 'repairs_status_received_at_idx');
            $table->index(['user_id', 'created_at'], 'repairs_user_created_at_idx');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_status_created_at_idx');
            $table->dropIndex('orders_user_created_at_idx');
        });

        Schema::table('repairs', function (Blueprint $table) {
            $table->dropIndex('repairs_status_created_at_idx');
            $table->dropIndex('repairs_status_received_at_idx');
            $table->dropIndex('repairs_user_created_at_idx');
        });
    }
};
