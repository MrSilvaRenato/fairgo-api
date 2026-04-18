<?php

namespace App\Http\Controllers;

use App\Models\Company;
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
        ]);
    }

    // GET /admin/complaints
    public function complaints(Request $request)
    {
        $query = Complaint::with(['consumer:id,name,email', 'company:id,name,slug'])
            ->latest();

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->moderation_status) {
            $query->where('moderation_status', $request->moderation_status);
        }

        if ($request->q) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', "%{$request->q}%")
                  ->orWhere('description', 'like', "%{$request->q}%");
            });
        }

        return response()->json($query->paginate(25));
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
            ->withCount('complaints')
            ->latest();

        if ($request->q) {
            $query->where('name', 'like', "%{$request->q}%");
        }

        if ($request->filter === 'verified') {
            $query->where('verified_badge', true);
        } elseif ($request->filter === 'flagged') {
            $query->where('not_recommended', true);
        }

        return response()->json($query->paginate(25));
    }

    // PUT /admin/companies/{company}
    public function updateCompany(Request $request, Company $company)
    {
        $data = $request->validate([
            'claimed'         => 'sometimes|boolean',
            'verified_badge'  => 'sometimes|boolean',
            'not_recommended' => 'sometimes|boolean',
        ]);

        $company->update($data);

        return response()->json($company->fresh(['score', 'subscription']));
    }

    // GET /admin/users
    public function users(Request $request)
    {
        $query = User::with('company:id,name,slug')
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

        $query = Complaint::with(['consumer:id,name,email', 'company:id,name,slug'])
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

        $update = [
            'moderation_status' => $data['action'],
            'moderation_note'   => $data['note'] ?? $complaint->moderation_note,
        ];

        if ($data['action'] === 'rejected') {
            $update['is_public'] = false;
        }

        $complaint->update($update);

        return response()->json($complaint->fresh(['consumer:id,name,email', 'company:id,name,slug']));
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
}
