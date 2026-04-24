<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

class VerifyEmailNotification extends VerifyEmail
{
    /**
     * Override the verification URL to point to the React frontend,
     * so clicking the link in the email lands on the SPA, not the Laravel backend.
     *
     * Frontend route: /email/verify?id=X&hash=Y&expires=Z&signature=S
     */
    protected function verificationUrl($notifiable): string
    {
        $backendUrl = URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
            ['id' => $notifiable->getKey(), 'hash' => sha1($notifiable->getEmailForVerification())]
        );

        // Parse the signed backend URL and rebuild as a frontend URL
        $parsed = parse_url($backendUrl);
        parse_str($parsed['query'] ?? '', $params);

        $frontendUrl = rtrim(config('app.frontend_url'), '/');

        return $frontendUrl . '/email/verify?' . http_build_query([
            'id'        => $notifiable->getKey(),
            'hash'      => sha1($notifiable->getEmailForVerification()),
            'expires'   => $params['expires'] ?? '',
            'signature' => $params['signature'] ?? '',
        ]);
    }
}
