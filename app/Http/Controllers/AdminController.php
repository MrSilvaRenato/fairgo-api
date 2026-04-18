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
            'open_complaints'  => Complaint::where('status', 'open')->count(),
            'resolved'         => Complaint::where('status', 'resolved')->count(),
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

        if ($request->q) {
            $query->where('description', 'like', "%{$request->q}%");
        }

        return response()->json($query->paginate(20));
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
            ->latest();

        if ($request->q) {
            $query->where('name', 'like', "%{$request->q}%");
        }

        return response()->json($query->paginate(20));
    }

    // PUT /admin/companies/{company}
    public function updateCompany(Request $request, Company $company)
    {
        $data = $request->validate([
            'claimed' => 'sometimes|boolean',
        ]);

        $company->update($data);

        return response()->json($company->fresh(['score', 'subscription']));
    }

    // GET /admin/users
    public function users(Request $request)
    {
        $query = User::with('company:id,name,slug')
            ->latest();

        if ($request->q) {
            $query->where('email', 'like', "%{$request->q}%")
                  ->orWhere('name', 'like', "%{$request->q}%");
        }

        return response()->json($query->paginate(20));
    }
}
