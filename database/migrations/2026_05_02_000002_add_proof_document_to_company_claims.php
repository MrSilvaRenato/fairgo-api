<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('company_claims', function (Blueprint $table) {
            $table->string('proof_document')->nullable()->after('proof_type');
            $table->boolean('domain_match')->nullable()->after('proof_document');
        });
    }

    public function down(): void
    {
        Schema::table('company_claims', function (Blueprint $table) {
            $table->dropColumn(['proof_document', 'domain_match']);
        });
    }
};
