<?php

namespace App\Services;

use App\Models\Company;
use App\Models\CompanyResponse;
use App\Models\Complaint;

class MonetisationGateService
{
    public function status(): array
    {
        $minimums = config('monetisation.minimums');
        $actuals = $this->actuals();

        $gates = collect($minimums)->map(fn($minimum, $key) => [
            'key' => $key,
            'minimum' => (int) $minimum,
            'actual' => $actuals[$key] ?? 0,
            'passed' => ($actuals[$key] ?? 0) >= (int) $minimum,
        ])->values()->all();

        $rules = collect(config('monetisation.rules'))->map(fn($enforced, $key) => [
            'key' => $key,
            'enforced' => (bool) $enforced,
        ])->values()->all();

        return [
            'launched' => collect($gates)->every('passed') && collect($rules)->every('enforced'),
            'gates' => $gates,
            'rules' => $rules,
        ];
    }

    public function launched(): bool
    {
        return $this->status()['launched'];
    }

    private function actuals(): array
    {
        return [
            'monthly_organic_traffic' => $this->configuredActual('monthly_organic_traffic'),
            'indexed_company_pages' => $this->configuredActual('indexed_company_pages') ?? $this->indexedCompanyPages(),
            'complaint_volume' => Complaint::where('is_public', true)->where('status', '!=', 'removed')->count(),
            'business_claim_response_activity' => Company::where('claimed', true)->count() + CompanyResponse::count(),
        ];
    }

    private function configuredActual(string $key): ?int
    {
        $value = config("monetisation.actuals.$key");

        return is_numeric($value) ? (int) $value : null;
    }

    private function indexedCompanyPages(): int
    {
        return Company::whereNotNull('slug')
            ->where(function ($query) {
                $query->where('is_stub', false)->orWhereNull('is_stub');
            })
            ->count();
    }
}
