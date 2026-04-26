<?php

namespace App\Http\Controllers;

use App\Models\CompanyClaim;
use Illuminate\Http\Request;

class ConsumerDashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();

        $complaints = $user->complaints()
            ->with(['company:id,name,slug,logo_url,website', 'response', 'feedback'])
            ->withCount([
                'replies as unread_count' => fn($q) => $q
                    ->where('author_type', 'company')
                    ->whereNull('consumer_read_at'),
            ])
            ->latest('updated_at')
            ->get();

        $stats = [
            'total'      => $complaints->count(),
            'open'       => $complaints->whereIn('status', ['open', 'awaiting_response'])->count(),
            'responded'  => $complaints->where('status', 'responded')->count(),
            'resolved'   => $complaints->where('status', 'resolved')->count(),
            'unresolved' => $complaints->where('status', 'unresolved')->count(),
            'unread'     => $complaints->sum('unread_count'),
        ];

        // Company claims submitted by this user
        $claims = CompanyClaim::where('user_id', $user->id)
            ->with('company:id,name,slug,logo_url')
            ->latest()
            ->get()
            ->map(fn($c) => [
                'id'               => $c->id,
                'status'           => $c->status,
                'company_name'     => $c->company?->name,
                'company_slug'     => $c->company?->slug,
                'company_logo'     => $c->company?->logo_url,
                'rejection_reason' => $c->rejection_reason,
                'reviewed_at'      => $c->reviewed_at?->toDateString(),
                'created_at'       => $c->created_at->toDateString(),
            ]);

        return response()->json([
            'stats'      => $stats,
            'complaints' => $complaints,
            'claims'     => $claims,
        ]);
    }
}
