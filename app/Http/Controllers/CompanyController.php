<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\CompanyClaim;
use App\Models\Complaint;
use App\Models\Subscription;
use App\Services\AbnLookupService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CompanyController extends Controller
{
    public function __construct(private AbnLookupService $abn) {}

    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'abn'               => 'required|string',
            'claimant_name'     => 'required|string|max:120',
            'claimant_email'    => 'required|email|max:200',
            'claimant_position' => 'required|string|max:120',
            'claimant_phone'    => 'required|string|max:30',
            'proof_type'        => ['required', Rule::in(['asic_extract', 'business_card', 'employment_contract', 'director_certificate', 'other'])],
            'proof_document'    => 'nullable|file|mimes:pdf,jpg,jpeg,png,docx|max:5120',
            'message'           => 'required|string|min:30|max:1000',
            'industry'          => 'nullable|string|max:100',
            'website'           => ['nullable', 'string', 'max:255', 'regex:/^(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/'],
        ]);

        $abn = preg_replace('/\s+/', '', $data['abn']);

        if (!$this->abn->validateChecksum($abn)) {
            return response()->json(['errors' => ['abn' => ['Invalid ABN format.']]], 422);
        }

        // Verify ABN is active against ABR
        $abnResult = $this->abn->lookup($abn);
        if (!$abnResult['valid']) {
            return response()->json(['errors' => ['abn' => ['This ABN could not be verified with the Australian Business Register.']]], 422);
        }

        // Block if already claimed by another user
        if (Company::where('abn', $abn)->where('claimed', true)->exists()) {
            return response()->json(['errors' => ['abn' => ['This ABN is already registered and managed on Aus Fair Go.']]], 422);
        }

        // Block duplicate pending claims from same user
        $existingClaim = CompanyClaim::whereHas('company', fn($q) => $q->where('abn', $abn))
            ->where('user_id', $user->id)
            ->whereIn('status', ['pending', 'approved'])
            ->first();

        if ($existingClaim) {
            return response()->json(['message' => 'You already have a pending application for this ABN.'], 409);
        }

        // Find or create stub company for this ABN
        $entityName = $abnResult['entity_name'] ?? null;
        $website    = isset($data['website']) ? preg_replace('#^https?://#', '', rtrim($data['website'], '/')) : null;

        $company = Company::where('abn', $abn)->first();
        if (!$company) {
            $slug = Str::slug($entityName ?? $abn);
            $base = $slug; $i = 1;
            while (Company::where('slug', $slug)->exists()) { $slug = "{$base}-{$i}"; $i++; }

            $company = Company::create([
                'name'         => $entityName ?? $abn,
                'slug'         => $slug,
                'abn'          => $abn,
                'abn_verified' => true,
                'abn_entity_name' => $entityName,
                'industry'     => $data['industry'] ?? null,
                'website'      => $website,
                'logo_url'     => $website ? "https://logo.clearbit.com/{$website}" : null,
                'is_stub'      => true,
                'claimed'      => false,
            ]);
        }

        // Store proof document on the private disk — served only to admins via authenticated route
        $proofPath = null;
        if ($request->hasFile('proof_document')) {
            $proofPath = $request->file('proof_document')->store('claim-documents', 'local');
        }

        // Auto-detect domain match between claimant email and company website
        $domainMatch = null;
        if ($company->website) {
            $emailParts  = explode('@', $data['claimant_email']);
            $emailDomain = isset($emailParts[1]) ? strtolower(preg_replace('/^www\./i', '', $emailParts[1])) : null;
            $parsed      = parse_url($company->website);
            $siteDomain  = strtolower(preg_replace('/^www\./i', '', $parsed['host'] ?? $company->website));
            $domainMatch = ($emailDomain && $siteDomain && $emailDomain === $siteDomain);
        }

        $claim = CompanyClaim::create([
            'company_id'        => $company->id,
            'user_id'           => $user->id,
            'claimant_name'     => $data['claimant_name'],
            'claimant_email'    => $data['claimant_email'],
            'claimant_position' => $data['claimant_position'],
            'claimant_phone'    => $data['claimant_phone'],
            'abn_confirmation'  => $abn,
            'proof_type'        => $data['proof_type'],
            'proof_document'    => $proofPath,
            'message'           => $data['message'],
            'status'            => 'pending',
            'domain_match'      => $domainMatch,
        ]);

        return response()->json([
            'message' => 'Your application has been submitted. Our team will review it within 2 business days and notify you by email.',
            'claim'   => ['id' => $claim->id, 'status' => 'pending'],
        ], 201);
    }

    public function updateSettings(Request $request)
    {
        if ($request->user()->role !== 'company_admin') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $company = $request->user()->company;

        if (!$company) {
            return response()->json(['message' => 'No company found.'], 404);
        }

        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'industry'    => 'nullable|string|max:100',
            'description' => 'nullable|string|max:1000',
            'website'     => 'nullable|string|max:255',
        ]);

        // Strip protocol so logo fetcher gets a clean domain
        if (!empty($data['website'])) {
            $data['website'] = preg_replace('#^https?://#', '', rtrim($data['website'], '/'));
        }

        $company->update($data);

        return response()->json($company->fresh());
    }

    public function uploadLogo(Request $request)
    {
        if ($request->user()->role !== 'company_admin') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $company = $request->user()->company;

        if (!$company) {
            return response()->json(['message' => 'No company found.'], 404);
        }

        $request->validate([
            'logo' => 'required|file|mimes:jpeg,jpg,png,gif,webp|max:2048',
        ]);

        // Delete old uploaded logo if it was stored locally
        if ($company->logo_url && str_contains($company->logo_url, '/storage/company-logos/')) {
            $oldPath = str_replace('/storage/', '', parse_url($company->logo_url, PHP_URL_PATH));
            Storage::disk('public')->delete($oldPath);
        }

        $file     = $request->file('logo');
        $mimeMap  = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif', 'image/webp' => 'webp'];
        $ext      = $mimeMap[$file->getMimeType()] ?? 'jpg';
        $filename = 'logo-' . Str::random(12) . '.' . $ext;
        $path     = $file->storeAs("company-logos/{$company->id}", $filename, 'public');

        $company->update(['logo_url' => '/storage/' . $path]);

        return response()->json(['logo_url' => $company->logo_url]);
    }

    public function lookupAbn(Request $request, string $abn)
    {
        $result = $this->abn->lookup($abn);

        if (!$result['valid']) {
            return response()->json(['message' => 'ABN not found or invalid.'], 404);
        }

        return response()->json([
            'valid'    => true,
            'abn'      => $result['abn'],
            'name'     => $result['entity_name'],
            'type'     => $result['entity_type'],
            'state'    => $result['state'],
            'postcode' => $result['postcode'],
            'status'   => 'Active',
        ]);
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

        $companies = $query->orderBy('name')->limit(200)->get()
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
