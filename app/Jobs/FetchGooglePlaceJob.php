<?php

namespace App\Jobs;

use App\Models\Company;
use App\Models\GooglePlaceSnapshot;
use App\Services\GooglePlacesService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class FetchGooglePlaceJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 2;
    public int $timeout = 30;

    public function __construct(private int $companyId) {}

    public function handle(GooglePlacesService $places): void
    {
        $company = Company::find($this->companyId);
        if (!$company) {
            return;
        }

        // Skip if a fresh snapshot already exists (another job may have run)
        $existing = GooglePlaceSnapshot::where('company_id', $company->id)->first();
        if ($existing && !$existing->isStale()) {
            return;
        }

        if (!$places->isConfigured()) {
            Log::info('[GooglePlaces] API key not configured — skipping', ['company' => $company->name]);
            return;
        }

        $data = $places->fetchForCompany($company->name, $company->website);
        if (!$data) {
            return;
        }

        GooglePlaceSnapshot::updateOrCreate(
            ['company_id' => $company->id],
            array_merge($data, ['fetched_at' => now()])
        );
    }
}
