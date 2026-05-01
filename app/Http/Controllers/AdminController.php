<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\CompanyClaim;
use App\Models\Complaint;
use App\Models\User;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    // GET /admin/stats
    public function stats()
    {
        return response()->json([
            'total_users'      => User::count(),
            'total_companies'  => Company::count(),
            'total_complaints' => Complaint::count(),
            'open_complaints'  => Complaint::whereIn('status', ['open', 'awaiting_response'])->count(),
            'resolved'         => Complaint::where('status', 'resolved')->count(),
            'unresolved'       => Complaint::where('status', 'unresolved')->count(),
            'removed'          => Complaint::where('status', 'removed')->count(),
            'verified_companies' => Company::where('verified_badge', true)->count(),
            'flagged_companies'    => Company::where('not_recommended', true)->count(),
            'moderation_pending'   => Complaint::where('moderation_status', 'pending')->count(),
            'moderation_flagged'   => Complaint::where('moderation_status', 'flagged')->count(),
            'moderation_rejected'  => Complaint::where('moderation_status', 'rejected')->count(),
            'stub_companies' => Company::where('is_stub', true)->where('not_recommended', false)->count(),
            'pending_claims'          => CompanyClaim::where('status', 'pending')->count(),
            'pending_id_verifications' => User::where('id_verification_status', 'pending')->count(),
        ]);
    }

    // GET /admin/complaints
    public function complaintCategoryCounts(Request $request)
    {
        $base = Complaint::query();
        if ($request->moderation_status) $base->where('moderation_status', $request->moderation_status);

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

    public function complaints(Request $request)
    {
        $query = Complaint::with(['consumer:id,name,email', 'company:id,name,slug,logo_url,website', 'feedback:id,complaint_id,rating,would_deal_again']);

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->moderation_status) {
            $query->where('moderation_status', $request->moderation_status);
        }

        if ($request->category) {
            $query->where('category', $request->category);
        }

        if ($request->q) {
            $search = $request->q;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('company',  fn ($c) => $c->where('name',  'like', "%{$search}%"))
                  ->orWhereHas('consumer', fn ($u) => $u->where('name',  'like', "%{$search}%")
                                                         ->orWhere('email', 'like', "%{$search}%"));
            });
        }

        $request->sort === 'oldest' ? $query->oldest('updated_at') : $query->latest('updated_at');

        $perPage = min((int) ($request->per_page ?? 25), 100);

        return response()->json($query->paginate($perPage));
    }

    // PUT /admin/complaints/{complaint}
    public function updateComplaint(Request $request, Complaint $complaint)
    {
        $data = $request->validate([
            'status'    => 'sometimes|in:open,responded,resolved,unresolved,removed',
            'is_public' => 'sometimes|boolean',
        ]);

        $complaint->update($data);

        return response()->json($complaint->fresh());
    }

    // GET /admin/companies
    public function companies(Request $request)
    {
        $query = Company::with(['user:id,name,email', 'score', 'subscription'])
            ->withCount('complaints');

        if ($request->q) {
            $query->where('name', 'like', "%{$request->q}%");
        }

        if ($request->filter === 'verified') {
            $query->where('verified_badge', true);
        } elseif ($request->filter === 'flagged') {
            $query->where('not_recommended', true);
        }

        match ($request->sort) {
            'name'       => $query->orderBy('name'),
            'name_desc'  => $query->orderByDesc('name'),
            'complaints' => $query->orderByDesc('complaints_count'),
            'score'      => $query->orderByDesc(
                \App\Models\CompanyScore::select('score')
                    ->whereColumn('company_id', 'companies.id')
                    ->limit(1)
            ),
            default      => $query->latest(),
        };

        return response()->json($query->paginate(25));
    }

    // PUT /admin/companies/{company}
    public function updateCompany(Request $request, Company $company)
    {
        $data = $request->validate([
            'claimed'          => 'sometimes|boolean',
            'verified_badge'   => 'sometimes|boolean',
            'not_recommended'  => 'sometimes|boolean',
            'name'             => 'sometimes|string|max:255',
            'abn_entity_name'  => 'sometimes|nullable|string|max:255',
        ]);

        // Regenerate slug when admin renames a stub company
        if (isset($data['name']) && $company->is_stub) {
            $data['slug'] = \Illuminate\Support\Str::slug($data['name']) . '-' . substr($company->abn ?? '', -4);
        }

        $company->update($data);

        return response()->json($company->fresh(['score', 'subscription']));
    }

    // GET /admin/users
    public function users(Request $request)
    {
        $query = User::with('company:id,name,slug,logo_url,website')
            ->withCount('complaints')
            ->latest();

        if ($request->q) {
            $query->where(function ($q) use ($request) {
                $q->where('email', 'like', "%{$request->q}%")
                  ->orWhere('name', 'like', "%{$request->q}%");
            });
        }

        if ($request->role) {
            $query->where('role', $request->role);
        }

        return response()->json($query->paginate(25));
    }

    // GET /admin/moderation — complaints pending/flagged moderation review
    public function moderationQueue(Request $request)
    {
        $status = $request->get('status', 'flagged'); // flagged | pending | rejected | edited

        $query = Complaint::with(['consumer:id,name,email', 'company:id,name,slug,logo_url,website'])
            ->where('moderation_status', $status)
            ->latest();

        if ($request->q) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', "%{$request->q}%")
                  ->orWhere('description', 'like', "%{$request->q}%");
            });
        }

        return response()->json($query->paginate(25));
    }

    // PUT /admin/moderation/{complaint} — admin approves/rejects a flagged complaint
    public function moderationDecision(Request $request, Complaint $complaint)
    {
        $data = $request->validate([
            'action' => 'required|in:approved,rejected',
            'note'   => 'nullable|string|max:500',
        ]);

        $note = $data['note'] ?? $complaint->moderation_note;

        if ($data['action'] === 'approved') {
            // Clear for publication — restore visibility
            $complaint->update([
                'moderation_status' => 'approved',
                'moderation_note'   => $note,
                'is_public'         => true,
            ]);

            // Recalculate score now it's public
            \App\Jobs\CalculateCompanyScore::dispatch($complaint->company_id);

        } elseif ($data['action'] === 'rejected') {
            // Archive: mark removed, keep private, record reason
            $complaint->update([
                'moderation_status' => 'rejected',
                'moderation_note'   => $note,
                'is_public'         => false,
                'status'            => 'removed',
            ]);

            // Recalculate score — removed complaint should no longer affect it
            \App\Jobs\CalculateCompanyScore::dispatch($complaint->company_id);

            // Notify the consumer their complaint was removed
            $complaint->load('consumer', 'company:id,name');
            if ($complaint->consumer) {
                $complaint->consumer->notify(
                    new \App\Notifications\ComplaintRemovedConsumer($complaint, $note)
                );
            }
        }

        return response()->json($complaint->fresh(['consumer:id,name,email', 'company:id,name,slug,logo_url,website']));
    }

    // GET /admin/stub-companies — companies auto-created from unregistered complaints
    public function stubCompanies(Request $request)
    {
      $query = Company::where('is_stub', true)
    ->where('not_recommended', false)
    ->withCount('complaints')
    ->latest();

        if ($request->q) {
            $query->where('name', 'like', "%{$request->q}%");
        }

        return response()->json($query->paginate(25));
    }

    // POST /admin/stub-companies/{company}/promote — mark stub as a real registered company
 public function promoteStub(Request $request, Company $company)
{
    if (!$company->is_stub) {
        return response()->json(['message' => 'Company is already registered.'], 422);
    }

    $company->update([
        'is_stub' => false,
        'abn_verified' => true,
    ]);

    $complaints = Complaint::where('company_id', $company->id)
        ->where('status', '!=', 'removed')
        ->whereNotIn('moderation_status', ['flagged', 'rejected'])
        ->with('consumer:id,name,email')
        ->get();

    foreach ($complaints as $complaint) {
        $complaint->update([
            'is_public' => true,
            'moderation_status' => 'approved',
        ]);

        if ($complaint->consumer) {
            $complaint->consumer->notify(
                new \App\Notifications\ComplaintPublishedConsumer($complaint)
            );
        }
    }

    \App\Jobs\CalculateCompanyScore::dispatch($company->id);

    return response()->json($company->fresh()->loadCount('complaints'));
}

