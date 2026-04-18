<?php

namespace App\Http\Controllers;

use App\Services\AbnLookupService;
use Illuminate\Http\Request;

class AbnVerificationController extends Controller
{
    // POST /company/abn/verify
    public function verify(Request $request, AbnLookupService $abn)
    {
        $company = $request->user()->company;

        if (!$company) {
            return response()->json(['message' => 'No company found.'], 404);
        }

        $result = $abn->lookup($company->abn);

        if ($result['valid']) {
            $company->update(['abn_verified' => true]);
        }

        return response()->json([
            'verified'    => $result['valid'],
            'entity_name' => $result['entity_name'] ?? null,
            'entity_type' => $result['entity_type'] ?? null,
            'status'      => $result['status'] ?? null,
            'stub'        => $result['stub'] ?? false,
            'error'       => $result['error'] ?? null,
        ]);
    }

    // GET /companies/{slug}/abn  — public check
    public function show(string $slug, AbnLookupService $abn)
    {
        $company = \App\Models\Company::where('slug', $slug)->firstOrFail();

        return response()->json([
            'abn'          => $company->abn,
            'abn_verified' => $company->abn_verified,
            'checksum_ok'  => $abn->validateChecksum($company->abn ?? ''),
        ]);
    }
}
