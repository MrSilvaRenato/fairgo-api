<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// MySQL does not support partial/conditional unique indexes.
// Uniqueness of verified phone numbers is enforced at the application level
// in PhoneVerificationController::verify() before marking a phone as verified.
// This migration is intentionally a no-op for MySQL compatibility.
return new class extends Migration
{
    public function up(): void {}
    public function down(): void {}
};
