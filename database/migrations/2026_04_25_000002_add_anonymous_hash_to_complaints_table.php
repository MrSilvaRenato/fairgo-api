<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('complaints', function (Blueprint $table) {
            // One-way hash of the original user's email — kept after account deletion
            // for admin audit only. Never exposed publicly. Cannot be reversed.
            $table->string('anonymous_hash')->nullable()->after('consumer_id');
        });
    }

    public function down(): void
    {
        Schema::table('complaints', function (Blueprint $table) {
            $table->dropColumn('anonymous_hash');
        });
    }
};
