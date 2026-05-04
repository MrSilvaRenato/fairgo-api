<?php

namespace App\Http\Controllers;

use App\Jobs\CalculateCompanyScore;
use App\Jobs\ModerateComplaint;
use App\Models\AppNotification;
use App\Models\Company;
use App\Models\Complaint;
use App\Models\ComplaintAttachment;
use App\Notifications\ComplaintFiledConsumer;
use App\Notifications\ComplaintFiledCompany;
use App\Services\AbnLookupService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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
        $todayCount = Complaint::where('consumer_id', $user->id)
            ->whereDate('created_at', today())
            ->count();

        if ($todayCount >= 5) {
            return response()->json([
                'message' => 'You have reached the limit of 5 complaints per day. Please try again tomorrow.',
                'error_code' => 'daily_limit_reached',
            ], 429);
        }

        // Must supply either an existing company_id or an ABN to look up
        if (empty($request->company_id) && empty($request->company_abn)) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors'  => ['company_abn' => ['Please select a company or provide an ABN.']],
            ], 422);
        }

        $data = $request->validate([
            'company_id'          => 'nullable|exists:companies,id',
            'company_name'        => 'nullable|string|max:255',
            'company_abn'         => 'nullable|string|max:14',
            'title'               => 'required|string|max:255',
            'description'         => 'required|string|max:5000',
            'expected_resolution' => 'nullable|string|max:1000',
            'category'            => 'required|in:billing,delivery,service,refund,fraud,other',
            'is_public'           => 'boolean',
            'incident_date'       => 'required|date|before_or_equal:today',
            'reference_number'    => 'nullable|string|max:120',
            'amount_involved'     => 'nullable|numeric|min:0|max:9999999',
            'contact_attempted'   => 'boolean',
            'phone'               => 'nullable|string|max:30',
            'attachments'         => 'nullable|array|max:5',
            'attachments.*'       => 'file|mimes:jpeg,jpg,png,gif,webp,pdf|max:10240',
        ]);

        // ── Unregistered company path ────────────────────────────────────────
        if (empty($data['company_id']) && !empty($data['company_abn'])) {
            $abn    = preg_replace('/\s+/', '', $data['company_abn']);
            $result = $abnService->lookup($abn);

            if (!$result['valid']) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors'  => ['company_abn' => ['ABN of this company is wrong.']],
                ], 422);
            }

            // If an existing (non-stub) company already has this ABN, use it directly
            // — prevents duplicate stubs when user picks an ABR result for a company
            // that's already registered on the platform.
            $existing = Company::where('abn', $abn)->where('is_stub', false)->first();
            if ($existing) {
                $data['company_id'] = $existing->id;
            } else {
                // Use ABR authoritative name when available; fall back to user-supplied
                // name; if still nothing, use the formatted ABN as a readable placeholder.
                $entityName = $result['entity_name'] ?? $data['company_name'] ?? null;
                if (!$entityName) {
                    $entityName = implode(' ', [
                        substr($abn, 0, 2),
                        substr($abn, 2, 3),
                        substr($abn, 5, 3),
                        substr($abn, 8, 3),
                    ]);
                }

                $company = Company::firstOrCreate(
                    ['abn' => $abn, 'is_stub' => true],
                    [
                        'name'            => $entityName,
                        'slug'            => Str::slug($entityName) . '-' . substr($abn, -4),
                        'abn_entity_name' => $result['entity_name'] ?? null,
                        'abn_verified'    => true,
                        'is_stub'         => true,
                        'claimed'         => false,
                    ]
                );

                $data['company_id'] = $company->id;
            }
        }

        $complaint = Complaint::create([
            'consumer_id'       => $user->id,
            'company_id'        => $data['company_id'],
            'title'             => $data['title'],
            'description'       => $data['description'],
            'expected_resolution' => $data['expected_resolution'] ?? null,
            'category'          => $data['category'],
            'is_public'         => Company::find($data['company_id'])?->is_stub ? false : ($data['is_public'] ?? true),
            'status'            => 'open',
            'expires_at'        => now()->addDays(7),
            'moderation_status' => 'pending',
            'incident_date'     => $data['incident_date'],
            'reference_number'  => $data['reference_number'] ?? null,
            'amount_involved'   => $data['amount_involved'] ?? null,
            'contact_attempted' => $data['contact_attempted'] ?? false,
            'phone'             => $data['phone'] ?? null,
        ]);

        // ── Store attachments ────────────────────────────────────────────────
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $dir  = "complaint-attachments/{$complaint->id}";
                $stored = $file->store($dir, 'public');

                ComplaintAttachment::create([
                    'complaint_id'  => $complaint->id,
                    'original_name' => $file->getClientOriginalName(),
                    'stored_name'   => basename($stored),
                    'mime_type'     => $file->getMimeType(),
                    'size'          => $file->getSize(),
                    'path'          => $stored,
                ]);
            }
        }

        $complaint->load(['consumer:id,name,email', 'company:id,name,slug,logo_url,website,user_id', 'company.user:id,name,email']);

        CalculateCompanyScore::dispatch($complaint->company_id);

        ModerateComplaint::dispatchSync($complaint->id);
        $complaint->refresh();

        $companyUser = $complaint->company->user;
        if (in_array($complaint->moderation_status, ['approved', 'edited', null])) {
            $user->notify(new ComplaintFiledConsumer($complaint));
            if ($companyUser) {
                $companyUser->notify(new ComplaintFiledCompany($complaint));
                AppNotification::notify(
                    $companyUser->id,
                    'new_complaint',
                    'New complaint filed against your company',
                    \Str::limit($complaint->title, 100),
                    "/complaints/{$complaint->id}"
                );
            }
        } else {
            $user->notify(new ComplaintFiledConsumer($complaint));
        }

