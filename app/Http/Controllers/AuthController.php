<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Rules\NotDisposableEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => ['required', 'email', 'unique:users,email', new NotDisposableEmail],
            'password' => 'required|string|min:8|confirmed',
            'role'     => 'sometimes|in:consumer,company_admin',
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => $data['password'],
            'role'     => $data['role'] ?? 'consumer',
        ]);

        // Send verification email — wrapped so a mail config issue never breaks registration
        try {
            $user->sendEmailVerificationNotification();
        } catch (\Exception $e) {
            \Log::error('Verification email failed for user ' . $user->id . ': ' . $e->getMessage());
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'  => array_merge($user->toArray(), ['company_id' => null]),
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt($data)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user = Auth::user();

        if ($user->banned) {
            Auth::logout();
            throw ValidationException::withMessages([
                'email' => ['This account has been suspended. Contact support if you believe this is an error.'],
            ]);
        }

        if ($user->deactivated_at) {
            Auth::logout();
            throw ValidationException::withMessages([
                'email' => ['This account has been deactivated.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        $user->load('company:id');
        return response()->json([
            'user'  => array_merge($user->toArray(), ['company_id' => $user->company?->id]),
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $token = $request->user()->currentAccessToken();

        // TransientToken (stateful sessions) has no delete() method
        if (method_exists($token, 'delete')) {
            $token->delete();
        }

        // Destroy the Laravel session when one exists (stateful/browser requests).
        // Pure Bearer-token requests have no session; skip to avoid RuntimeException.
        if ($request->hasSession()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $data = $user->toArray();
        $data['company_id']    = $user->company?->id;
        $data['unread_replies'] = $this->unreadCount($user);
        return response()->json($data);
    }

    private function unreadCount(\App\Models\User $user): int
    {
        if ($user->role !== 'consumer') return 0;
        return \App\Models\ComplaintReply::whereHas('complaint', fn($q) => $q->where('consumer_id', $user->id))
            ->where('author_type', 'company')
            ->whereNull('consumer_read_at')
            ->count();
    }
}
