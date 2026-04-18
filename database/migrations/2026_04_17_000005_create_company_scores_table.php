<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->unique()->constrained()->cascadeOnDelete();
            $table->float('response_rate')->default(0);
            $table->float('resolution_rate')->default(0);
            $table->float('avg_response_hours')->default(0);
            $table->float('satisfaction_score')->default(0);
            $table->unsignedInteger('total_complaints')->default(0);
            $table->float('score')->default(0);
            $table->timestamp('last_calculated_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_scores');
    }
};
