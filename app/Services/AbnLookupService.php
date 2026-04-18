<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Australian Business Register (ABR) lookup.
 *
 * Production: set ABN_LOOKUP_GUID in .env to your GUID from
 *   https://abr.business.gov.au/Tools/WebServicesAgreement
 *
 * Locally: set ABN_LOOKUP_GUID=fake — lookups validate ABN format only (checksum).
 */
class AbnLookupService
{
    private const ABR_URL = 'https://abr.business.gov.au/json/AbnDetails.aspx';

    public function lookup(string $abn): array
    {
        $abn  = preg_replace('/\s+/', '', $abn);
        $guid = config('services.abn_lookup.guid', 'fake');

        // Local stub — skip real API, just validate format
        if (!$guid || $guid === 'fake') {
            $valid = $this->validateChecksum($abn);
            return [
                'valid'       => $valid,
                'abn'         => $abn,
                'entity_name' => $valid ? 'ABN format valid (dev mode)' : null,
                'entity_type' => null,
                'state'       => null,
                'postcode'    => null,
                'status'      => $valid ? 'Active' : 'Invalid',
                'stub'        => true,
            ];
        }

        try {
            $response = Http::timeout(8)->get(self::ABR_URL, [
                'abn'      => $abn,
                'guid'     => $guid,
                'callback' => 'callback',
            ]);

            // ABR returns JSONP: callback({...}) — strip wrapper
            $body = preg_replace('/^callback\(/', '', $response->body());
            $body = rtrim($body, ')');
            $data = json_decode($body, true);

            if (!$data || isset($data['Message'])) {
                return ['valid' => false, 'abn' => $abn, 'error' => $data['Message'] ?? 'Lookup failed'];
            }

            $active = ($data['EntityStatusCode'] ?? '') === 'Active';

            return [
                'valid'       => $active,
                'abn'         => $abn,
                'entity_name' => $data['EntityName'] ?? null,
                'entity_type' => $data['EntityTypeName'] ?? null,
                'state'       => $data['StateCode'] ?? null,
                'postcode'    => $data['Postcode'] ?? null,
                'status'      => $data['EntityStatusCode'] ?? null,
            ];
        } catch (\Throwable $e) {
            Log::warning('ABN lookup failed: ' . $e->getMessage());
            return ['valid' => false, 'abn' => $abn, 'error' => 'Lookup service unavailable'];
        }
    }

    /**
     * ABN Modulus 89 checksum validation.
     */
    public function validateChecksum(string $abn): bool
    {
        if (!preg_match('/^\d{11}$/', $abn)) return false;

        $weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
        $digits  = str_split($abn);
        $digits[0] = (int)$digits[0] - 1;

        $sum = 0;
        foreach ($digits as $i => $d) {
            $sum += (int)$d * $weights[$i];
        }

        return $sum % 89 === 0;
    }
}
