<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(['email' => 'renatoleite.log@gmail.com'], [
            'name'              => 'Renato Leite',
            'email'             => 'renatoleite.log@gmail.com',
            'password'          => Hash::make('Re58219094$'),
            'role'              => 'admin',
            'email_verified_at' => now(),
        ]);
    }
}
