<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        $after = null;

        if (\Illuminate\Support\Facades\Schema::hasColumn('repairs', 'device_model_id')) {
            $after = 'device_model_id';
        } elseif (\Illuminate\Support\Facades\Schema::hasColumn('repairs', 'device_brand_id')) {
            $after = 'device_brand_id';
        } elseif (\Illuminate\Support\Facades\Schema::hasColumn('repairs', 'device_type_id')) {
            $after = 'device_type_id';
        }

        Schema::table('repairs', function (Blueprint $table) use ($after) {
            $col = $table->foreignId('device_issue_type_id')->nullable();

            if ($after) {
                $col->after($after);
            }

            $col->constrained('device_issue_types')->nullOnDelete();
        });


    }

    public function down(): void
    {
        Schema::table('repairs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('repair_type_id');
        });
    }
};
