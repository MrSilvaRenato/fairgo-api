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

        if (!$this->abn->validateChecksum($abn)) {
            return response()->json(['errors' => ['abn' => ['Invalid ABN.']]], 422);
        }

        // Strip protocol/trailing slashes so Clearbit gets a clean domain
        $website = isset($data['website']) ? preg_replace('#^https?://#', '', rtrim($data['website'], '/')) : null;

        // If an unclaimed company with this ABN already exists, claim it instead of creating a duplicate
        $existing = Company::where('abn', $abn)->where('claimed', false)->first();

        if ($existing) {
            $existing->update([
                'user_id'     => $request->user()->id,
                'name'        => $data['name'],
                'abn_verified'=> true,
                'industry'    => $data['industry'] ?? $existing->industry,
                'description' => $data['description'] ?? $existing->description,
                'website'     => $website ?? $existing->website,
                'logo_url'    => $website ? "https://logo.clearbit.com/{$website}" : $existing->logo_url,
                'claimed'     => true,
                'is_stub'     => false,
            ]);
            $company = $existing->fresh();
        } else {
            // Brand new company — check ABN not already claimed by someone else
            $claimed = Company::where('abn', $abn)->where('claimed', true)->first();
            if ($claimed) {
                return response()->json(['errors' => ['abn' => ['This ABN is already registered on Aus Fair Go.']]], 422);
            }

            $slug = Str::slug($data['name']);
            $base = $slug; $i = 1;
            while (Company::where('slug', $slug)->exists()) { $slug = "{$base}-{$i}"; $i++; }

            $company = Company::create([
                'user_id'     => $request->user()->id,
                'name'        => $data['name'],
                'slug'        => $slug,
                'abn'         => $abn,
                'abn_verified'=> true,
                'industry'    => $data['industry'] ?? null,
                'description' => $data['description'] ?? null,
                'website'     => $website,
                'logo_url'    => $website ? "https://logo.clearbit.com/{$website}" : null,
                'claimed'     => true,
            ]);
        }

        // Seed free subscription if none exists
        if (!$company->subscription) {
            Subscription::create([
                'company_id' => $company->id,
                'plan'       => 'free',
                'status'     => 'active',
            ]);
        }

        // Only update role if not already admin
        if ($request->user()->role !== 'admin') {
            $request->user()->update(['role' => 'company_admin']);
        }

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
        $query = Company::with('score')->select('id', 'name', 'slug', 'industry', 'website', 'logo_url', 'claimed');

        if ($request->filled('q')) {
            $query->where('name', 'like', '%' . $request->q . '%');
        }

        if ($request->boolean('claimed')) {
            $query->where('claimed', true);
        }

        $companies = $query->orderBy('name')->limit(20)->get()
            ->map(fn($c) => [
                'id'       => $c->id,
                'name'     => $c->name,
                'slug'     => $c->slug,
                'industry' => $c->industry,
                'website'  => $c->website,
                'logo_url' => $c->logo_url,
                'claimed'  => (bool) $c->claimed,
                'score'    => round($c->score?->score ?? 0, 1),
                'badge'    => $c->score?->badge ?? 'not_rated',
                'total'    => $c->score?->total_complaints ?? 0,
            ]);

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
