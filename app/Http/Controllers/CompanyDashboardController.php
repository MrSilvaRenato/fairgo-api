<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class CompanyDashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $company = $request->user()->company;

        if (!$company) {
            return response()->json(['message' => 'No company found.'], 404);
        }

        $complaints = $company->complaints()
            ->with(['consumer:id,name', 'response', 'feedback'])
            ->withCount([
                'replies as unread_count' => fn($q) => $q
                    ->where('author_type', 'consumer')
                    ->whereNull('company_read_at'),
            ])
            // Only show approved complaints — hide pending/flagged/rejected until admin clears them
            ->whereIn('moderation_status', ['approved', 'edited'])
            ->where('status', '!=', 'removed')
            ->latest('updated_at')
            ->get();

        $stats = [
            'total'            => $complaints->count(),
            'open'             => $complaints->whereIn('status', ['open', 'awaiting_response'])->count(),
            'pending_response' => $complaints->where('status', 'open')->count(),
            'responded'        => $complaints->where('status', 'responded')->count(),
            'resolved'         => $complaints->where('status', 'resolved')->count(),
            'unresolved'       => $complaints->where('status', 'unresolved')->count(),
            'unread'           => $complaints->sum('unread_count'),
        ];

        return response()->json([
            'company'    => $company->load('score', 'subscription'),
            'stats'      => $stats,
            'complaints' => $complaints,
        ]);
    }
}
