<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\OtpService;
use App\Services\SmsService;
use Illuminate\Http\Request;

class PhoneVerificationController extends Controller
{
    public function __construct(
        private OtpService $otp,
        private SmsService $sms,
    ) {}

    /**
     * POST /api/auth/phone/send
     * Send OTP to the given phone number.
     */
    public function send(Request $request)
    {
        $request->validate([
            'phone' => ['required', 'string', 'regex:/^\+?[0-9\s\-\(\)]{7,20}$/'],
        ]);

        $phone = preg_replace('/\s+/', '', $request->phone);

        // Rate-limit: if a valid OTP already exists, don't resend immediately
        if ($this->otp->hasPending($phone)) {
            return response()->json([
                'message' => 'A code was already sent. Please wait before requesting a new one.',
            ], 429);
        }

        $code = $this->otp->generate($phone);

        $this->sms->send(
            $phone,
            "Your Aus Fair Go verification code is: {$code}. Valid for 10 minutes."
        );

        return response()->json(['message' => 'Code sent.']);
    }

    /**
     * POST /api/auth/phone/verify
     * Verify OTP and mark phone as verified on the user account.
     */
    public function verify(Request $request)
    {
        $request->validate([
            'phone' => ['required', 'string'],
            'code'  => ['required', 'string', 'size:6'],
        ]);

        $phone = preg_replace('/\s+/', '', $request->phone);

        if (!$this->otp->verify($phone, $request->code)) {
            return response()->json([
                'message' => 'Invalid or expired code.',
                'errors'  => ['code' => ['The code is incorrect or has expired.']],
            ], 422);
        }

        // Enforce one verified phone per account
        $user = $request->user();
        $taken = User::where('phone', $phone)
            ->whereNotNull('phone_verified_at')
            ->where('id', '!=', $user->id)
            ->exists();

        if ($taken) {
            return response()->json([
                'message' => 'This phone number is already linked to another account.',
                'errors'  => ['phone' => ['Phone number already in use.']],
            ], 422);
        }

        // Save phone + verified timestamp on the authenticated user
        $user->update([
            'phone'             => $phone,
            'phone_verified_at' => now(),
        ]);

        return response()->json([
            'message'           => 'Phone verified successfully.',
            'phone_verified_at' => $user->phone_verified_at,
        ]);
    }
}
