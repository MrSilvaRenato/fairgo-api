<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class DeleteAccountController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'password' => 'required|string',
        ]);

        // Verify password
        if (!Hash::check($request->input('password'), $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['The password you entered is incorrect.'],
            ]);
        }

        // Anonymise complaints — keep them on the platform but strip identity.
        // Store a one-way SHA-256 hash of the user's email (salted) so admins
        // can later verify distinct real users if a company disputes anonymous complaints.
        // The hash cannot be reversed to identify the user.
        $hash = hash('sha256', config('app.key') . '|' . strtolower($user->email));

        \App\Models\Complaint::where('consumer_id', $user->id)->update([
            'consumer_id'    => null,
            'anonymous_hash' => $hash,
        ]);

        // If company admin — unlink and unmark the company as claimed
        if ($user->role === 'company_admin') {
            \App\Models\Company::where('user_id', $user->id)->update([
                'user_id' => null,
                'claimed' => false,
            ]);
        }

        // Revoke all tokens
        $user->tokens()->delete();

        // Hard delete the user — cascades to claims, replies, feedbacks via DB constraints
        $user->delete();

        return response()->json([
            'message' => 'Your account has been permanently deleted.',
        ]);
    }
}
