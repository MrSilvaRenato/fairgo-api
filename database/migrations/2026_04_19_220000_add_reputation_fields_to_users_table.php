<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('banned')->default(false)->after('role');
            $table->unsignedSmallInteger('reputation_score')->default(100)->after('banned');
            $table->string('reputation_flag', 30)->nullable()->after('reputation_score');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['banned', 'reputation_score', 'reputation_flag']);
        });
    }
};