$isCompanyUnderReview = $complaint->company?->is_stub === true;

$message = $isCompanyUnderReview
    ? 'Your complaint has been submitted. This company is not yet registered on Aus Fair Go, so your complaint will remain private until our team verifies the company details against ABN Lookup Australia.'
    : 'Your complaint has been submitted successfully.';

return response()->json(
    array_merge(
        $complaint->load(['consumer:id,name', 'company:id,name,slug,logo_url,website'])->toArray(),
        [
            'moderation_status' => $complaint->moderation_status,
            'message' => $message,
            'company_under_review' => $isCompanyUnderReview,
        ]
    ),
    201
);
    }

    public function show(Complaint $complaint)
    {
        $user      = auth('sanctum')->user();
        $isOwner   = $user && $user->id === $complaint->consumer_id;
        $isAdmin   = $user && $user->role === 'admin';
        $isCompany = $user && $user->role === 'company_admin' && $user->company?->id === $complaint->company_id;
        if ($complaint->company?->is_stub && !$isOwner && !$isAdmin) {
    abort(403);
}

        $underReview = in_array($complaint->moderation_status, ['flagged', 'rejected']);
        if ($underReview && !$isOwner && !$isAdmin) {
            abort(403);
        }

        if (!$complaint->is_public && !$underReview && !$isOwner && !$isAdmin && !$isCompany) {
            abort(403);
        }

        // Base relations for everyone
        $relations = ['consumer:id,name,phone_verified_at', 'company:id,name,slug,logo_url,website,claimed,abn_verified,verified_badge', 'response', 'feedback.consumer:id,name', 'replies.user:id,name,role', 'attachments'];
        $complaint->load($relations);

        $data = $complaint->toArray();

        // Private consumer contact details — for the consumer owner, the owning company, and admins
        if ($isOwner || $isCompany || $isAdmin) {
            $consumer = $complaint->consumer()->first(['id', 'name', 'email', 'phone']);
            $data['consumer_contact'] = [
                'name'  => $consumer->name,
                'email' => $consumer->email,
                'phone' => $consumer->phone ?? $complaint->phone,
            ];
        }

        return response()->json($data);
    }

    public function categoryCounts(Request $request)
    {
        $base = Complaint::where('is_public', true)
            ->where('status', '!=', 'removed')
            ->whereNotIn('moderation_status', ['flagged', 'rejected']);

        // Category counts — optionally scoped to a status
        $catQuery = clone $base;
        if ($request->status) $catQuery->where('status', $request->status);
        $category = $catQuery->selectRaw('category, count(*) as total')
            ->groupBy('category')
            ->pluck('total', 'category');

        // Status counts — optionally scoped to a category
        $stQuery = clone $base;
        if ($request->category) $stQuery->where('category', $request->category);
        $status = $stQuery->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return response()->json(compact('category', 'status'));
    }

    public function index(Request $request)
    {
        $query = Complaint::with(['consumer:id,name,phone_verified_at', 'company:id,name,slug,logo_url,website', 'feedback:id,complaint_id,rating,would_deal_again'])
            ->where('is_public', true)
            ->where('status', '!=', 'removed')
            ->whereNotIn('moderation_status', ['flagged', 'rejected'])
            ->latest('updated_at');

        if ($request->company_id) {
            $query->where('company_id', $request->company_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->category) {
            $query->where('category', $request->category);
        }

        if ($request->q) {
            $q = $request->q;
            $query->where(function ($sub) use ($q) {
                $sub->where('title', 'like', "%{$q}%")
                    ->orWhereHas('company', fn ($c) => $c->where('name', 'like', "%{$q}%"));
            });
        }

        $perPage = min((int) ($request->per_page ?? 15), 50);

        return response()->json($query->paginate($perPage));
    }
}
