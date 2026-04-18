<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class AbnLookupService
{
    public function lookup(string $abn): ?array
    {
        $abn = preg_replace('/\s+/', '', $abn);

        if (!$this->isValidAbn($abn)) {
            return null;
        }

        $guid = config('services.abr.guid');

        if (!$guid) {
            // No GUID configured — return format-validated stub
            return ['abn' => $abn, 'name' => null, 'type' => null, 'state' => null, 'postcode' => null, 'status' => 'Active'];
        }

        try {
            $response = Http::timeout(5)->get(
                'https://abr.business.gov.au/json/AbnDetails.aspx',
                ['abn' => $abn, 'guid' => $guid, 'callback' => 'c']
            );

            $json = preg_replace('/^c\((.*)\);?$/s', '$1', trim($response->body()));
            $data = json_decode($json, true);

            if (!$data || !empty($data['Message']) || empty($data['EntityName'])) {
                return null;
            }

            return [
                'abn'      => $abn,
                'name'     => $data['EntityName'],
                'type'     => $data['EntityTypeName'] ?? null,
                'state'    => $data['AddressState'] ?? null,
                'postcode' => $data['AddressPostcode'] ?? null,
                'status'   => $data['AbnStatus'] ?? null,
            ];
        } catch (\Throwable) {
            return null;
        }
    }

    public function isValidAbn(string $abn): bool
    {
        $abn = preg_replace('/\s+/', '', $abn);

        if (!preg_match('/^\d{11}$/', $abn)) {
            return false;
        }

        $weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
        $digits  = str_split($abn);
        $digits[0] = (int)$digits[0] - 1;

        $sum = 0;
        foreach ($weights as $i => $w) {
            $sum += (int)$digits[$i] * $w;
        }

        return $sum % 89 === 0;
    }
}
