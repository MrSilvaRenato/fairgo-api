<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/sitemap.xml', \App\Http\Controllers\SitemapController::class);

// Bot prerender routes — BotPrerender middleware intercepts crawlers and returns meta HTML.
// Regular users get the React SPA index.html served directly by Laravel.
Route::get('/companies/{slug}', function () {
    return response()->file(public_path('app/index.html'));
});
Route::get('/complaints/{id}', function () {
    return response()->file(public_path('app/index.html'));
});
