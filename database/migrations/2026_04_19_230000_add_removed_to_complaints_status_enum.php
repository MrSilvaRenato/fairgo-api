<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') return;

        DB::statement("ALTER TABLE complaints MODIFY COLUMN status ENUM(
            'open','awaiting_response','responded','resolved','unresolved','expired','removed'
        ) NOT NULL DEFAULT 'open'");
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') return;

        DB::statement("ALTER TABLE complaints MODIFY COLUMN status ENUM(
            'open','awaiting_response','responded','resolved','unresolved','expired'
        ) NOT NULL DEFAULT 'open'");
    }
};
