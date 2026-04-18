<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Complaint;
use App\Models\Subscription;
use App\Services\AbnLookupService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CompanyController extends Controller
{
    public function __construct(private AbnLookupService $abn) {}

    public function store(Request $request)
    {
        if ($request->user()->company) {
            return response()->json(['message' => 'You have already registered a company.'], 422);
        }

        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'abn'         => 'required|string',
            'industry'    => 'nullable|string|max:100',
            'description' => 'nullable|string|max:1000',
            'website'     => 'nullable|string|max:255',
        ]);

        $abn = preg_replace('/\s+/', '', $data['abn']);

        if (!$this->abn->isValidAbn($abn)) {
            return response()->json(['errors' => ['abn' => ['Invalid ABN.']]], 422);
        }

        $slug = Str::slug($data['name']);
        $base = $slug;
        $i = 1;
        while (Company::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        // Strip protocol/trailing slashes so Clearbit gets a clean domain
        $website = isset($data['website']) ? preg_replace('#^https?://#', '', rtrim($data['website'], '/')) : null;

        $company = Company::create([
            'user_id'     => $request->user()->id,
            'name'        => $data['name'],
            'slug'        => $slug,
            'abn'         => $abn,
            'industry'    => $data['industry'] ?? null,
            'description' => $data['description'] ?? null,
            'website'     => $website,
            'claimed'     => true,
        ]);

        // Seed free subscription
        Subscription::create([
            'company_id' => $company->id,
            'plan'       => 'free',
            'status'     => 'active',
        ]);

        // Update user role
        $request->user()->update(['role' => 'company_admin']);

        return response()->json($company->load('subscription'), 201);
    }

    public function updateSettings(Request $request)
    {
        $company = $request->user()->company;

        if (!$company) {
            return response()->json(['message' => 'No company found.'], 404);
        }

        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'industry'    => 'nullable|string|max:100',
            'description' => 'nullable|string|max:1000',
            'website'     => 'nullable|string|max:255',
            'logo_url'    => 'nullable|url|max:500',
        ]);

        // Strip protocol so logo fetcher gets a clean domain
        if (!empty($data['website'])) {
            $data['website'] = preg_replace('#^https?://#', '', rtrim($data['website'], '/'));
        }

        $company->update($data);

        return response()->json($company->fresh());
    }

    public function lookupAbn(Request $request, string $abn)
    {
        $result = $this->abn->lookup($abn);

        if (!$result) {
            return response()->json(['message' => 'ABN not found or invalid.'], 404);
        }

        return response()->json($result);
    }

    public function search(Request $request)
    {
        $companies = Company::where('name', 'like', '%' . $request->q . '%')
            ->select('id', 'name', 'slug', 'industry')
            ->limit(10)
            ->get();

        return response()->json($companies);
    }

    public function performance(Request $request, string $slug)
    {
        $company = Company::where('slug', $slug)->firstOrFail();

        $period = $request->get('period', '6months');
        $since  = match ($period) {
            '6months'  => now()->subMonths(6),
            '12months' => now()->subMonths(12),
            'year'     => now()->startOfYear(),
            default    => null,
        };

        $query = Complaint::where('company_id', $company->id)
            ->where('status', '!=', 'removed')
            ->with(['response', 'feedback']);

        if ($since) $query->where('created_at', '>=', $since);

        $complaints = $query->get();
        $total      = $complaints->count();

        if ($total === 0) {
            return response()->json([
                'period' => $period, 'total' => 0,
                'response_rate' => 0, 'resolution_rate' => 0,
                'avg_response_hours' => 0, 'awaiting' => 0,
                'rated_count' => 0, 'avg_rating' => null,
                'deal_again_pct' => null, 'satisfaction_pct' => null,
                'category_breakdown' => [], 'status_breakdown' => [],
                'since' => $since?->toDateString(),
            ]);
        }

        $responded    = $complaints->filter(fn($c) => in_array($c->status, ['responded','resolved','unresolved']))->count();
        $responseRate = $responded / $total;

        $resolved       = $complaints->where('status', 'resolved')->count();
        $resolutionRate = $responded > 0 ? $resolved / $responded : 0;

        $awaiting = $complaints->filter(fn($c) => in_array($c->status, ['open','awaiting_response']))->count();

        $times = $complaints->filter(fn($c) => $c->response)
            ->map(fn($c) => $c->created_at->diffInHours($c->response->responded_at));
        $avgHours = $times->count() > 0 ? $times->avg() : 0;

        $feedbacks  = $complaints->map(fn($c) => $c->feedback)->filter();
        $ratedCount = $feedbacks->filter(fn($f) => $f->rating !== null)->count();
        $avgRating  = $ratedCount > 0 ? round($feedbacks->filter(fn($f) => $f->rating)->avg('rating'), 1) : null;

        $dealFeedbacks  = $feedbacks->filter(fn($f) => $f->would_deal_again !== null);
        $dealAgainPct   = $dealFeedbacks->count() > 0
            ? round($dealFeedbacks->where('would_deal_again', true)->count() / $dealFeedbacks->count() * 100)
            : null;

        $satPct = $ratedCount > 0
            ? round($feedbacks->filter(fn($f) => $f->rating >= 4)->count() / $ratedCount * 100)
            : null;

        // Category breakdown
        $catBreakdown = $complaints->groupBy('category')
            ->map(fn($g) => ['count' => $g->count(), 'pct' => round($g->count() / $total * 100)])
            ->sortByDesc('count')->take(5)->toArray();

        // Status breakdown
        $statusBreakdown = $complaints->groupBy('status')
            ->map(fn($g) => $g->count())
            ->sortByDesc(fn($v) => $v)->toArray();

        return response()->json([
            'period'             => $period,
            'total'              => $total,
            'responded'          => $responded,
            'awaiting'           => $awaiting,
            'response_rate'      => round($responseRate * 100),
            'resolution_rate'    => round($resolutionRate * 100),
            'avg_response_hours' => round($avgHours, 1),
            'rated_count'        => $ratedCount,
            'avg_rating'         => $avgRating,
            'deal_again_pct'     => $dealAgainPct,
            'satisfaction_pct'   => $satPct,
            'category_breakdown' => $catBreakdown,
            'status_breakdown'   => $statusBreakdown,
            'since'              => $since?->toDateString(),
            'until'              => now()->toDateString(),
        ]);
    }

    public function show(string $slug)
    {
        $company = Company::with(['score', 'subscription'])
            ->where('slug', $slug)
            ->firstOrFail();

        return response()->json($company);
    }
}
