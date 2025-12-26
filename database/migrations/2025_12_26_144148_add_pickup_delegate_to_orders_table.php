<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('pickup_delegate_name')->nullable()->after('pickup_phone');
            $table->string('pickup_delegate_phone')->nullable()->after('pickup_delegate_name');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['pickup_delegate_name', 'pickup_delegate_phone']);
        });
    }

};
