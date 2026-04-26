<?php

namespace App\Http\Middleware;

use App\Models\Company;
use App\Models\Complaint;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BotPrerender
{
    /**
     * Known crawler user-agent strings.
     * Covers Google, Bing, Facebook, Twitter/X, LinkedIn, Slack, WhatsApp, Discord.
     */
    private const BOT_PATTERNS = [
        'googlebot', 'google-inspectiontool', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
        'yandexbot', 'sogou', 'exabot', 'facebookexternalhit', 'facebot',
        'twitterbot', 'linkedinbot', 'whatsapp', 'discordbot', 'slackbot',
        'telegrambot', 'applebot', 'semrushbot', 'ahrefsbot', 'mj12bot',
        'rogerbot', 'dotbot', 'ia_archiver', 'prerender',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        if (!$this->isBot($request)) {
            return $next($request);
        }

        $path = trim($request->path(), '/');

        // /companies/{slug}
        if (preg_match('#^companies/([^/]+)$#', $path, $m)) {
            $company = Company::with('score')
                ->where('slug', $m[1])
                ->first();

            if ($company) {
                return response(view('prerender.company', compact('company'))->render(), 200)
                    ->header('Content-Type', 'text/html; charset=UTF-8');
            }
        }

        // /complaints/{id}
        if (preg_match('#^complaints/(\d+)$#', $path, $m)) {
            $complaint = Complaint::with(['company:id,name,slug', 'consumer:id,name'])
                ->where('is_public', true)
                ->where('status', '!=', 'removed')
                ->find((int) $m[1]);

            if ($complaint) {
                return response(view('prerender.complaint', compact('complaint'))->render(), 200)
                    ->header('Content-Type', 'text/html; charset=UTF-8');
            }
        }

        return $next($request);
    }

    private function isBot(Request $request): bool
    {
        $ua = strtolower($request->userAgent() ?? '');
        if (!$ua) return false;

        foreach (self::BOT_PATTERNS as $pattern) {
            if (str_contains($ua, $pattern)) {
                return true;
            }
        }

        return false;
    }
}
