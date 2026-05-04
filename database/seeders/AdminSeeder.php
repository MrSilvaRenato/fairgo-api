<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $email    = env('ADMIN_EMAIL');
        $password = env('ADMIN_PASSWORD');

        if (!$email || !$password) {
            $this->command->warn('AdminSeeder skipped — ADMIN_EMAIL or ADMIN_PASSWORD not set in .env');
            return;
        }

        User::updateOrCreate(['email' => $email], [
            'name'              => env('ADMIN_NAME', 'Admin'),
            'email'             => $email,
            'password'          => Hash::make($password),
            'role'              => 'admin',
            'email_verified_at' => now(),
        ]);
    }
}
