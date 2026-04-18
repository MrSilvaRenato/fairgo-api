<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

/**
 * Generates and verifies 6-digit OTPs stored in cache.
 * TTL: 10 minutes. Max 3 attempts before code is invalidated.
 */
class OtpService
{
    private const TTL     = 600;   // 10 minutes
    private const MAX_ATTEMPTS = 3;

    public function generate(string $phone): string
    {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        Cache::put($this->codeKey($phone),     $code,              self::TTL);
        Cache::put($this->attemptsKey($phone), 0,                  self::TTL);

        return $code;
    }

    public function verify(string $phone, string $code): bool
    {
        $stored   = Cache::get($this->codeKey($phone));
        $attempts = (int) Cache::get($this->attemptsKey($phone), 0);

        if (!$stored || $attempts >= self::MAX_ATTEMPTS) {
            return false;
        }

        if ($stored !== $code) {
            Cache::increment($this->attemptsKey($phone));
            return false;
        }

        // Valid — clear both keys
        Cache::forget($this->codeKey($phone));
        Cache::forget($this->attemptsKey($phone));

        return true;
    }

    public function hasPending(string $phone): bool
    {
        return Cache::has($this->codeKey($phone));
    }

    private function codeKey(string $phone): string
    {
        return 'otp:code:' . $phone;
    }

    private function attemptsKey(string $phone): string
    {
        return 'otp:attempts:' . $phone;
    }
}
