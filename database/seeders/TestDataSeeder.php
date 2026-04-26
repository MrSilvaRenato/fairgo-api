<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\CompanyResponse;
use App\Models\Complaint;
use App\Models\ResolutionFeedback;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Seeds realistic test data for QA across all three roles.
 * Safe to re-run — uses updateOrCreate throughout.
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  TEST ACCOUNTS                                          │
 * ├──────────────────────────────┬──────────────────────────┤
 * │  Email                       │  Password                │
 * ├──────────────────────────────┼──────────────────────────┤
 * │  ADMIN                       │                          │
 * │  testadmin@fairgo.test       │  Admin1234!              │
 * ├──────────────────────────────┼──────────────────────────┤
 * │  CONSUMER (your test)        │                          │
 * │  testconsumer@fairgo.test    │  Consumer1234!           │
 * ├──────────────────────────────┼──────────────────────────┤
 * │  COMPANY (your test)         │                          │
 * │  testcompany@fairgo.test     │  Company1234!            │
 * │  → Telstra                   │                          │
 * ├──────────────────────────────┼──────────────────────────┤
 * │  BULK CONSUMERS (10)         │                          │
 * │  consumer1@fairgo.test       │  Test1234!               │
 * │  consumer2@fairgo.test       │  Test1234!               │
 * │  ...                         │                          │
 * │  consumer10@fairgo.test      │  Test1234!               │
 * ├──────────────────────────────┼──────────────────────────┤
 * │  BULK COMPANIES (10)         │                          │
 * │  company1@fairgo.test        │  Test1234!  → Optus      │
 * │  company2@fairgo.test        │  Test1234!  → TPG        │
 * │  company3@fairgo.test        │  Test1234!  → Vodafone   │
 * │  company4@fairgo.test        │  Test1234!  → CommBank   │
 * │  company5@fairgo.test        │  Test1234!  → Westpac    │
 * │  company6@fairgo.test        │  Test1234!  → ANZ        │
 * │  company7@fairgo.test        │  Test1234!  → Woolworths │
 * │  company8@fairgo.test        │  Test1234!  → Qantas     │
 * │  company9@fairgo.test        │  Test1234!  → AGL Energy │
 * │  company10@fairgo.test       │  Test1234!  → Afterpay   │
 * └──────────────────────────────┴──────────────────────────┘
 *
 * NOTE: All accounts have email_verified_at set — they can
 * file complaints immediately. Verification emails are NOT
 * sent (bypassed in seeder only, production flow unchanged).
 */
class TestDataSeeder extends Seeder
{
    // Companies to claim (must already exist from CompanySeeder)
    private const COMPANY_NAMES = [
        'Optus',
        'TPG Telecom',
        'Vodafone Australia',
        'Commonwealth Bank',
        'Westpac',
        'ANZ Bank',
        'Woolworths',
        'Qantas Airways',
        'AGL Energy',
        'Afterpay',
    ];

