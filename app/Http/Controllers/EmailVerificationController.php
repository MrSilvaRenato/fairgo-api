<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\Request;

class EmailVerificationController extends Controller
{
    /**
     * Verify the email address via the signed URL params sent from the frontend.
     * The frontend passes id, hash, expires, signature as query params.
     */
    public function verify(Request $request)
    {
        $user = \App\Models\User::findOrFail($request->query('id'));

        // Validate the hash
        if (!hash_equals(sha1($user->getEmailForVerification()), $request->query('hash', ''))) {
            return response()->json(['message' => 'Invalid verification link.'], 403);
        }

        // Validate the signed URL (expires + signature)
        if (!$request->hasValidSignature()) {
            return response()->json(['message' => 'Verification link has expired.'], 403);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.']);
        }

        $user->markEmailAsVerified();

        return response()->json(['message' => 'Email verified successfully.']);
    }

    /**
     * Resend the verification email to the authenticated user.
     */
    public function resend(Request $request)
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.']);
        }

        $user->sendEmailVerificationNotification();

        return response()->json(['message' => 'Verification email sent.']);
    }
}
