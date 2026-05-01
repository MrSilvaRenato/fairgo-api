<?php

namespace App\Http\Controllers;

use App\Services\AbnLookupService;
use Illuminate\Http\Request;

class AbnSearchController extends Controller
{
    public function search(Request $request, AbnLookupService $abnService)
    {
        $q = trim($request->get('q', ''));

        if (strlen($q) < 2) {
            return response()->json(['results' => [], 'source' => 'none']);
        }

        // If query looks like an ABN (11 digits, optionally spaced) — lookup by ABN
        $digits = preg_replace('/\s+/', '', $q);
        if (preg_match('/^\d{11}$/', $digits)) {
            $result = $abnService->lookup($digits);
            if ($result['valid'] ?? false) {
                // Format ABN for display: XX XXX XXX XXX
                $formatted = implode(' ', [
                    substr($digits, 0, 2),
                    substr($digits, 2, 3),
                    substr($digits, 5, 3),
                    substr($digits, 8, 3),
                ]);
                return response()->json([
                    'results' => [[
                        'abn'      => $digits,
                        'name'     => $result['entity_name'] ?? null,
                        'state'    => $result['state'] ?? null,
                        'postcode' => $result['postcode'] ?? null,
                        'stub'     => $result['stub'] ?? false,
                    ]],
                    'source' => 'abn',
                    'stub'   => $result['stub'] ?? false,
                ]);
            }
            return response()->json(['results' => [], 'source' => 'abn']);
        }

        // Name search
        $result = $abnService->searchByName($q);

        return response()->json([
            'results' => $result['results'] ?? [],
            'source'  => 'name',
            'stub'    => $result['stub'] ?? false,
        ]);
    }
}
