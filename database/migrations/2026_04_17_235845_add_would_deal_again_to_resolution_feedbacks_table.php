<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resolution_feedbacks', function (Blueprint $table) {
            $table->boolean('would_deal_again')->nullable()->after('resolved');
        });
    }

    public function down(): void
    {
        Schema::table('resolution_feedbacks', function (Blueprint $table) {
            $table->dropColumn('would_deal_again');
        });
    }
};
