@php
    $frontend    = rtrim(config('app.frontend_url'), '/');
    $url         = $frontend . '/complaints/' . $complaint->id;
    $companyName = e($complaint->company?->name ?? 'Unknown Company');
    $category    = ucfirst(str_replace('_', ' ', $complaint->category ?? ''));
    $status      = ucfirst($complaint->status ?? 'open');
    $snippet     = e(mb_substr($complaint->description ?? '', 0, 160));
    if (mb_strlen($complaint->description ?? '') > 160) $snippet .= '…';

    $title       = "Complaint against {$companyName}: {$complaint->title} — Aus Fair Go";
    $description = "{$category} complaint against {$companyName} on Aus Fair Go. Status: {$status}. \"{$snippet}\"";

    $ogImage     = $frontend . '/og-default.png';

    $schema = [
        '@context'     => 'https://schema.org',
        '@type'        => 'UserReview',
        'name'         => e($complaint->title),
        'reviewBody'   => $snippet,
        'url'          => $url,
        'datePublished'=> $complaint->created_at?->toIso8601String(),
        'author'       => ['@type' => 'Person', 'name' => $complaint->consumer?->name ?? 'Anonymous'],
        'itemReviewed' => [
            '@type' => 'Organization',
            'name'  => $complaint->company?->name ?? 'Unknown',
            'url'   => $frontend . '/companies/' . ($complaint->company?->slug ?? ''),
        ],
    ];
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
  <meta property="og:type"        content="article" />
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
  <h1>{{ e($complaint->title) }}</h1>
  <p>{{ $description }}</p>
  <p><a href="{{ $url }}">View this complaint on Aus Fair Go</a></p>
  <p><a href="{{ $frontend }}/companies/{{ $complaint->company?->slug }}">See all {{ $companyName }} complaints</a></p>
</body>
</html>
