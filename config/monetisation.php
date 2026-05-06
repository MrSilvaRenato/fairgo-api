<?php

return [
    'minimums' => [
        'monthly_organic_traffic' => (int) env('MONETISATION_MIN_MONTHLY_ORGANIC_TRAFFIC', 10000),
        'indexed_company_pages' => (int) env('MONETISATION_MIN_INDEXED_COMPANY_PAGES', 500),
        'complaint_volume' => (int) env('MONETISATION_MIN_COMPLAINT_VOLUME', 1000),
        'business_claim_response_activity' => (int) env('MONETISATION_MIN_BUSINESS_CLAIM_RESPONSE_ACTIVITY', 100),
    ],

    'actuals' => [
        'monthly_organic_traffic' => env('MONETISATION_MONTHLY_ORGANIC_TRAFFIC'),
        'indexed_company_pages' => env('MONETISATION_INDEXED_COMPANY_PAGES'),
    ],

    'rules' => [
        'no_pay_to_remove' => true,
        'no_pay_to_suppress' => true,
        'no_paid_ranking_manipulation' => true,
    ],
];
