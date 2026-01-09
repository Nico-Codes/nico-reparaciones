<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('repairs', function (Blueprint $table) {
            $table->foreignId('device_issue_type_id')
                ->nullable()
                ->after('device_model_id')
                ->constrained('device_issue_types')
                ->nullOnDelete();

            $table->text('issue_detail')->nullable()->after('device_issue_type_id');
        });
    }

    public function down(): void
    {
        Schema::table('repairs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('device_issue_type_id');
            $table->dropColumn('issue_detail');
        });
    }
};
