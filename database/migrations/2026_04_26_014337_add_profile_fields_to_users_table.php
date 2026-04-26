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
        Schema::table('users', function (Blueprint $table) {
            $table->string('address')->nullable()->after('phone');
            $table->string('id_document_path')->nullable()->after('address');
            $table->enum('id_verification_status', ['pending', 'approved', 'rejected'])->nullable()->after('id_document_path');
            $table->timestamp('id_verified_at')->nullable()->after('id_verification_status');
            $table->string('id_rejection_note')->nullable()->after('id_verified_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'address', 'id_document_path',
                'id_verification_status', 'id_verified_at', 'id_rejection_note',
            ]);
        });
    }
};
