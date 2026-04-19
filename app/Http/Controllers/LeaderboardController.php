<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\CompanyScore;
use Illuminate\Http\Request;

class LeaderboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $industry = $request->query('industry');

        // Only include companies that have crossed the minimum rating threshold
        $query = Company::with('score')
            ->whereHas('score', fn($q) => $q->where('total_complaints', '>=', CompanyScore::MIN_FOR_RATING));

        if ($industry && $industry !== 'all') {
            $query->where('industry', $industry);
        }

        $companies = $query->get()
            ->sortByDesc(fn($c) => $c->score?->score ?? 0)
            ->take(10)
            ->values()
            ->map(fn($c) => [
                'id'              => $c->id,
                'name'            => $c->name,
                'slug'            => $c->slug,
                'industry'        => $c->industry,
                'website'         => $c->website,
                'logo_url'        => $c->logo_url,
                'score'           => round($c->score?->score ?? 0, 1),
                'badge'           => $c->score?->badge ?? 'not_rated',
                'total'           => $c->score?->total_complaints ?? 0,
                'response_rate'   => round(($c->score?->response_rate ?? 0) * 100),
                'verified_badge'  => (bool) $c->verified_badge,
                'not_recommended' => (bool) $c->not_recommended,
                'claimed'         => (bool) $c->claimed,
            ]);

        $industries = Company::whereNotNull('industry')
            ->distinct()
            ->pluck('industry')
            ->filter()
            ->sort()
            ->values();

        return response()->json([
            'companies'  => $companies,
            'industries' => $industries,
        ]);
    }
}