    public function run(): void
    {
        $this->command->info('Seeding test accounts...');

        // ── 1. Named test accounts ──────────────────────────────────────────
        $testAdmin = $this->makeUser('testadmin@fairgo.test', 'Test Admin', 'Admin1234!', 'admin');
        $testConsumer = $this->makeUser('testconsumer@fairgo.test', 'Test Consumer', 'Consumer1234!', 'consumer');
        $testCompanyUser = $this->makeUser('testcompany@fairgo.test', 'Test Company Admin', 'Company1234!', 'company_admin');

        // Link test company admin to Telstra
        $telstra = Company::where('name', 'Telstra')->first();
        if ($telstra && !$telstra->user_id) {
            $telstra->update(['user_id' => $testCompanyUser->id, 'claimed' => true]);
        }

        // ── 2. Bulk consumers ───────────────────────────────────────────────
        $consumers = [];
        $consumerNames = [
            'Sarah Mitchell', 'James Thompson', 'Emily Chen',
            'Michael Brown', 'Jessica Wilson', 'Daniel Taylor',
            'Olivia Martin', 'Ryan Anderson', 'Chloe Davis', 'Liam Johnson',
        ];

        foreach (range(1, 10) as $i) {
            $consumer = $this->makeUser("consumer{$i}@fairgo.test", $consumerNames[$i - 1], 'Test1234!', 'consumer');
            if (!$consumer->phone) {
                $consumer->phone = '04' . str_pad($i * 11111111, 8, '0', STR_PAD_LEFT);
                $consumer->save();
            }
            $consumers[] = $consumer;
        }

        // ── 3. Bulk company admins — claim 10 companies ─────────────────────
        $companyAdminNames = [
            'Optus Support Team', 'TPG Account Manager', 'Vodafone Australia Admin',
            'CommBank Business', 'Westpac Digital', 'ANZ Customer Relations',
            'Woolworths Group', 'Qantas Customer Care', 'AGL Business Portal', 'Afterpay Business',
        ];

        $claimedCompanies = [];
        foreach (range(1, 10) as $i) {
            $companyUser = $this->makeUser("company{$i}@fairgo.test", $companyAdminNames[$i - 1], 'Test1234!', 'company_admin');

            $companyName = self::COMPANY_NAMES[$i - 1];
            $company = Company::where('name', $companyName)->first();

            if ($company && !$company->user_id) {
                $company->update(['user_id' => $companyUser->id, 'claimed' => true]);
            }

            $claimedCompanies[] = $company;
        }

        // Merge test company (Telstra) into the pool for complaints
        if ($telstra) {
            array_unshift($claimedCompanies, $telstra);
        }

        // ── 4. Complaints — 7 per consumer ─────────────────────────────────
        $this->command->info('Seeding complaints...');

        $complaintTemplates = $this->complaintTemplates();
        $templateIndex = 0;

        // 7 varied status patterns — ensures each company gets a mix of open,
        // responded and resolved complaints so ScoreService produces real scores.
        $statusSet = [
            ['open',        'pending',  now()->addDays(7),  false, false],
            ['responded',   'approved', now()->addDays(5),  true,  false],
            ['resolved',    'approved', now()->subDays(1),  true,  true],
            ['open',        'approved', now()->addDays(6),  false, false],
            ['unresolved',  'approved', now()->subDays(2),  true,  true],
            ['responded',   'approved', now()->addDays(4),  true,  false],
            ['resolved',    'approved', now()->subDays(3),  true,  true],
        ];

        $responseTemplates = [
            "Thank you for reaching out. We have investigated your complaint and are working to resolve this as quickly as possible. A dedicated case manager has been assigned to your account.",
            "We sincerely apologise for your experience. We take all complaints seriously and have escalated this matter to our customer resolution team. You will be contacted within 2 business days.",
            "We appreciate you bringing this to our attention. Our team has reviewed your account and is processing the necessary adjustments. Please allow 3–5 business days for this to reflect.",
            "Thank you for your patience. After reviewing your case, we have identified the issue and taken steps to rectify it. We have also implemented process improvements to prevent recurrence.",
        ];

        $feedbackSets = [
            ['resolved' => true,  'rating' => 5, 'comment' => 'Issue was resolved quickly and professionally. Very happy with the outcome.', 'would_deal_again' => true],
            ['resolved' => true,  'rating' => 4, 'comment' => 'Took a while but they did fix it in the end. Communication could be better.', 'would_deal_again' => true],
            ['resolved' => false, 'rating' => 2, 'comment' => 'They replied but the issue was never fully fixed. Still waiting on the refund.', 'would_deal_again' => false],
            ['resolved' => true,  'rating' => 5, 'comment' => 'Excellent service once I escalated. Full refund received.', 'would_deal_again' => true],
            ['resolved' => false, 'rating' => 1, 'comment' => 'Complete waste of time. Nothing was resolved despite multiple follow-ups.', 'would_deal_again' => false],
            ['resolved' => true,  'rating' => 3, 'comment' => 'Partially resolved — accepted a store credit instead of cash refund.', 'would_deal_again' => true],
        ];

        foreach ($consumers as $consumerIndex => $consumer) {
            for ($j = 0; $j < 7; $j++) {
                // Distribute complaints across companies
                $company = $claimedCompanies[($consumerIndex * 7 + $j) % count($claimedCompanies)];
                if (!$company) continue;

                $template = $complaintTemplates[$templateIndex % count($complaintTemplates)];
                $templateIndex++;

                [$status, $modStatus, $expires, $hasResponse, $hasFeedback] = $statusSet[$j % 7];

                $existing = Complaint::where('consumer_id', $consumer->id)
                    ->where('company_id', $company->id)
                    ->where('title', $template['title'])
                    ->first();

                if ($existing) continue;

                $complaint = Complaint::create([
                    'consumer_id'        => $consumer->id,
                    'company_id'         => $company->id,
                    'title'              => $template['title'],
                    'description'        => $template['description'],
                    'expected_resolution'=> $template['resolution'],
                    'category'           => $template['category'],
                    'status'             => $status,
                    'is_public'          => true,
                    'expires_at'         => $expires,
                    'moderation_status'  => $modStatus,
                    'incident_date'      => now()->subDays(rand(2, 45)),
                    'reference_number'   => 'REF-' . strtoupper(substr(md5(uniqid()), 0, 8)),
                    'amount_involved'    => $template['amount'],
                    'contact_attempted'  => (bool) rand(0, 1),
                    'phone'              => $consumer->phone,
                ]);

                if ($hasResponse) {
                    $responseExists = CompanyResponse::where('complaint_id', $complaint->id)->exists();
                    if (!$responseExists) {
                        CompanyResponse::create([
                            'complaint_id' => $complaint->id,
                            'company_id'   => $company->id,
                            'content'      => $responseTemplates[($consumerIndex + $j) % count($responseTemplates)],
                            'responded_at' => now()->subDays(rand(1, 10)),
                        ]);
                    }
                }

                if ($hasFeedback) {
                    $feedbackExists = ResolutionFeedback::where('complaint_id', $complaint->id)->exists();
                    if (!$feedbackExists) {
                        $fb = $feedbackSets[($consumerIndex + $j) % count($feedbackSets)];
                        ResolutionFeedback::create([
                            'complaint_id'    => $complaint->id,
                            'consumer_id'     => $consumer->id,
                            'resolved'        => $fb['resolved'],
                            'rating'          => $fb['rating'],
                            'comment'         => $fb['comment'],
                            'would_deal_again'=> $fb['would_deal_again'],
                        ]);
                    }
                }
            }
        }

        $this->command->info('✅ Test data seeded successfully.');
        $this->command->table(
            ['Role', 'Email', 'Password', 'Notes'],
            [
                ['Admin (test)',    'testadmin@fairgo.test',    'Admin1234!',    'Named test admin'],
                ['Consumer (test)', 'testconsumer@fairgo.test', 'Consumer1234!', 'Named test consumer'],
                ['Company (test)',  'testcompany@fairgo.test',  'Company1234!',  '→ Telstra'],
                ['Consumers 1–10', 'consumer{N}@fairgo.test',  'Test1234!',     '10 accounts'],
                ['Companies 1–10', 'company{N}@fairgo.test',   'Test1234!',     '10 accounts, see list above'],
            ]
        );
    }

