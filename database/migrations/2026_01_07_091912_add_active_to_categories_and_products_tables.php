<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('categories', 'active')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->boolean('active')->default(true)->after('slug');
            });
        }

        if (!Schema::hasColumn('products', 'active')) {
            Schema::table('products', function (Blueprint $table) {
                $table->boolean('active')->default(true)->after('featured');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('categories', 'active')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->dropColumn('active');
            });
        }

        if (Schema::hasColumn('products', 'active')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('active');
            });
        }
    }
};
