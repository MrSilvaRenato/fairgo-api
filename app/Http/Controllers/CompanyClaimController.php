<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\CompanyClaim;
use App\Models\Subscription;
use App\Notifications\ClaimApproved;
use App\Notifications\ClaimRejected;
use App\Services\AbnLookupService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class CompanyClaimController extends Controller
{
    /**
     * Submit a new claim — requires auth.
     */
    public function store(Request $request, Company $company, AbnLookupService $abnService)
    {
        $user = $request->user();

        // Block if company already claimed
        if ($company->claimed) {
            return response()->json(['message' => 'This company has already been claimed.'], 409);
        }

        // One pending/approved claim per user per company
        $existing = CompanyClaim::where('company_id', $company->id)
            ->where('user_id', $user->id)
            ->whereIn('status', ['pending', 'approved'])
            ->first();

        if ($existing) {
            return response()->json([
                'message' => $existing->status === 'approved'
                    ? 'This company has already been claimed.'
                    : 'You already have a pending claim for this company. We will notify you once it is reviewed.',
            ], 409);
        }

        $validated = $request->validate([
            'claimant_name'     => 'required|string|max:120',
            'claimant_email'    => 'required|email|max:200',
            'claimant_position' => 'required|string|max:120',
            'claimant_phone'    => 'required|string|max:30',
            'abn_confirmation'  => 'required|string',
            'proof_type'        => ['required', Rule::in(['asic_extract', 'business_card', 'employment_contract', 'director_certificate', 'other'])],
            'proof_document'    => 'nullable|file|mimes:pdf,jpg,jpeg,png,docx|max:5120',
            'message'           => 'required|string|min:30|max:1000',
        ]);

        // Verify submitted ABN is real via the ABR
        $submittedAbn = preg_replace('/\D/', '', $validated['abn_confirmation']);

        if (!$abnService->validateChecksum($submittedAbn)) {
            return response()->json([
                'message' => 'The ABN you entered is not valid.',
                'errors'  => ['abn_confirmation' => ['Invalid ABN format.']],
            ], 422);
        }

        try {
            $abnData = $abnService->lookup($submittedAbn);
        } catch (\Throwable) {
            $abnData = null;
        }

        if (!$abnData) {
            return response()->json([
                'message' => 'The ABN you entered could not be verified with the Australian Business Register. Please check and try again.',
                'errors'  => ['abn_confirmation' => ['ABN not found in the ABR.']],
            ], 422);
        }

        // For stub companies (fake ABN), update with the real verified ABN
        // For claimed companies this won't run (blocked above), but for stubs
        // we store the real ABN so future claims are also verified correctly
        $storedAbn = preg_replace('/\D/', '', $company->abn ?? '');
        if ($storedAbn !== $submittedAbn) {
            // If already claimed by someone else with a verified ABN — must match exactly
            if ($company->claimed && $company->abn_verified) {
                return response()->json([
                    'message' => 'The ABN you entered does not match our records for this company.',
                    'errors'  => ['abn_confirmation' => ['ABN does not match.']],
                ], 422);
            }
            // Unclaimed/stub company — replace fake ABN with the real verified one
            $company->update(['abn' => $submittedAbn, 'abn_verified' => true]);
        }

        // Store proof document if provided
        $proofPath = null;
        if ($request->hasFile('proof_document')) {
            $proofPath = $request->file('proof_document')->store('claim-documents', 'public');
        }

        // Auto-detect domain match between claimant email and company website
        $domainMatch = null;
        if ($company->website) {
            $emailParts  = explode('@', $validated['claimant_email']);
            $emailDomain = isset($emailParts[1]) ? strtolower(preg_replace('/^www\./i', '', $emailParts[1])) : null;
            $parsed      = parse_url($company->website);
            $siteDomain  = strtolower(preg_replace('/^www\./i', '', $parsed['host'] ?? $company->website));
            $domainMatch = ($emailDomain && $siteDomain && $emailDomain === $siteDomain);
        }

        $claimData = $validated;
        unset($claimData['proof_document']);

        $claim = CompanyClaim::create(array_merge($claimData, [
            'company_id'     => $company->id,
            'user_id'        => $user->id,
            'status'         => 'pending',
            'proof_document' => $proofPath,
            'domain_match'   => $domainMatch,
        ]));

        return response()->json([
            'message' => 'Your claim has been submitted. Our team will review it and you will be notified in your dashboard within 2 business days.',
            'claim'   => ['id' => $claim->id, 'status' => $claim->status],
        ], 201);
    }

    /**
     * List all claims — admin only.
     */
    public function index(Request $request)
    {
        $status = $request->query('status', 'pending');

        $claims = CompanyClaim::with(['company', 'claimant:id,name,email'])
            ->when($status !== 'all', fn($q) => $q->where('status', $status))
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($claims);
    }

    /**
     * Approve a claim — admin only.
     * Links the company to the claimant's user account and upgrades their role.
     */
    public function approve(Request $request, CompanyClaim $claim)
    {
        if ($claim->status !== 'pending') {
            return response()->json(['message' => 'Claim is not pending.'], 409);
        }

        $claim->update([
            'status'      => 'approved',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        $company = $claim->company;

        // Always resolve the target user by claimant_email — more reliable than user_id
        // (user_id could be the admin if the claim was submitted while logged in as admin)
        $targetUser = \App\Models\User::where('email', $claim->claimant_email)->first();

        // Fall back to the stored user_id only if email lookup fails and it's not admin
        if (!$targetUser && $claim->user_id) {
            $u = $claim->claimant;
            $targetUser = ($u && $u->role !== 'admin') ? $u : null;
        }

        // Link company to the target user
        $company->update([
            'claimed'  => true,
            'user_id'  => $targetUser?->id,
            'is_stub'  => false,
        ]);

        // Upgrade role to company_admin (never touch admin accounts)
        if ($targetUser && $targetUser->role !== 'admin') {
            $targetUser->update(['role' => 'company_admin']);
        }

        // Also update claim's user_id to the correct user for dashboard notifications
        if ($targetUser && $claim->user_id !== $targetUser->id) {
            $claim->update(['user_id' => $targetUser->id]);
        }

        // Seed free subscription if none exists
        if ($targetUser && !$company->fresh()->subscription) {
            Subscription::create([
                'company_id' => $company->id,
                'plan'       => 'free',
                'status'     => 'active',
            ]);
        }

        // Notify claimant by email
        try {
            $notifyUser = $targetUser ?? \App\Models\User::where('email', $claim->claimant_email)->first();
            if ($notifyUser) {
                $notifyUser->notify(new ClaimApproved($claim->load('company')));
            }
        } catch (\Throwable) {}

        return response()->json([
            'message' => 'Claim approved. The user now has access to the company dashboard.',
            'claim'   => $claim->fresh('company', 'claimant'),
        ]);
    }

    /**
     * Reject a claim — admin only.
     */
    public function reject(Request $request, CompanyClaim $claim)
    {
        $request->validate([
            'rejection_reason' => 'required|string|min:10|max:500',
        ]);

        if ($claim->status !== 'pending') {
            return response()->json(['message' => 'Claim is not pending.'], 409);
        }

        $claim->update([
            'status'           => 'rejected',
            'reviewed_by'      => $request->user()->id,
            'reviewed_at'      => now(),
            'rejection_reason' => $request->input('rejection_reason'),
        ]);

        // Notify claimant by email
        try {
            $notifyUser = \App\Models\User::where('email', $claim->claimant_email)->first();
            if ($notifyUser) {
                $notifyUser->notify(new ClaimRejected($claim->load('company')));
            }
        } catch (\Throwable) {}

        return response()->json(['message' => 'Claim rejected.', 'claim' => $claim->fresh()]);
    }
}
