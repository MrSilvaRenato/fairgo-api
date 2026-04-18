<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;

class TrustBadgeController extends Controller
{
    // GET /badge/{slug}  — public JSON endpoint for the embeddable widget
    public function show(string $slug)
    {
        $company = Company::where('slug', $slug)
            ->with(['score', 'subscription'])
            ->firstOrFail();

        $score = $company->score;

        return response()->json([
            'name'       => $company->name,
            'slug'       => $company->slug,
            'score'      => $score ? round($score->score) : null,
            'badge'      => $score?->badge ?? 'not_rated',
            'response_rate'   => $score ? round($score->response_rate * 100) : null,
            'resolution_rate' => $score ? round($score->resolution_rate * 100) : null,
            'profile_url'     => config('app.frontend_url') . '/companies/' . $company->slug,
        ])->withHeaders([
            'Access-Control-Allow-Origin' => '*',
        ]);
    }

    // GET /badge/{slug}/embed.js  — embeddable JS widget script
    public function embedScript(string $slug)
    {
        $apiBase = config('app.url') . '/api';
        $js = <<<JS
(function () {
  var slug = "{$slug}";
  fetch("{$apiBase}/badge/" + slug)
    .then(function(r) { return r.json(); })
    .then(function(d) {
      var el = document.getElementById("fairgo-badge");
      if (!el) return;
      var colors = { excellent: "#16a34a", good: "#4ade80", regular: "#f59e0b", poor: "#ef4444", not_rated: "#9ca3af" };
      var color = colors[d.badge] || colors.not_rated;
      el.innerHTML =
        '<a href="' + d.profile_url + '" target="_blank" rel="noopener" ' +
        'style="display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border:1px solid #e5e7eb;border-radius:8px;text-decoration:none;font-family:sans-serif;font-size:13px;color:#374151;background:#fff;">' +
        '<span style="font-size:18px;font-weight:700;color:' + color + ';">' + (d.score !== null ? d.score : "—") + '</span>' +
        '<span style="line-height:1.2;">' +
        '<strong style="display:block;">' + d.name + '</strong>' +
        '<span style="color:#6b7280;text-transform:capitalize;">' + d.badge.replace("_", " ") + ' · Fair Go</span>' +
        '</span></a>';
    });
})();
JS;
        return response($js, 200, ['Content-Type' => 'application/javascript']);
    }
}
