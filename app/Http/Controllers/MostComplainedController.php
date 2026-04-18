<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Complaint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MostComplainedController extends Controller
{
    public function __invoke(Request $request)
    {
        $period   = $request->get('period', 'month'); // week | month | year | all
        $category = $request->get('category');
        $page     = max(1, (int) $request->get('page', 1));
        $perPage  = 15;

        $since = match ($period) {
            'week'  => now()->subWeek(),
            'month' => now()->subMonth(),
            'year'  => now()->subYear(),
            default => null,
        };

        $query = Complaint::select('company_id', DB::raw('COUNT(*) as complaint_count'))
            ->where('is_public', true)
            ->where('status', '!=', 'removed')
            ->when($since, fn($q) => $q->where('created_at', '>=', $since))
            ->when($category, fn($q) => $q->where('category', $category))
            ->groupBy('company_id')
            ->orderByDesc('complaint_count');

        $total      = $query->get()->count();
        $companyIds = $query->skip(($page - 1) * $perPage)->take($perPage)->pluck('company_id');

        // Fetch companies with their counts and scores
        $counts = Complaint::select('company_id', DB::raw('COUNT(*) as complaint_count'))
            ->where('is_public', true)
            ->where('status', '!=', 'removed')
            ->when($since, fn($q) => $q->where('created_at', '>=', $since))
            ->when($category, fn($q) => $q->where('category', $category))
            ->whereIn('company_id', $companyIds)
            ->groupBy('company_id')
            ->pluck('complaint_count', 'company_id');

        // Also get per-category breakdown for each company in this period
        $companies = Company::with(['score', 'subscription'])
            ->whereIn('id', $companyIds)
            ->get()
            ->map(function ($c) use ($counts, $since, $category) {
                $periodCount = $counts[$c->id] ?? 0;

                // Top category for this company in the period
                $topCategory = Complaint::where('company_id', $c->id)
                    ->where('is_public', true)
                    ->where('status', '!=', 'removed')
                    ->when($since, fn($q) => $q->where('created_at', '>=', $since))
                    ->when($category, fn($q) => $q->where('category', $category))
                    ->select('category', DB::raw('COUNT(*) as cnt'))
                    ->groupBy('category')
                    ->orderByDesc('cnt')
                    ->first();

                return [
                    'id'             => $c->id,
                    'name'           => $c->name,
                    'slug'           => $c->slug,
                    'industry'       => $c->industry,
                    'website'        => $c->website,
                    'logo_url'       => $c->logo_url,
                    'verified_badge' => $c->verified_badge,
                    'not_recommended'=> $c->not_recommended,
                    'complaint_count'=> $periodCount,
                    'top_category'   => $topCategory?->category,
                    'score'          => $c->score?->score,
                    'badge'          => $c->score?->badge,
                    'response_rate'  => $c->score?->response_rate,
                ];
            })
            ->sortByDesc('complaint_count')
            ->values();

        return response()->json([
            'data'        => $companies,
            'total'       => $total,
            'period'      => $period,
            'category'    => $category,
            'page'        => $page,
            'per_page'    => $perPage,
            'last_page'   => (int) ceil($total / $perPage),
        ]);
    }
}
