<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->boolean('is_quick_sale')->default(false)->after('notes');
            $table->foreignId('quick_sale_admin_id')
                ->nullable()
                ->after('is_quick_sale')
                ->constrained('users')
                ->nullOnDelete();

            $table->index(['is_quick_sale', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_is_quick_sale_created_at_index');
            $table->dropConstrainedForeignId('quick_sale_admin_id');
            $table->dropColumn('is_quick_sale');
        });
    }
};
