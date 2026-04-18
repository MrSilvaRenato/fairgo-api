<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ConsumerDashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();

        $complaints = $user->complaints()
            ->with(['company:id,name,slug', 'response', 'feedback'])
            ->latest()
            ->get();

        $stats = [
            'total'      => $complaints->count(),
            'open'       => $complaints->whereIn('status', ['open', 'awaiting_response'])->count(),
            'responded'  => $complaints->where('status', 'responded')->count(),
            'resolved'   => $complaints->where('status', 'resolved')->count(),
            'unresolved' => $complaints->where('status', 'unresolved')->count(),
        ];

        return response()->json([
            'stats'      => $stats,
            'complaints' => $complaints,
        ]);
    }
}
