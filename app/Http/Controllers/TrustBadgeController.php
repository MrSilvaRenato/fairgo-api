<?php

namespace App\Http\Controllers;

use App\Models\Company;

class TrustBadgeController extends Controller
{
    // GET /badge/{slug}  — public JSON for widget
    public function show(string $slug)
    {
        $company = Company::where('slug', $slug)->with(['score', 'subscription'])->firstOrFail();
        $score   = $company->score;

        return response()->json([
            'name'            => $company->name,
            'slug'            => $company->slug,
            'score'           => $score ? round($score->score) : null,
            'badge'           => $score?->badge ?? 'not_rated',
            'response_rate'   => $score ? round($score->response_rate * 100) : null,
            'resolution_rate' => $score ? round($score->resolution_rate * 100) : null,
            'total_complaints'=> $score?->total_complaints ?? 0,
            'verified'        => $company->verified_badge,
            'profile_url'     => config('app.frontend_url', 'https://fairgo.com.au') . '/companies/' . $company->slug,
        ])->withHeaders(['Access-Control-Allow-Origin' => '*']);
    }

    // GET /badge/{slug}/embed.js — paste on any website
    public function embedScript(string $slug)
    {
        $apiBase    = config('app.url') . '/api';
        $frontendUrl = config('app.frontend_url', 'https://fairgo.com.au');

        $js = <<<JS
(function () {
  'use strict';
  var SLUG    = "{$slug}";
  var API     = "{$apiBase}/badge/" + SLUG;
  var SITE    = "{$frontendUrl}";

  var COLORS = {
    excellent: { bg: '#f0fdf4', border: '#86efac', score: '#16a34a', label: '#15803d' },
    good:      { bg: '#f0fdf4', border: '#a3e635', score: '#4d7c0f', label: '#3f6212' },
    regular:   { bg: '#fffbeb', border: '#fcd34d', score: '#b45309', label: '#92400e' },
    poor:      { bg: '#fff1f2', border: '#fca5a5', score: '#dc2626', label: '#991b1b' },
    not_rated: { bg: '#f9fafb', border: '#e5e7eb', score: '#6b7280', label: '#4b5563' },
  };

  fetch(API)
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var el = document.getElementById('fairgo-badge');
      if (!el) return;

      var c     = COLORS[d.badge] || COLORS.not_rated;
      var score = d.score !== null ? d.score : '—';
      var label = d.badge.replace('_', ' ');
      label     = label.charAt(0).toUpperCase() + label.slice(1);

      el.innerHTML =
        '<a href="' + d.profile_url + '" target="_blank" rel="noopener noreferrer" ' +
        'style="display:inline-flex;align-items:center;gap:10px;padding:10px 16px;' +
        'border:1.5px solid ' + c.border + ';border-radius:12px;text-decoration:none;' +
        'font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;' +
        'background:' + c.bg + ';cursor:pointer;max-width:260px;">' +
        /* Score circle */
        '<span style="display:flex;align-items:center;justify-content:center;' +
        'width:44px;height:44px;border-radius:50%;border:2px solid ' + c.border + ';' +
        'background:#fff;flex-shrink:0;">' +
        '<strong style="font-size:16px;color:' + c.score + ';">' + score + '</strong>' +
        '</span>' +
        /* Text */
        '<span style="line-height:1.35;">' +
        '<strong style="display:block;font-size:13px;color:#111;">' + d.name + '</strong>' +
        '<span style="display:block;font-size:11px;color:' + c.label + ';font-weight:600;text-transform:capitalize;">' + label + '</span>' +
        (d.verified ? '<span style="display:block;font-size:10px;color:#16a34a;">✓ Fair Go Verified</span>' : '') +
        '<span style="display:block;font-size:10px;color:#9ca3af;margin-top:1px;">fairgo.com.au</span>' +
        '</span>' +
        '</a>';
    })
    .catch(function () { /* silently fail — badge simply doesn't render */ });
})();
JS;

        return response($js, 200, [
            'Content-Type'                => 'application/javascript',
            'Cache-Control'               => 'public, max-age=300',
            'Access-Control-Allow-Origin' => '*',
        ]);
    }
}