    /**
     * Create or find a user and ensure email_verified_at is set.
     * Uses direct attribute assignment to bypass $fillable restriction.
     */
    private function makeUser(string $email, string $name, string $password, string $role): User
    {
        $user = User::firstOrCreate(
            ['email' => $email],
            ['name' => $name, 'password' => Hash::make($password), 'role' => $role]
        );

        // email_verified_at is not in $fillable — set directly
        if (!$user->email_verified_at) {
            $user->email_verified_at = now();
            $user->save();
        }

        return $user;
    }

    private function complaintTemplates(): array
    {
        return [
            [
                'title'       => 'Charged twice for the same bill',
                'description' => "I was billed twice in the same month for my account. I contacted customer service but was told it would be resolved within 5 business days. It has now been 3 weeks and I still have not received a refund. The double charge of $89.00 has caused a direct debit to bounce on my account.",
                'resolution'  => 'Full refund of the duplicate charge and a written apology.',
                'category'    => 'billing',
                'amount'      => 89.00,
            ],
            [
                'title'       => 'Order never arrived — no refund issued',
                'description' => "I placed an order over 6 weeks ago and it has never arrived. The tracking number shows it has been stuck at a depot for 4 weeks. I have called 3 times and each time I am told someone will follow up, but no one ever does. I am out of pocket and have no product.",
                'resolution'  => 'Full refund or replacement delivery within 5 business days.',
                'category'    => 'delivery',
                'amount'      => 149.95,
            ],
            [
                'title'       => 'Customer service agent was rude and unhelpful',
                'description' => "I called the support line to resolve an issue with my account and the agent was dismissive, talked over me, and eventually hung up the phone. I have been a loyal customer for 7 years and have never experienced anything like this. When I called back, I was told there was no record of the previous call.",
                'resolution'  => 'An apology, a review of the call, and training for staff.',
                'category'    => 'service',
                'amount'      => null,
            ],
            [
                'title'       => 'Refused a valid refund request',
                'description' => "The product I received was faulty — the screen cracked within 24 hours of normal use. I returned it within the 30-day return window with the original packaging and receipt. The store refused the return, claiming it was physical damage caused by me. I have photos showing the defect exists along the manufacturing seam.",
                'resolution'  => 'Full refund or exchange for a working product.',
                'category'    => 'refund',
                'amount'      => 349.00,
            ],
            [
                'title'       => 'Unauthorised transaction on my account',
                'description' => "I noticed a charge of $240 on my account that I did not authorise. I never signed up for this subscription and have never received any services from this company. When I called to dispute the charge I was told it was non-refundable. This appears to be a fraudulent charge.",
                'resolution'  => 'Full refund and confirmation that no future charges will occur.',
                'category'    => 'fraud',
                'amount'      => 240.00,
            ],
            [
                'title'       => 'Account cancelled without notice',
                'description' => "My account was cancelled without any prior notice or communication. I lost access to 3 years of data and history. I have been trying to contact the company for 2 weeks but have received no response via email, phone, or live chat. This is causing significant disruption to my business operations.",
                'resolution'  => 'Account reinstatement and recovery of all data.',
                'category'    => 'service',
                'amount'      => null,
            ],
            [
                'title'       => 'Internet speed not matching advertised plan',
                'description' => "I am paying for a 100Mbps NBN plan but have never achieved more than 18Mbps. I have run speed tests at various times of day for the past 6 weeks and documented the results. A technician visited and said everything was fine on their end, but the issue persists.",
                'resolution'  => 'Consistent delivery of the advertised speeds or a plan downgrade with a refund of the difference.',
                'category'    => 'service',
                'amount'      => 79.90,
            ],
            [
                'title'       => 'Flight cancelled — voucher refused, cash refund denied',
                'description' => "My flight was cancelled by the airline due to operational reasons. I was offered a travel voucher but I specifically requested a cash refund as per ACCC guidelines. The company has refused and is insisting the voucher is the only option. I have the original booking confirmation and the cancellation notice.",
                'resolution'  => 'Full cash refund of the original fare to my payment method.',
                'category'    => 'refund',
                'amount'      => 512.00,
            ],
            [
                'title'       => 'Wrong item sent, return process is impossible',
                'description' => "I ordered a specific model and received a completely different item. I raised a return request online and was given a return label. I dropped it off at the post office 4 weeks ago and have tracking confirmation it was delivered. I have received no refund, no replacement, and customer service keeps asking me to wait another 5 business days.",
                'resolution'  => 'Refund processed within 48 hours.',
                'category'    => 'delivery',
                'amount'      => 199.00,
            ],
            [
                'title'       => 'Overcharged on energy bill for 4 months',
                'description' => "I have been overcharged on my electricity bill for the past 4 billing cycles. My meter was read incorrectly and despite submitting photos of the actual meter reading each time, the bills have not been corrected. The overcharge totals approximately $380 across the four bills.",
                'resolution'  => 'Credit of $380 applied to my account and corrected future billing.',
                'category'    => 'billing',
                'amount'      => 380.00,
            ],
        ];
    }
}
