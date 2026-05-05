<?php

namespace Database\Seeders;

use App\Models\AfcaInsight;
use App\Models\Company;
use Illuminate\Database\Seeder;

class AfcaInsightSeeder extends Seeder
{
    // Source: AFCA DataCube — FY2023-24
    private const PERIOD_YEAR = 2024;

    private const DATA = [
        ['firm_name' => 'Commonwealth Bank of Australia',          'primary_business' => 'Bank',                            'complaints_received' => 6991, 'complaints_resolved' => 4524, 'resolution_rate' => 63.12],
        ['firm_name' => 'National Australia Bank Limited',         'primary_business' => 'Bank',                            'complaints_received' => 6581, 'complaints_resolved' => 4292, 'resolution_rate' => 66.53],
        ['firm_name' => 'AAI Limited',                             'primary_business' => 'General Insurer',                 'complaints_received' => 5050, 'complaints_resolved' => 2471, 'resolution_rate' => 50.01],
        ['firm_name' => 'Australia and New Zealand Banking Group Limited', 'primary_business' => 'Bank',                   'complaints_received' => 4425, 'complaints_resolved' => 3358, 'resolution_rate' => 63.54],
        ['firm_name' => 'Westpac Banking Corporation',             'primary_business' => 'Bank',                            'complaints_received' => 4028, 'complaints_resolved' => 2584, 'resolution_rate' => 63.94],
        ['firm_name' => 'Auto & General Services Pty Ltd',         'primary_business' => 'Underwriter / Underwriting Agency', 'complaints_received' => 2765, 'complaints_resolved' => 1359, 'resolution_rate' => 49.93],
        ['firm_name' => 'Insurance Australia Limited',             'primary_business' => 'General Insurer',                 'complaints_received' => 2530, 'complaints_resolved' => 1268, 'resolution_rate' => 47.99],
        ['firm_name' => 'Allianz Australia Insurance Limited',     'primary_business' => 'General Insurer',                 'complaints_received' => 1497, 'complaints_resolved' =>  534, 'resolution_rate' => 34.97],
        ['firm_name' => 'St George Bank',                          'primary_business' => 'Bank',                            'complaints_received' => 1438, 'complaints_resolved' =>  994, 'resolution_rate' => 65.31],
        ['firm_name' => 'Latitude Finance Australia',              'primary_business' => 'Credit Provider',                 'complaints_received' => 1315, 'complaints_resolved' => 1084, 'resolution_rate' => 78.04],
        ['firm_name' => 'AustralianSuper Pty Ltd',                 'primary_business' => 'Superannuation Trustee',          'complaints_received' => 1276, 'complaints_resolved' =>  724, 'resolution_rate' => 57.92],
        ['firm_name' => 'QBE Insurance (Australia) Limited',       'primary_business' => 'General Insurer',                 'complaints_received' => 1182, 'complaints_resolved' =>  393, 'resolution_rate' => 32.86],
        ['firm_name' => 'RACQ Insurance Limited',                  'primary_business' => 'General Insurer',                 'complaints_received' => 1161, 'complaints_resolved' =>  499, 'resolution_rate' => 43.96],
        ['firm_name' => 'Afterpay Australia Pty Ltd',              'primary_business' => 'FinTech',                         'complaints_received' => 1076, 'complaints_resolved' =>  706, 'resolution_rate' => 70.18],
        ['firm_name' => 'American Express Australia Limited',      'primary_business' => 'Credit Provider',                 'complaints_received' => 1073, 'complaints_resolved' =>  630, 'resolution_rate' => 57.90],
        ['firm_name' => 'ING Bank (Australia) Limited',            'primary_business' => 'Bank',                            'complaints_received' => 1040, 'complaints_resolved' =>  548, 'resolution_rate' => 53.26],
        ['firm_name' => 'Bendigo and Adelaide Bank Limited',       'primary_business' => 'Bank',                            'complaints_received' =>  983, 'complaints_resolved' =>  537, 'resolution_rate' => 57.01],
        ['firm_name' => 'Macquarie Bank Limited',                  'primary_business' => 'Bank',                            'complaints_received' =>  979, 'complaints_resolved' =>  605, 'resolution_rate' => 61.55],
        ['firm_name' => 'Bank of Queensland Limited',              'primary_business' => 'Bank',                            'complaints_received' =>  932, 'complaints_resolved' =>  611, 'resolution_rate' => 72.39],
        ['firm_name' => 'PayPal Australia Pty Limited',            'primary_business' => 'Non-Cash Payment System Provider', 'complaints_received' =>  881, 'complaints_resolved' =>  605, 'resolution_rate' => 70.93],
        ['firm_name' => 'Zipmoney Payments Pty Limited',           'primary_business' => 'FinTech',                         'complaints_received' =>  778, 'complaints_resolved' =>  630, 'resolution_rate' => 79.45],
        ['firm_name' => 'HSBC Bank Australia Limited',             'primary_business' => 'Bank',                            'complaints_received' =>  770, 'complaints_resolved' =>  485, 'resolution_rate' => 61.86],
        ['firm_name' => 'Hollard Insurance Partners Limited',      'primary_business' => 'General Insurer',                 'complaints_received' =>  762, 'complaints_resolved' =>  363, 'resolution_rate' => 47.45],
        ['firm_name' => 'Youi Pty Ltd',                            'primary_business' => 'General Insurer',                 'complaints_received' =>  750, 'complaints_resolved' =>  244, 'resolution_rate' => 32.88],
        ['firm_name' => 'Allianz Australia General Insurance Limited', 'primary_business' => 'General Insurer',            'complaints_received' =>  712, 'complaints_resolved' =>  314, 'resolution_rate' => 39.80],
        ['firm_name' => 'The Hollard Insurance Company Pty Ltd',   'primary_business' => 'General Insurer',                 'complaints_received' =>  710, 'complaints_resolved' =>  366, 'resolution_rate' => 50.07],
        ['firm_name' => 'H.E.S.T. Australia Limited',              'primary_business' => 'Superannuation Trustee',          'complaints_received' =>  692, 'complaints_resolved' =>  618, 'resolution_rate' => 72.96],
        ['firm_name' => 'Bank of Western Australia Limited',       'primary_business' => 'Bank',                            'complaints_received' =>  647, 'complaints_resolved' =>  369, 'resolution_rate' => 57.03],
        ['firm_name' => 'Norfin Limited',                          'primary_business' => 'Bank',                            'complaints_received' =>  597, 'complaints_resolved' =>  393, 'resolution_rate' => 61.99],
        ['firm_name' => 'Citigroup Pty Limited',                   'primary_business' => 'Bank',                            'complaints_received' =>  583, 'complaints_resolved' =>  576, 'resolution_rate' => 73.28],
        ['firm_name' => 'Zurich Australian Insurance Limited',     'primary_business' => 'General Insurer',                 'complaints_received' =>  572, 'complaints_resolved' =>  362, 'resolution_rate' => 61.88],
        ['firm_name' => 'RAC Insurance Pty Limited',               'primary_business' => 'General Insurer',                 'complaints_received' =>  532, 'complaints_resolved' =>  128, 'resolution_rate' => 24.38],
        ['firm_name' => 'TAL Life Limited',                        'primary_business' => 'Life Insurer',                    'complaints_received' =>  508, 'complaints_resolved' =>   64, 'resolution_rate' => 10.94],
        ['firm_name' => 'Wise Australia Pty Ltd',                  'primary_business' => 'FinTech',                         'complaints_received' =>  379, 'complaints_resolved' =>  119, 'resolution_rate' => 32.43],
        ['firm_name' => 'Toyota Finance Australia Limited',        'primary_business' => 'Credit Provider',                 'complaints_received' =>  251, 'complaints_resolved' =>  127, 'resolution_rate' => 43.64],
        ['firm_name' => 'Humm Cards Pty Ltd',                      'primary_business' => 'Credit Provider',                 'complaints_received' =>  163, 'complaints_resolved' =>  110, 'resolution_rate' => 68.75],
        ['firm_name' => 'Resimac Asset Finance Pty Limited',       'primary_business' => 'Credit Provider',                 'complaints_received' =>  149, 'complaints_resolved' =>   79, 'resolution_rate' => 50.32],
        ['firm_name' => 'Secure Funding Pty Ltd',                  'primary_business' => 'Credit Provider',                 'complaints_received' =>  145, 'complaints_resolved' =>   70, 'resolution_rate' => 46.36],
        ['firm_name' => 'Uber Pacific Pty Ltd',                    'primary_business' => 'Product Issuer',                  'complaints_received' =>   44, 'complaints_resolved' =>   14, 'resolution_rate' => 29.17],
        ['firm_name' => 'Western Union Financial Services Pty Ltd','primary_business' => 'Non-Cash Payment System Provider', 'complaints_received' =>   63, 'complaints_resolved' =>   24, 'resolution_rate' => 40.00],
        ['firm_name' => 'Experian Australia Credit Services Pty Ltd', 'primary_business' => 'Credit Reporting Agency',     'complaints_received' =>   39, 'complaints_resolved' =>    9, 'resolution_rate' => 27.27],
        ['firm_name' => 'Capify Australia Pty Ltd',                'primary_business' => 'FinTech',                         'complaints_received' =>   23, 'complaints_resolved' =>    4, 'resolution_rate' => 22.22],
    ];

    public function run(): void
    {
        // Clear existing data for this year to allow re-seeding
        AfcaInsight::where('period_year', self::PERIOD_YEAR)->delete();

        foreach (self::DATA as $row) {
            // Best-effort name match to an existing company
            $company = Company::whereRaw('LOWER(name) = ?', [strtolower($row['firm_name'])])
                ->orWhereRaw('LOWER(name) LIKE ?', ['%' . strtolower(explode(' ', $row['firm_name'])[0]) . '%'])
                ->first();

            AfcaInsight::create([
                'company_id'          => $company?->id,
                'firm_name'           => $row['firm_name'],
                'primary_business'    => $row['primary_business'],
                'period_year'         => self::PERIOD_YEAR,
                'complaints_received' => $row['complaints_received'],
                'complaints_resolved' => $row['complaints_resolved'],
                'resolution_rate'     => $row['resolution_rate'],
            ]);
        }

        $matched = AfcaInsight::where('period_year', self::PERIOD_YEAR)->whereNotNull('company_id')->count();
        $total   = count(self::DATA);
        $this->command->info("AFCA seeder: {$total} records inserted, {$matched} matched to existing companies.");
    }
}
