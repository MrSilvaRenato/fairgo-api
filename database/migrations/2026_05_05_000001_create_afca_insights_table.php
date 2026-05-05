<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('afca_insights', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
            $table->string('firm_name');
            $table->string('primary_business', 100);
            $table->smallInteger('period_year');
            $table->unsignedInteger('complaints_received')->default(0);
            $table->unsignedInteger('complaints_resolved')->default(0);
            $table->decimal('resolution_rate', 5, 2)->default(0);
            $table->timestamps();

            $table->index('company_id');
            $table->index('firm_name');
            $table->index('period_year');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('afca_insights');
    }
};
