<?php

namespace App\Console\Commands;

use App\Jobs\FetchGooglePlaceJob;
use App\Models\Company;
use App\Models\GooglePlaceSnapshot;
use Illuminate\Console\Command;

class GoogleSyncPlaces extends Command
{
    protected $signature   = 'google:sync-places
                                {--slug= : Sync a single company by slug}
                                {--stale : Only re-sync snapshots older than 7 days}
                                {--missing : Only sync companies with no snapshot yet}';

    protected $description = 'Fetch or refresh Google Places data for companies';

    public function handle(): void
    {
        $query = Company::query();

        if ($slug = $this->option('slug')) {
            $query->where('slug', $slug);
        } elseif ($this->option('missing')) {
            $query->whereDoesntHave('googlePlaceSnapshot');
        } elseif ($this->option('stale')) {
            $query->whereHas('googlePlaceSnapshot', fn ($q) =>
                $q->where('fetched_at', '<', now()->subDays(7))
            )->orWhereDoesntHave('googlePlaceSnapshot');
        }

        $companies = $query->get();

        if ($companies->isEmpty()) {
            $this->info('No companies to sync.');
            return;
        }

        $this->info("Dispatching Google Places fetch for {$companies->count()} companies…");

        foreach ($companies as $company) {
            FetchGooglePlaceJob::dispatch($company->id);
            $this->line("  → {$company->name}");
        }

        $this->info('Done — jobs queued.');
    }
}
