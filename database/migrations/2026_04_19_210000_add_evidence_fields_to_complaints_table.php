<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('complaints', function (Blueprint $table) {
            $table->date('incident_date')->nullable()->after('category');
            $table->string('reference_number', 120)->nullable()->after('incident_date');
            $table->decimal('amount_involved', 10, 2)->nullable()->after('reference_number');
            $table->boolean('contact_attempted')->default(false)->after('amount_involved');
        });
    }

    public function down(): void
    {
        Schema::table('complaints', function (Blueprint $table) {
            $table->dropColumn(['incident_date', 'reference_number', 'amount_involved', 'contact_attempted']);
        });
    }
};
