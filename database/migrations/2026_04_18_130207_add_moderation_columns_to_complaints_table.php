<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('complaints', function (Blueprint $table) {
            // Check and add only columns that don't exist yet
            if (!Schema::hasColumn('complaints', 'moderation_status')) {
                $table->enum('moderation_status', ['pending', 'approved', 'edited', 'flagged', 'rejected'])
                    ->default('pending')
                    ->after('is_public');
            }
            if (!Schema::hasColumn('complaints', 'moderation_flags')) {
                $table->json('moderation_flags')->nullable()->after('moderation_status');
            }
            if (!Schema::hasColumn('complaints', 'moderation_note')) {
                $table->text('moderation_note')->nullable()->after('moderation_flags');
            }
            if (!Schema::hasColumn('complaints', 'moderation_edited')) {
                $table->boolean('moderation_edited')->default(false)->after('moderation_note');
            }
        });
    }

    public function down(): void
    {
        Schema::table('complaints', function (Blueprint $table) {
            $table->dropColumn(['moderation_status', 'moderation_flags', 'moderation_note', 'moderation_edited']);
        });
    }
};
