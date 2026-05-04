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
    private const ABR_URL       = 'https://abr.business.gov.au/json/AbnDetails.aspx';
    private const ABR_NAMES_URL = 'https://abr.business.gov.au/json/MatchingNames.aspx';

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
                'entity_name' => null, // real name requires a valid GUID from abr.business.gov.au
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

            // ABR always includes "Message": "" on success — only treat non-empty Message as an error
            if (!$data || !empty($data['Message'])) {
                return ['valid' => false, 'abn' => $abn, 'error' => $data['Message'] ?? 'Lookup failed'];
            }

            // ABR uses both text ("Active") and numeric ("0000000001") status codes depending on entity type
            $statusCode = $data['EntityStatusCode'] ?? $data['AbnStatus'] ?? '';
            $active = in_array($statusCode, ['Active', '0000000001'], true);

            return [
                'valid'       => $active,
                'abn'         => $abn,
                'entity_name' => $data['EntityName'] ?? null,
                'entity_type' => $data['EntityTypeName'] ?? null,
                'state'       => $data['StateCode'] ?? ($data['AddressState'] ?? null),
                'postcode'    => $data['Postcode'] ?? ($data['AddressPostcode'] ?? null),
                'status'      => $statusCode ?: null,
            ];
        } catch (\Throwable $e) {
            Log::warning('ABN lookup failed: ' . $e->getMessage());
            return ['valid' => false, 'abn' => $abn, 'error' => 'Lookup service unavailable'];
        }
    }

    /**
     * Search Australian Business Register by entity name.
     * Returns up to 10 active matching businesses.
     */
    public function searchByName(string $name): array
    {
        $guid = config('services.abn_lookup.guid', 'fake');

        if (!$guid || $guid === 'fake') {
            return ['results' => [], 'stub' => true];
        }

        try {
            $response = Http::timeout(8)->get(self::ABR_NAMES_URL, [
                'name' => $name,
                'guid' => $guid,
            ]);

            $body = preg_replace('/^callback\(/', '', $response->body());
            $body = rtrim($body, ')');
            $data = json_decode($body, true);

            // ABR uses numeric status codes: 0000000001 = Active, 0000000002 = Cancelled
            $results = collect($data['Names'] ?? [])
                ->filter(fn($n) => ($n['AbnStatus'] ?? '') === '0000000001')
                ->map(fn($n) => [
                    'abn'      => $n['Abn'],
                    'name'     => $n['Name'],
                    'state'    => $n['State'] ?? null,
                    'postcode' => $n['Postcode'] ?? null,
                    'score'    => $n['Score'] ?? 0,
                ])
                ->sortByDesc('score')
                ->take(10)
                ->values()
                ->toArray();

            return ['results' => $results, 'stub' => false];
        } catch (\Throwable $e) {
            Log::warning('ABN name search failed: ' . $e->getMessage());
            return ['results' => [], 'error' => 'Search unavailable'];
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
