<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use Illuminate\Http\Request;

class CompanyAnalyticsController extends Controller
{
    public function __invoke(Request $request)
    {
        $company = $request->user()->company;

        if (!$company) {
            return response()->json(['message' => 'No company found.'], 404);
        }

        $complaints = Complaint::where('company_id', $company->id)
            ->with(['response', 'feedback'])
            ->orderBy('created_at')
            ->get();

        // Volume by month (last 12 months)
        $volumeByMonth = $complaints
            ->groupBy(fn($c) => $c->created_at->format('Y-m'))
            ->map(fn($group, $month) => [
                'month' => $month,
                'count' => $group->count(),
            ])
            ->values()
            ->slice(-12)->values();

        // Breakdown by category
        $byCategory = $complaints
            ->groupBy('category')
            ->map(fn($g, $cat) => ['category' => $cat, 'count' => $g->count()])
            ->values();

        // Breakdown by status
        $byStatus = $complaints
            ->groupBy('status')
            ->map(fn($g, $s) => ['status' => $s, 'count' => $g->count()])
            ->values();

        // Average response time per month
        $avgResponseByMonth = $complaints
            ->filter(fn($c) => $c->response)
            ->groupBy(fn($c) => $c->created_at->format('Y-m'))
            ->map(fn($group, $month) => [
                'month'   => $month,
                'avg_hours' => round(
                    $group->avg(fn($c) => $c->created_at->diffInHours($c->response->responded_at)),
                    1
                ),
            ])
            ->values()
            ->slice(-12)->values();

        // Satisfaction over time
        $satisfactionByMonth = $complaints
            ->filter(fn($c) => $c->feedback?->rating)
            ->groupBy(fn($c) => $c->created_at->format('Y-m'))
            ->map(fn($group, $month) => [
                'month'   => $month,
                'avg_rating' => round($group->avg(fn($c) => $c->feedback->rating), 2),
            ])
            ->values()
            ->slice(-12)->values();

        return response()->json([
            'score'                  => $company->score,
            'volume_by_month'        => $volumeByMonth,
            'by_category'            => $byCategory,
            'by_status'              => $byStatus,
            'avg_response_by_month'  => $avgResponseByMonth,
            'satisfaction_by_month'  => $satisfactionByMonth,
        ]);
    }
}
