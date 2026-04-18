<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            // Allow user_id to be null for stub (auto-created) companies
            $table->foreignId('user_id')->nullable()->change();
            // Stub = auto-created from an unregistered-company complaint
            $table->boolean('is_stub')->default(false)->after('claimed');
            // Store the ABR-returned entity name for admin reference
            $table->string('abn_entity_name')->nullable()->after('abn');
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['is_stub', 'abn_entity_name']);
            $table->foreignId('user_id')->nullable(false)->change();
        });
    }
};
