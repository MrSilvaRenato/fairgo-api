<?php

namespace App\Jobs;

use App\Models\Complaint;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ExpireUnansweredComplaints implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        Complaint::where('status', 'open')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->whereDoesntHave('response')
            ->get()
            ->each(function (Complaint $complaint) {
                $complaint->update(['status' => 'expired']);
                CalculateCompanyScore::dispatch($complaint->company_id);
            });
    }
}
