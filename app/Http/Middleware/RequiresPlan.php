<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequiresPlan
{
    /**
     * Usage: middleware('requires.plan:standard')  or  middleware('requires.plan:pro')
     * Accepts comma-separated plans: middleware('requires.plan:standard,pro')
     */
    public function handle(Request $request, Closure $next, string ...$plans): Response
    {
        $user    = $request->user();
        $company = $user?->company;

        if (!$company) {
            return response()->json(['message' => 'No company found.'], 403);
        }

        $subscription = $company->subscription;
        $currentPlan  = $subscription?->plan ?? 'free';

        if (!in_array($currentPlan, $plans, true)) {
            return response()->json([
                'message'        => 'This feature requires a paid plan.',
                'required_plans' => $plans,
                'current_plan'   => $currentPlan,
            ], 403);
        }

        return $next($request);
    }
}
