<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\CompanyResponse;
use App\Models\Complaint;
use App\Models\ResolutionFeedback;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Minimal demo seed — clearly labelled test accounts and complaints.
 * Safe to re-run (updateOrCreate throughout).
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │  DEMO ACCOUNTS                                               │
 * ├──────────────────────────────┬───────────────────────────────┤
 * │  Email                       │  Password                     │
 * ├──────────────────────────────┼───────────────────────────────┤
 * │  demo-company@ausfairgo.com.au  │  Demo1234!  (company_admin)│
 * │  demo-consumer@ausfairgo.com.au │  Demo1234!  (consumer)     │
 * └──────────────────────────────┴───────────────────────────────┘
 */
class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding demo accounts...');

        // ── 1. Demo company admin ────────────────────────────────────────────
        $companyUser = User::updateOrCreate(
            ['email' => 'demo-company@ausfairgo.com.au'],
            [
                'name'              => 'Demo Company Admin',
                'password'          => Hash::make('Demo1234!'),
                'role'              => 'company_admin',
                'email_verified_at' => now(),
            ]
        );

        // ── 2. Demo company ─────────────────────────────────────────────────
        $company = Company::updateOrCreate(
            ['slug' => 'demo-test-company'],
            [
                'name'            => '[DEMO] Test Company',
                'slug'            => 'demo-test-company',
                'abn'             => '78624472980',
                'abn_entity_name' => 'Demo Test Company Pty Ltd',
                'abn_verified'    => true,
                'website'         => 'https://ausfairgo.com.au',
                'description'     => 'This is a demonstration company created to showcase how Aus Fair Go works. It is not a real business.',
                'user_id'         => $companyUser->id,
                'claimed'         => true,
                'verified_badge'  => false,
                'is_stub'         => false,
            ]
        );

        // ── 3. Demo consumer ─────────────────────────────────────────────────
        $consumer = User::updateOrCreate(
            ['email' => 'demo-consumer@ausfairgo.com.au'],
            [
                'name'              => 'Demo Consumer',
                'password'          => Hash::make('Demo1234!'),
                'role'              => 'consumer',
                'email_verified_at' => now(),
            ]
        );

        // ── 4. Demo complaints ───────────────────────────────────────────────

        // Complaint 1 — Open, awaiting company response
        $c1 = Complaint::firstOrCreate(
            ['consumer_id' => $consumer->id, 'company_id' => $company->id, 'title' => '[DEMO] Charged twice for the same bill'],
            [
                'description'         => '[DEMO COMPLAINT] This is a demonstration of an open complaint. The consumer was charged twice in the same billing cycle and is awaiting a response from the company.',
                'expected_resolution' => 'Full refund of the duplicate charge.',
                'category'            => 'billing',
                'status'              => 'open',
                'is_public'           => true,
                'moderation_status'   => 'approved',
                'expires_at'          => now()->addDays(7),
                'incident_date'       => now()->subDays(3),
                'amount_involved'     => 89.00,
                'contact_attempted'   => true,
                'reference_number'    => 'DEMO-001',
            ]
        );

        // Complaint 2 — Responded (company replied, consumer yet to close)
        $c2 = Complaint::firstOrCreate(
            ['consumer_id' => $consumer->id, 'company_id' => $company->id, 'title' => '[DEMO] Order never arrived — no refund issued'],
            [
                'description'         => '[DEMO COMPLAINT] This is a demonstration of a complaint that has received a company response. The consumer filed a complaint and the company has replied.',
                'expected_resolution' => 'Full refund or replacement within 5 business days.',
                'category'            => 'delivery',
                'status'              => 'responded',
                'is_public'           => true,
                'moderation_status'   => 'approved',
                'expires_at'          => now()->addDays(5),
                'incident_date'       => now()->subDays(10),
                'amount_involved'     => 149.95,
                'contact_attempted'   => true,
                'reference_number'    => 'DEMO-002',
            ]
        );

        CompanyResponse::firstOrCreate(
            ['complaint_id' => $c2->id],
            [
                'company_id'   => $company->id,
                'content'      => '[DEMO RESPONSE] Thank you for reaching out. We have investigated your complaint and a dedicated case manager has been assigned to your account. We will have this resolved within 2 business days.',
                'responded_at' => now()->subDays(2),
            ]
        );

        // Complaint 3 — Resolved with consumer feedback and rating
        $c3 = Complaint::firstOrCreate(
            ['consumer_id' => $consumer->id, 'company_id' => $company->id, 'title' => '[DEMO] Refused a valid refund request'],
            [
                'description'         => '[DEMO COMPLAINT] This is a demonstration of a resolved complaint. The consumer filed a complaint, the company responded, and the consumer closed it with a rating.',
                'expected_resolution' => 'Full refund or exchange for a working product.',
                'category'            => 'refund',
                'status'              => 'resolved',
                'is_public'           => true,
                'moderation_status'   => 'approved',
                'expires_at'          => now()->addDays(1),
                'incident_date'       => now()->subDays(20),
                'amount_involved'     => 349.00,
                'contact_attempted'   => true,
                'reference_number'    => 'DEMO-003',
            ]
        );

        CompanyResponse::firstOrCreate(
            ['complaint_id' => $c3->id],
            [
                'company_id'   => $company->id,
                'content'      => '[DEMO RESPONSE] We sincerely apologise for your experience. After reviewing the photos you provided, we agree the defect is a manufacturing fault. A full refund has been processed to your original payment method.',
                'responded_at' => now()->subDays(8),
            ]
        );

        ResolutionFeedback::firstOrCreate(
            ['complaint_id' => $c3->id],
            [
                'consumer_id'     => $consumer->id,
                'resolved'        => true,
                'rating'          => 4,
                'comment'         => '[DEMO] Issue was resolved after escalating. Full refund received. Communication could have been faster.',
                'would_deal_again' => true,
            ]
        );

        // Complaint 4 — Resolved with positive feedback
        $c4 = Complaint::firstOrCreate(
            ['consumer_id' => $consumer->id, 'company_id' => $company->id, 'title' => '[DEMO] Internet speed not matching advertised plan'],
            [
                'description'         => '[DEMO COMPLAINT] Paying for a 100Mbps plan but consistently getting under 20Mbps. Speed tests documented over 6 weeks.',
                'expected_resolution' => 'Consistent delivery of advertised speeds or refund of the difference.',
                'category'            => 'service',
                'status'              => 'resolved',
                'is_public'           => true,
                'moderation_status'   => 'approved',
                'expires_at'          => now()->addDays(1),
                'incident_date'       => now()->subDays(25),
                'amount_involved'     => 79.90,
                'contact_attempted'   => true,
                'reference_number'    => 'DEMO-004',
            ]
        );

        CompanyResponse::firstOrCreate(
            ['complaint_id' => $c4->id],
            [
                'company_id'   => $company->id,
                'content'      => '[DEMO RESPONSE] We apologise for the inconvenience. After reviewing your account our technical team identified a node issue in your area. This has been rectified and we have applied a $40 credit to your account for the disruption.',
                'responded_at' => now()->subDays(12),
            ]
        );

        ResolutionFeedback::firstOrCreate(
            ['complaint_id' => $c4->id],
            [
                'consumer_id'      => $consumer->id,
                'resolved'         => true,
                'rating'           => 5,
                'comment'          => '[DEMO] They fixed the issue and credited my account. Very happy with the outcome.',
                'would_deal_again' => true,
            ]
        );

        // Complaint 5 — Resolved with positive feedback (hits MIN_FOR_RATING = 5)
        $c5 = Complaint::firstOrCreate(
            ['consumer_id' => $consumer->id, 'company_id' => $company->id, 'title' => '[DEMO] Overcharged on energy bill for 4 months'],
            [
                'description'         => '[DEMO COMPLAINT] Incorrectly billed for 4 consecutive cycles despite submitting meter photos each time. Total overcharge approximately $380.',
                'expected_resolution' => 'Credit of $380 applied and corrected future billing.',
                'category'            => 'billing',
                'status'              => 'resolved',
                'is_public'           => true,
                'moderation_status'   => 'approved',
                'expires_at'          => now()->addDays(1),
                'incident_date'       => now()->subDays(30),
                'amount_involved'     => 380.00,
                'contact_attempted'   => true,
                'reference_number'    => 'DEMO-005',
            ]
        );

        CompanyResponse::firstOrCreate(
            ['complaint_id' => $c5->id],
            [
                'company_id'   => $company->id,
                'content'      => '[DEMO RESPONSE] Thank you for your patience. We have reviewed your billing history and confirmed the metering error. A credit of $380 has been applied to your account and your meter has been recalibrated.',
                'responded_at' => now()->subDays(18),
            ]
        );

        ResolutionFeedback::firstOrCreate(
            ['complaint_id' => $c5->id],
            [
                'consumer_id'      => $consumer->id,
                'resolved'         => true,
                'rating'           => 4,
                'comment'          => '[DEMO] Full credit received. Took a few weeks but they did make it right.',
                'would_deal_again' => true,
            ]
        );

        // Recalculate score now that we have 5 complaints
        $scoreService = app(\App\Services\ScoreService::class);
        $scoreService->calculate($company);

        $this->command->info('✅ Demo data seeded.');
        $this->command->table(
            ['Role', 'Email', 'Password'],
            [
                ['Company Admin', 'demo-company@ausfairgo.com.au',  'Demo1234!'],
                ['Consumer',      'demo-consumer@ausfairgo.com.au', 'Demo1234!'],
            ]
        );
    }
}
