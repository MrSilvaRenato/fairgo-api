<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Partial unique index: no two accounts can have the same verified phone number.
        // Unverified phones (phone_verified_at IS NULL) are not constrained.
        DB::statement('CREATE UNIQUE INDEX users_verified_phone_unique ON users (phone) WHERE phone_verified_at IS NOT NULL');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS users_verified_phone_unique');
    }
};
