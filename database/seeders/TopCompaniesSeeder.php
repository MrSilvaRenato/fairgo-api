<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class TopCompaniesSeeder extends Seeder
{
    /**
     * Real top Australian companies with verified ABNs (publicly listed on ABN Lookup).
     */
    public function run(): void
    {
        $companies = [
            ['name' => 'Telstra Corporation',         'abn' => '33051775556', 'industry' => 'Telecommunications',  'description' => 'Australia\'s largest telecommunications and technology company.'],
            ['name' => 'Optus',                        'abn' => '90052833208', 'industry' => 'Telecommunications',  'description' => 'Australia\'s second largest telecommunications provider.'],
            ['name' => 'Woolworths Group',             'abn' => '88000014675', 'industry' => 'Retail',              'description' => 'One of Australia\'s largest supermarket and retail chains.'],
            ['name' => 'Coles Group',                  'abn' => '11004089936', 'industry' => 'Retail',              'description' => 'Major Australian supermarket and retail group.'],
            ['name' => 'Commonwealth Bank',            'abn' => '48123123124', 'industry' => 'Banking & Finance',   'description' => 'Australia\'s leading provider of integrated financial services.'],
            ['name' => 'Westpac Banking Corporation',  'abn' => '33007457141', 'industry' => 'Banking & Finance',   'description' => 'One of Australia\'s four major banking organisations.'],
            ['name' => 'ANZ Banking Group',            'abn' => '11005357522', 'industry' => 'Banking & Finance',   'description' => 'Major Australian and New Zealand banking group.'],
            ['name' => 'National Australia Bank',      'abn' => '12004044937', 'industry' => 'Banking & Finance',   'description' => 'One of Australia\'s four major financial institutions.'],
            ['name' => 'AGL Energy',                   'abn' => '74115061375', 'industry' => 'Energy & Utilities',  'description' => 'Australia\'s largest electricity generator and energy retailer.'],
            ['name' => 'Origin Energy',                'abn' => '30000051696', 'industry' => 'Energy & Utilities',  'description' => 'Leading Australian integrated energy company.'],
            ['name' => 'Medibank Private',             'abn' => '47080890962', 'industry' => 'Insurance',           'description' => 'Australia\'s largest private health insurer.'],
            ['name' => 'NRMA Insurance',               'abn' => '42003737044', 'industry' => 'Insurance',           'description' => 'One of Australia\'s largest general insurance companies.'],
            ['name' => 'Qantas Airways',               'abn' => '16009661901', 'industry' => 'Travel & Tourism',    'description' => 'Australia\'s flagship carrier and largest domestic airline.'],
            ['name' => 'Virgin Australia',             'abn' => '36090670965', 'industry' => 'Travel & Tourism',    'description' => 'Australia\'s second largest airline group.'],
            ['name' => 'Amazon Australia',             'abn' => '93148767075', 'industry' => 'Internet & Technology','description' => 'Global e-commerce and cloud computing company operating in Australia.'],
            ['name' => 'JB Hi-Fi',                     'abn' => '80093220136', 'industry' => 'Retail',              'description' => 'Australia\'s largest home entertainment retailer.'],
            ['name' => 'Harvey Norman',                'abn' => '54003237545', 'industry' => 'Retail',              'description' => 'Major Australian retailer of electronics, computers and appliances.'],
            ['name' => 'Bunnings Group',               'abn' => '26008672179', 'industry' => 'Retail',              'description' => 'Australia\'s leading retailer of home improvement and lifestyle products.'],
            ['name' => 'Afterpay',                     'abn' => '38617037418', 'industry' => 'Banking & Finance',   'description' => 'Australian buy now, pay later financial technology company.'],
            ['name' => 'Domino\'s Pizza Enterprises',  'abn' => '49010489916', 'industry' => 'Food & Beverage',     'description' => 'Australia\'s largest pizza chain and food delivery network.'],
        ];

        // Find or create a system user to own seeded companies
        $systemUser = User::firstOrCreate(
            ['email' => 'system@fairgo.internal'],
            [
                'name'     => 'Fair Go System',
                'password' => bcrypt(Str::random(32)),
                'role'     => 'company_admin',
            ]
        );

        foreach ($companies as $data) {
            $abn = preg_replace('/\s+/', '', $data['abn']);

            // Skip if ABN already exists
            if (Company::where('abn', $abn)->exists()) {
                $this->command->line("  Skipping {$data['name']} — already exists.");
                continue;
            }

            $slug = Str::slug($data['name']);
            $base = $slug; $i = 1;
            while (Company::where('slug', $slug)->exists()) {
                $slug = "{$base}-{$i}"; $i++;
            }

            // Create a dedicated admin user for this company
            $email = Str::slug($data['name']) . '@fairgo.test';
            $owner = User::firstOrCreate(
                ['email' => $email],
                [
                    'name'     => $data['name'] . ' Admin',
                    'password' => bcrypt('password'),
                    'role'     => 'company_admin',
                ]
            );

            $company = Company::create([
                'user_id'     => $owner->id,
                'name'        => $data['name'],
                'slug'        => $slug,
                'abn'         => $abn,
                'industry'    => $data['industry'],
                'description' => $data['description'],
                'claimed'     => true,
            ]);

            Subscription::firstOrCreate(
                ['company_id' => $company->id],
                ['plan' => 'free', 'status' => 'active']
            );

            $this->command->info("  ✓ Created: {$data['name']} ({$data['industry']})");
        }

        $this->command->info("\nDone! " . count($companies) . " companies processed.");
    }
}
