<?php

namespace App\Jobs;

use App\Models\Company;
use App\Services\ScoreService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class CalculateCompanyScore implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly int $companyId) {}

    public function handle(ScoreService $scoreService): void
    {
        $company = Company::with([
            'complaints.response',
            'complaints.feedback',
        ])->findOrFail($this->companyId);

        $scoreService->calculate($company);
    }
}
