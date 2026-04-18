<?php

namespace App\Http\Controllers;

use App\Models\Company;
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

        $company = Company::create([
            'user_id'     => $request->user()->id,
            'name'        => $data['name'],
            'slug'        => $slug,
            'abn'         => $abn,
            'industry'    => $data['industry'] ?? null,
            'description' => $data['description'] ?? null,
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

    public function show(string $slug)
    {
        $company = Company::with(['score', 'subscription'])
            ->where('slug', $slug)
            ->firstOrFail();

        return response()->json($company);
    }
}
