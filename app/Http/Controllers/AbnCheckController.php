<?php

namespace App\Http\Controllers;

use App\Services\AbnLookupService;

class AbnCheckController extends Controller
{
    public function check(string $abn, AbnLookupService $abnService)
    {
        $abn    = preg_replace('/\s+/', '', $abn);
        $result = $abnService->lookup($abn);

        return response()->json([
            'valid'       => $result['valid'] ?? false,
            'abn'         => $abn,
            'entity_name' => $result['entity_name'] ?? null,
            'status'      => $result['status'] ?? null,
            'stub'        => $result['stub'] ?? false,
            'error'       => $result['error'] ?? null,
        ]);
    }
}