public function rejectStub(Request $request, Company $company)
{
    $data = $request->validate([
        'note' => 'nullable|string|max:500',
    ]);

    if (!$company->is_stub) {
        return response()->json(['message' => 'Only unregistered companies can be rejected.'], 422);
    }

    $note = $data['note'] ?? 'Company rejected by admin. Invalid or incorrect company/ABN submission.';

    $complaints = Complaint::where('company_id', $company->id)
        ->with('consumer:id,name,email')
        ->get();

    foreach ($complaints as $complaint) {
        $complaint->update([
            'is_public' => false,
            'moderation_status' => 'rejected',
            'status' => 'removed',
            'moderation_note' => $note,
        ]);

        if ($complaint->consumer) {
            $complaint->consumer->notify(
                new \App\Notifications\ComplaintRemovedConsumer($complaint, $note)
            );
        }
    }

    $company->update([
        'not_recommended' => true,
    ]);

    \App\Jobs\CalculateCompanyScore::dispatch($company->id);

    return response()->json([
        'message' => 'Company rejected and related complaints removed.',
        'company' => $company->fresh()->loadCount('complaints'),
    ]);
}

    // PUT /admin/users/{user}
    public function updateUser(Request $request, User $user)
    {
        $data = $request->validate([
            'banned' => 'sometimes|boolean',
            'role'   => 'sometimes|in:consumer,company_admin,admin',
        ]);

        // Prevent removing the last admin
        if (isset($data['role']) && $user->role === 'admin' && $data['role'] !== 'admin') {
            $adminCount = User::where('role', 'admin')->count();
            if ($adminCount <= 1) {
                return response()->json(['message' => 'Cannot demote the last admin.'], 422);
            }
        }

        $user->update($data);

        return response()->json($user->fresh('company'));
    }

    // GET /admin/id-verifications — list pending/all ID verification requests
    public function idVerifications(Request $request)
    {
        $status = $request->get('status', 'pending');

        $query = User::whereNotNull('id_verification_status')
            ->latest('updated_at');

        if ($status !== 'all') {
            $query->where('id_verification_status', $status);
        }

        return response()->json($query->paginate(25)->through(fn ($u) => [
            'id'                     => $u->id,
            'name'                   => $u->name,
            'email'                  => $u->email,
            'role'                   => $u->role,
            'id_verification_status' => $u->id_verification_status,
            'id_verified_at'         => $u->id_verified_at?->toISOString(),
            'id_rejection_note'      => $u->id_rejection_note,
            'has_document'           => (bool) $u->id_document_path,
            'submitted_at'           => $u->updated_at->toISOString(),
        ]));
    }

    // POST /admin/id-verifications/{user}/approve
    public function approveId(Request $request, User $user)
    {
        if (!$user->id_document_path) {
            return response()->json(['message' => 'No document submitted.'], 422);
        }

        $user->update([
            'id_verification_status' => 'approved',
            'id_verified_at'         => now(),
            'id_rejection_note'      => null,
        ]);

        $user->notify(new \App\Notifications\IdVerificationApproved());

        return response()->json(['message' => 'Verified.', 'user' => $user->fresh()]);
    }

    // POST /admin/id-verifications/{user}/reject
    public function rejectId(Request $request, User $user)
    {
        $data = $request->validate([
            'note' => 'nullable|string|max:500',
        ]);

        $note = $data['note'] ?? 'Your document could not be verified.';

        $user->update([
            'id_verification_status' => 'rejected',
            'id_verified_at'         => null,
            'id_rejection_note'      => $note,
        ]);

        $user->notify(new \App\Notifications\IdVerificationRejected($note));

        return response()->json(['message' => 'Rejected.', 'user' => $user->fresh()]);
    }
}
