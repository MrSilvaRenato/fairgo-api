<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Complaint;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    public function __invoke(): Response
    {
        $companies  = Company::select('slug', 'updated_at')->orderBy('name')->get();
        $complaints = Complaint::select('id', 'updated_at')
            ->where('is_public', true)
            ->where('status', '!=', 'removed')
            ->whereIn('moderation_status', ['approved', 'edited'])
            ->orderByDesc('updated_at')
            ->get();

        $static = [
            ['url' => '/',                    'priority' => '1.0',  'freq' => 'daily'],
            ['url' => '/search',              'priority' => '0.8',  'freq' => 'daily'],
            ['url' => '/leaderboard',         'priority' => '0.8',  'freq' => 'daily'],
            ['url' => '/most-complained',     'priority' => '0.8',  'freq' => 'daily'],
            ['url' => '/terms',               'priority' => '0.3',  'freq' => 'monthly'],
            ['url' => '/privacy',             'priority' => '0.3',  'freq' => 'monthly'],
            ['url' => '/community-guidelines','priority' => '0.3',  'freq' => 'monthly'],
        ];

        $frontend = rtrim(config('app.frontend_url'), '/');

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

        // Static pages
        foreach ($static as $page) {
            $xml .= "  <url>\n";
            $xml .= "    <loc>{$frontend}{$page['url']}</loc>\n";
            $xml .= "    <changefreq>{$page['freq']}</changefreq>\n";
            $xml .= "    <priority>{$page['priority']}</priority>\n";
            $xml .= "  </url>\n";
        }

        // Company profile pages
        foreach ($companies as $company) {
            $xml .= "  <url>\n";
            $xml .= "    <loc>{$frontend}/companies/{$company->slug}</loc>\n";
            $xml .= "    <lastmod>{$company->updated_at->toAtomString()}</lastmod>\n";
            $xml .= "    <changefreq>weekly</changefreq>\n";
            $xml .= "    <priority>0.7</priority>\n";
            $xml .= "  </url>\n";
        }

        // Public complaint pages
        foreach ($complaints as $complaint) {
            $xml .= "  <url>\n";
            $xml .= "    <loc>{$frontend}/complaints/{$complaint->id}</loc>\n";
            $xml .= "    <lastmod>{$complaint->updated_at->toAtomString()}</lastmod>\n";
            $xml .= "    <changefreq>weekly</changefreq>\n";
            $xml .= "    <priority>0.5</priority>\n";
            $xml .= "  </url>\n";
        }

        $xml .= '</urlset>';

        return response($xml, 200, ['Content-Type' => 'application/xml']);
    }
}
