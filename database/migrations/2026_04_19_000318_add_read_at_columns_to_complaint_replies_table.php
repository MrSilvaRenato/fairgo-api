<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('complaint_replies', function (Blueprint $table) {
            $table->timestamp('company_read_at')->nullable()->after('content');
            $table->timestamp('consumer_read_at')->nullable()->after('company_read_at');
        });
    }

    public function down(): void
    {
        Schema::table('complaint_replies', function (Blueprint $table) {
            $table->dropColumn(['company_read_at', 'consumer_read_at']);
        });
    }
};
