<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('company_claims', function (Blueprint $table) {
            $table->string('abn_confirmation')->nullable()->after('claimant_phone');
            $table->string('proof_type')->nullable()->after('abn_confirmation');
        });
    }

    public function down(): void
    {
        Schema::table('company_claims', function (Blueprint $table) {
            $table->dropColumn(['abn_confirmation', 'proof_type']);
        });
    }
};
