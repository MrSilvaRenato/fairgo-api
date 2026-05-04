<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\ComplaintReopenController;
use App\Http\Controllers\PhoneVerificationController;
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
use App\Http\Controllers\AbnVerificationController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\CompanyClaimController;
use Illuminate\Support\Facades\Route;

// Auth routes
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('login',    [AuthController::class, 'login'])->middleware('throttle:5,1');

    // Password reset (public)
    Route::post('forgot-password', [PasswordResetController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('reset-password',  [PasswordResetController::class, 'resetPassword'])->middleware('throttle:5,1');

    // Email verification — verify uses signed URL (public), resend requires auth
    Route::get('email/verify', [\App\Http\Controllers\EmailVerificationController::class, 'verify'])
        ->name('verification.verify');

    // Public resend — used on login when the user has no token yet
    Route::post('email/resend-public', [\App\Http\Controllers\EmailVerificationController::class, 'resendByEmail'])
        ->middleware('throttle:3,60');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout',          [AuthController::class, 'logout']);
        Route::get('me',               [AuthController::class, 'me']);
        Route::delete('account',       \App\Http\Controllers\DeleteAccountController::class);
        Route::post('phone/send',    [PhoneVerificationController::class, 'send'])->middleware('throttle:3,60');
        Route::post('phone/verify',  [PhoneVerificationController::class, 'verify']);
        Route::post('email/resend',  [\App\Http\Controllers\EmailVerificationController::class, 'resend'])->middleware('throttle:3,60');
    });
});

// Public ABN endpoints (used by complaint form)
Route::get('abn/search',      [\App\Http\Controllers\AbnSearchController::class, 'search']);
Route::get('abn/check/{abn}', [\App\Http\Controllers\AbnCheckController::class, 'check']);

// Search & leaderboard
Route::get('search',      SearchController::class);
Route::get('leaderboard',     \App\Http\Controllers\LeaderboardController::class);
Route::get('most-complained', \App\Http\Controllers\MostComplainedController::class);

// Trust badge — public, CORS open
Route::get('badge/{slug}',          [TrustBadgeController::class, 'show']);
Route::get('badge/{slug}/embed.js', [TrustBadgeController::class, 'embedScript']);

// Company routes
Route::prefix('companies')->group(function () {
    Route::get('abn/{abn}',          [CompanyController::class, 'lookupAbn']);
    Route::get('{slug}/performance', [CompanyController::class, 'performance']);
    Route::get('{slug}',             [CompanyController::class, 'show']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/', [CompanyController::class, 'store']);
        Route::post('{company}/claim', [CompanyClaimController::class, 'store']);
    });
});

// Complaint routes
Route::prefix('complaints')->group(function () {
    Route::get('/',                [ComplaintController::class, 'index']);
    Route::get('category-counts',  [ComplaintController::class, 'categoryCounts']);
    Route::get('company-search',   [CompanyController::class, 'search']);
    Route::get('{complaint}',               [ComplaintController::class, 'show']);
    Route::get('{complaint}/replies',       [ComplaintReplyController::class, 'index']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/',                              [ComplaintController::class, 'store']);
        Route::post('{complaint}/response',           [CompanyResponseController::class, 'store']);
        Route::post('{complaint}/feedback',           [ResolutionFeedbackController::class, 'store']);
        Route::post('{complaint}/replies',            [ComplaintReplyController::class, 'store']);
        Route::post('{complaint}/reopen',             ComplaintReopenController::class);
        Route::post('{complaint}/mark-read',          [ComplaintReplyController::class, 'markRead']);
    });
});

// Consumer dashboard
Route::middleware('auth:sanctum')->group(function () {
    Route::get('dashboard/consumer',  ConsumerDashboardController::class);
    Route::get('dashboard/company',   CompanyDashboardController::class);
    Route::patch('company/settings',  [CompanyController::class, 'updateSettings']);
    Route::post('company/logo',       [CompanyController::class, 'uploadLogo']);
    Route::post('company/abn/verify', [AbnVerificationController::class, 'verify']);
});

// Notifications
Route::middleware('auth:sanctum')->group(function () {
    Route::get('notifications',                          [NotificationController::class, 'index']);
    Route::get('notifications/unread-count',             [NotificationController::class, 'unreadCount']);
    Route::patch('notifications/{notification}/read',    [NotificationController::class, 'markRead']);
    Route::post('notifications/read-all',                [NotificationController::class, 'markAllRead']);
    Route::delete('notifications',                       [NotificationController::class, 'clearAll']);
});

// User profile
Route::middleware('auth:sanctum')->group(function () {
    Route::get('profile',                    [\App\Http\Controllers\ProfileController::class, 'show']);
    Route::patch('profile',                  [\App\Http\Controllers\ProfileController::class, 'update']);
    Route::post('profile/id-verification',   [\App\Http\Controllers\ProfileController::class, 'uploadId']);
});

// Analytics — Standard or Pro plan required
Route::middleware(['auth:sanctum', 'requires.plan:standard,pro'])->group(function () {
    Route::get('dashboard/analytics', CompanyAnalyticsController::class);
});

// AI draft response (company admins only)
Route::middleware(['auth:sanctum', 'throttle:20,1'])->post('ai/draft-response', [App\Http\Controllers\AiDraftController::class, 'draft']);

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
    Route::get('complaints/category-counts',    [AdminController::class, 'complaintCategoryCounts']);
    Route::put('complaints/{complaint}',        [AdminController::class, 'updateComplaint']);
    Route::get('companies',                     [AdminController::class, 'companies']);
    Route::put('companies/{company}',            [AdminController::class, 'updateCompany']);
    Route::post('companies/{company}/refresh-abn', [AdminController::class, 'refreshAbn']);
    Route::delete('companies/{company}',         [AdminController::class, 'deleteCompany']);
    Route::get('users',                         [AdminController::class, 'users']);
    Route::put('users/{user}',                  [AdminController::class, 'updateUser']);
    Route::get('moderation',                    [AdminController::class, 'moderationQueue']);
    Route::put('moderation/{complaint}',        [AdminController::class, 'moderationDecision']);
    Route::get('id-verifications',                   [AdminController::class, 'idVerifications']);
    Route::post('id-verifications/{user}/approve',   [AdminController::class, 'approveId']);
    Route::post('id-verifications/{user}/reject',    [AdminController::class, 'rejectId']);
    Route::get('stub-companies',                     [AdminController::class, 'stubCompanies']);
    Route::post('stub-companies/{company}/promote',  [AdminController::class, 'promoteStub']);
    Route::post('stub-companies/{company}/reject',   [AdminController::class, 'rejectStub']);
    Route::get('claims',                             [CompanyClaimController::class, 'index']);
    Route::post('claims/{claim}/approve',            [CompanyClaimController::class, 'approve']);
    Route::post('claims/{claim}/reject',             [CompanyClaimController::class, 'reject']);
});
