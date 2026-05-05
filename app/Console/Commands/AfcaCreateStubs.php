<?php

namespace App\Console\Commands;

use App\Models\AfcaInsight;
use App\Models\Company;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class AfcaCreateStubs extends Command
{
    protected $signature   = 'afca:create-stubs';
    protected $description = 'Create stub company pages for AFCA firms not yet in the companies table';

    public function handle(): void
    {
        $unmatched = AfcaInsight::whereNull('company_id')->get();

        if ($unmatched->isEmpty()) {
            $this->info('All AFCA firms are already matched to companies.');
            return;
        }

        $created = 0;
        $skipped = 0;

        foreach ($unmatched as $insight) {
            $slug = $this->makeSlug($insight->firm_name);

            // Skip if a company with this slug already exists
            if (Company::where('slug', $slug)->exists()) {
                // Link the insight to the existing company
                $company = Company::where('slug', $slug)->first();
                $insight->update(['company_id' => $company->id]);
                $skipped++;
                continue;
            }

            $company = Company::create([
                'name'         => $insight->firm_name,
                'slug'         => $slug,
                'industry'     => $this->industryFromBusiness($insight->primary_business),
                'is_stub'      => true,
                'claimed'      => false,
                'abn_verified' => false,
                'verified_badge' => false,
                'not_recommended' => false,
            ]);

            $insight->update(['company_id' => $company->id]);

            $this->line("  ✓ {$insight->firm_name} → /companies/{$slug}");
            $created++;
        }

        $this->info("Done — {$created} stubs created, {$skipped} linked to existing companies.");
    }

    private function makeSlug(string $name): string
    {
        // Strip common legal suffixes to keep slugs readable
        $clean = preg_replace('/\s+(pty\s+ltd|limited|ltd|pty|incorporated|inc|llc|group)\.?$/i', '', $name);
        $slug  = Str::slug(trim($clean));

        // Ensure uniqueness by appending a counter if needed
        $base  = $slug;
        $i     = 2;
        while (Company::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }

        return $slug;
    }

    private function industryFromBusiness(string $business): string
    {
        return match (true) {
            str_contains($business, 'Bank')              => 'Banking',
            str_contains($business, 'Insurer')           => 'Insurance',
            str_contains($business, 'Underwriter')       => 'Insurance',
            str_contains($business, 'Credit')            => 'Financial Services',
            str_contains($business, 'Superannuation')    => 'Superannuation',
            str_contains($business, 'FinTech')           => 'FinTech',
            str_contains($business, 'Payment')           => 'Financial Services',
            str_contains($business, 'Credit Reporting')  => 'Financial Services',
            default                                      => 'Financial Services',
        };
    }
}
