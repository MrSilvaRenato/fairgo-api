<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('google_place_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('place_id')->nullable();          // null = searched but not found
            $table->string('google_name')->nullable();
            $table->decimal('rating', 3, 1)->nullable();
            $table->unsignedInteger('user_ratings_total')->nullable();
            $table->string('address', 500)->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('website')->nullable();
            $table->string('maps_url')->nullable();
            $table->json('reviews')->nullable();             // up to 5, with attribution data
            $table->timestamp('fetched_at')->nullable();
            $table->timestamps();

            $table->index('place_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('google_place_snapshots');
    }
};
