<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureNotBanned
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user && $user->banned) {
            // Revoke persistent tokens (skip TransientToken which has no delete())
            try { $user->tokens()->delete(); } catch (\Throwable) {}

            return response()->json([
                'message' => 'Your account has been suspended.',
            ], 403);
        }

        return $next($request);
    }
}
