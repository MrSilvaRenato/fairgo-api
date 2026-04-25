<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class DeleteAccountController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'password' => 'required|string',
        ]);

        if (!Hash::check($request->input('password'), $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['The password you entered is incorrect.'],
            ]);
        }

        // If company admin — unlink and unmark the company as claimed
        if ($user->role === 'company_admin') {
            \App\Models\Company::where('user_id', $user->id)->update([
                'user_id' => null,
                'claimed' => false,
            ]);
        }

        // Revoke all tokens so all sessions are immediately signed out
        $user->tokens()->delete();

        // Deactivate: scramble contact info for privacy, keep name for public record
        $user->update([
            'email'          => 'deactivated_' . $user->id . '_' . Str::random(12) . '@deleted.ausfairgo.com',
            'phone'          => null,
            'password'       => Hash::make(Str::random(32)), // unguessable, can't login
            'remember_token' => null,
            'deactivated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Your account has been deactivated and personal data removed.',
        ]);
    }
}
