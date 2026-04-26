@php
    $frontend    = rtrim(config('app.frontend_url'), '/');
    $url         = $frontend . '/companies/' . $company->slug;
    $name        = e($company->name);
    $industry    = $company->industry ? e(ucfirst($company->industry)) : 'Business';
    $score       = $company->score?->score ? round($company->score->score) : null;
    $band        = $company->score?->badge ?? 'not_rated';
    $total       = $company->score?->total_complaints ?? 0;
    $resolved    = $company->score?->resolved_count ?? 0;

    $titleScore  = $score ? " · Score {$score}/100" : '';
    $title       = "{$name} complaints & reviews{$titleScore} — Aus Fair Go";

    $descParts   = ["{$name} has {$total} " . ($total === 1 ? 'complaint' : 'complaints') . " on Aus Fair Go."];
    if ($score)  $descParts[] = "Accountability score: {$score}/100 ({$band}).";
    if ($resolved > 0) $descParts[] = "{$resolved} resolved.";
    $descParts[] = "See what Australian consumers are saying.";
    $description = implode(' ', $descParts);

    $ogImage = $frontend . '/og-default.png';

    // Schema.org: LocalBusiness + AggregateRating
    $schema = [
        '@context' => 'https://schema.org',
        '@type'    => 'Organization',
        'name'     => $company->name,
        'url'      => $url,
    ];
    if ($company->website) $schema['sameAs'] = $company->website;
    if ($company->abn)     $schema['taxID']  = $company->abn;
    if ($total > 0 && $score) {
        $schema['aggregateRating'] = [
            '@type'       => 'AggregateRating',
            'ratingValue' => round($score / 20, 1), // convert 0-100 → 0-5 stars
            'bestRating'  => '5',
            'worstRating' => '1',
            'reviewCount' => $total,
        ];
    }
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{{ $title }}</title>
  <meta name="description" content="{{ $description }}" />
  <link rel="canonical" href="{{ $url }}" />

  {{-- Open Graph --}}
  <meta property="og:type"        content="website" />
  <meta property="og:url"         content="{{ $url }}" />
  <meta property="og:site_name"   content="Aus Fair Go" />
  <meta property="og:title"       content="{{ $title }}" />
  <meta property="og:description" content="{{ $description }}" />
  <meta property="og:image"       content="{{ $ogImage }}" />

  {{-- Twitter --}}
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="{{ $title }}" />
  <meta name="twitter:description" content="{{ $description }}" />
  <meta name="twitter:image"       content="{{ $ogImage }}" />

  {{-- Schema.org --}}
  <script type="application/ld+json">{!! json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) !!}</script>
</head>
<body>
  <h1>{{ $name }} — complaints &amp; reviews</h1>
  <p>{{ $description }}</p>
  <p><a href="{{ $url }}">View {{ $name }} on Aus Fair Go</a></p>
</body>
</html>
