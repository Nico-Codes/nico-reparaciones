<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('repair_status_histories', function (Blueprint $table) {
            $table->id();

            $table->foreignId('repair_id')->constrained()->cascadeOnDelete();

            $table->string('from_status')->nullable();
            $table->string('to_status');

            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('changed_at')->useCurrent();

            $table->text('comment')->nullable();

            $table->index(['repair_id', 'changed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repair_status_histories');
    }
};
