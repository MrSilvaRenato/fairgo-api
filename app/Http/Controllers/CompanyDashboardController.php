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
            ->latest()
            ->get();

        $stats = [
            'total'           => $complaints->count(),
            'open'            => $complaints->whereIn('status', ['open', 'awaiting_response'])->count(),
            'responded'       => $complaints->where('status', 'responded')->count(),
            'resolved'        => $complaints->where('status', 'resolved')->count(),
            'unresolved'      => $complaints->where('status', 'unresolved')->count(),
            'pending_response'=> $complaints->whereIn('status', ['open'])->count(),
        ];

        return response()->json([
            'company'    => $company->load('score', 'subscription'),
            'stats'      => $stats,
            'complaints' => $complaints,
        ]);
    }
}
