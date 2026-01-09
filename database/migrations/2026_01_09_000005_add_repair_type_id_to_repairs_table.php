<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('repairs', function (Blueprint $table) {
            $table->foreignId('repair_type_id')
                ->nullable()
                ->after('device_issue_type_id')
                ->constrained('repair_types')
                ->nullOnDelete();

            $table->index(['repair_type_id']);
        });
    }

    public function down(): void
    {
        Schema::table('repairs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('repair_type_id');
        });
    }
};
