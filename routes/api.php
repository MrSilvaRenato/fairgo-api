<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\TrustBadgeController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\ComplaintController;
use App\Http\Controllers\ComplaintReplyController;
use App\Http\Controllers\CompanyResponseController;
use App\Http\Controllers\ResolutionFeedbackController;
use App\Http\Controllers\CompanyAnalyticsController;
use App\Http\Controllers\CompanyDashboardController;
use App\Http\Controllers\ConsumerDashboardController;
use App\Http\Controllers\SearchController;
use Illuminate\Support\Facades\Route;

// Auth routes
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login',    [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me',      [AuthController::class, 'me']);
    });
});

// Search & leaderboard
Route::get('search',      SearchController::class);
Route::get('leaderboard', \App\Http\Controllers\LeaderboardController::class);

// Trust badge — public, CORS open
Route::get('badge/{slug}',          [TrustBadgeController::class, 'show']);
Route::get('badge/{slug}/embed.js', [TrustBadgeController::class, 'embedScript']);

// Company routes
Route::prefix('companies')->group(function () {
    Route::get('abn/{abn}',  [CompanyController::class, 'lookupAbn']);
    Route::get('{slug}',     [CompanyController::class, 'show']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/', [CompanyController::class, 'store']);
    });
});

// Complaint routes
Route::prefix('complaints')->group(function () {
    Route::get('/',               [ComplaintController::class, 'index']);
    Route::get('company-search',  [CompanyController::class, 'search']);
    Route::get('{complaint}',     [ComplaintController::class, 'show']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/',                              [ComplaintController::class, 'store']);
        Route::post('{complaint}/response',           [CompanyResponseController::class, 'store']);
        Route::post('{complaint}/feedback',           [ResolutionFeedbackController::class, 'store']);
        Route::get('{complaint}/replies',             [ComplaintReplyController::class, 'index']);
        Route::post('{complaint}/replies',            [ComplaintReplyController::class, 'store']);
    });
});

// Consumer dashboard
Route::middleware('auth:sanctum')->group(function () {
    Route::get('dashboard/consumer', ConsumerDashboardController::class);
    Route::get('dashboard/company',   CompanyDashboardController::class);
});

// Analytics — Standard or Pro plan required
Route::middleware(['auth:sanctum', 'requires.plan:standard,pro'])->group(function () {
    Route::get('dashboard/analytics', CompanyAnalyticsController::class);
});

// Billing
Route::post('billing/webhook', [BillingController::class, 'webhook']);
Route::middleware('auth:sanctum')->group(function () {
    Route::get('billing/plans',      [BillingController::class, 'plans']);
    Route::post('billing/checkout',  [BillingController::class, 'checkout']);
    Route::post('billing/cancel',    [BillingController::class, 'cancel']);
});

// Admin routes
Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('stats',                         [AdminController::class, 'stats']);
    Route::get('complaints',                    [AdminController::class, 'complaints']);
    Route::put('complaints/{complaint}',        [AdminController::class, 'updateComplaint']);
    Route::get('companies',                     [AdminController::class, 'companies']);
    Route::put('companies/{company}',           [AdminController::class, 'updateCompany']);
    Route::get('users',                         [AdminController::class, 'users']);
});
