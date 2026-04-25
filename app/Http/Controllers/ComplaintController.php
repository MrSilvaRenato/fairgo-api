<?php

namespace App\Http\Controllers;

use App\Jobs\CalculateCompanyScore;
use App\Jobs\ModerateComplaint;
use App\Models\Company;
use App\Models\Complaint;
use App\Notifications\ComplaintFiledConsumer;
use App\Notifications\ComplaintFiledCompany;
use App\Services\AbnLookupService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ComplaintController extends Controller
{
    public function store(Request $request, AbnLookupService $abnService)
    {
        // Only consumers can file complaints — block business accounts and admins
        $user = $request->user();
        $role = $user->role;
        if ($role !== 'consumer') {
            return response()->json([
                'message' => $role === 'company_admin'
                    ? 'Business accounts cannot file complaints. Please use a personal consumer account.'
                    : 'You do not have permission to file complaints.',
            ], 403);
        }

        // Require verified email
        if (!$user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Please verify your email address before filing a complaint.',
                'error_code' => 'email_unverified',
            ], 403);
        }

        // Rate limit: 3 complaints per day per user
        $todayCount = \App\Models\Complaint::where('consumer_id', $user->id)
            ->whereDate('created_at', today())
            ->count();

        if ($todayCount >= 3) {
            return response()->json([
                'message' => 'You have reached the limit of 3 complaints per day. Please try again tomorrow.',
                'error_code' => 'daily_limit_reached',
            ], 429);
        }

        $data = $request->validate([
            'company_id'          => 'required_without:company_name|nullable|exists:companies,id',
            'company_name'        => 'required_without:company_id|nullable|string|max:255',
            'company_abn'         => 'required_with:company_name|nullable|string|max:14',
            'title'               => 'required|string|max:255',
            'description'         => 'required|string|max:5000',
            'expected_resolution' => 'nullable|string|max:1000',
            'category'            => 'required|in:billing,delivery,service,refund,fraud,other',
            'is_public'           => 'boolean',
            // Evidence fields
            'incident_date'       => 'required|date|before_or_equal:today',
            'reference_number'    => 'nullable|string|max:120',
            'amount_involved'     => 'nullable|numeric|min:0|max:9999999',
            'contact_attempted'   => 'boolean',
        ]);

        // ── Unregistered company path ────────────────────────────────────────
        if (empty($data['company_id']) && !empty($data['company_name'])) {
            $abn    = preg_replace('/\s+/', '', $data['company_abn']);
            $result = $abnService->lookup($abn);

            if (!$result['valid']) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors'  => ['company_abn' => ['ABN of this company is wrong.']],
                ], 422);
            }

            // Find existing stub or create one
            $company = Company::firstOrCreate(
                ['abn' => $abn, 'is_stub' => true],
                [
                    'name'            => $data['company_name'],
                    'slug'            => Str::slug($data['company_name']) . '-' . substr($abn, -4),
                    'abn_entity_name' => $result['entity_name'] ?? null,
                    'abn_verified'    => true,
                    'is_stub'         => true,
                    'claimed'         => false,
                ]
            );

            $data['company_id'] = $company->id;
        }

        $complaint = Complaint::create([
            ...$data,
            'consumer_id'       => $request->user()->id,
            'status'            => 'open',
            'is_public'         => $data['is_public'] ?? true,
            'expires_at'        => now()->addDays(7),
            'moderation_status' => 'pending',
            'contact_attempted' => $data['contact_attempted'] ?? false,
        ]);

        $complaint->load(['consumer:id,name,email', 'company:id,name,slug,user_id', 'company.user:id,name,email']);

        CalculateCompanyScore::dispatch($complaint->company_id);

        // Run moderation synchronously so we can return the result to the frontend
        // and decide whether to show the moderation hold screen
        ModerateComplaint::dispatchSync($complaint->id);
        $complaint->refresh();

        // Only notify company if complaint passed moderation (approved/edited)
        // Flagged complaints are hidden from company until admin reviews
        $companyUser = $complaint->company->user;
        if (in_array($complaint->moderation_status, ['approved', 'edited', null])) {
            $request->user()->notify(new ComplaintFiledConsumer($complaint));
            if ($companyUser) {
                $companyUser->notify(new ComplaintFiledCompany($complaint));
            }
        } else {
            // Still notify consumer their complaint was received (but under review)
            $request->user()->notify(new ComplaintFiledConsumer($complaint));
        }

        return response()->json(
            array_merge(
                $complaint->load(['consumer:id,name', 'company:id,name,slug'])->toArray(),
                ['moderation_status' => $complaint->moderation_status]
            ),
            201
        );
    }

    public function show(Complaint $complaint)
    {
        // Use optional Sanctum auth — authenticate from Bearer token if present,
        // but don't require it so public complaints remain accessible to guests.
        $user      = auth('sanctum')->user();
        $isOwner   = $user && $user->id === $complaint->consumer_id;
        $isAdmin   = $user && $user->role === 'admin';
        $isCompany = $user && $user->role === 'company_admin' && $user->company?->id === $complaint->company_id;

        // Flagged/rejected complaints are under admin review — only owner and admin can see them.
        // The company is intentionally excluded until the admin clears or rejects the complaint.
        $underReview = in_array($complaint->moderation_status, ['flagged', 'rejected']);
        if ($underReview && !$isOwner && !$isAdmin) {
            abort(403);
        }

        // Private complaints (not under review) are visible to owner, admin, and the relevant company.
        if (!$complaint->is_public && !$underReview && !$isOwner && !$isAdmin && !$isCompany) {
            abort(403);
        }

        return response()->json(
            $complaint->load(['consumer:id,name', 'company:id,name,slug', 'response', 'feedback', 'replies.user:id,name,role'])
        );
    }

    public function index(Request $request)
    {
        $query = Complaint::with(['consumer:id,name', 'company:id,name,slug'])
            ->where('is_public', true)
            ->where('status', '!=', 'removed')
            ->whereNotIn('moderation_status', ['flagged', 'rejected'])
            ->latest();

        if ($request->company_id) {
            $query->where('company_id', $request->company_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->category) {
            $query->where('category', $request->category);
        }

        return response()->json($query->paginate(15));
    }
}
