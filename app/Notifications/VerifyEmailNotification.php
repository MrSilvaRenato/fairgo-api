<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

class VerifyEmailNotification extends VerifyEmail
{
    protected function verificationUrl($notifiable): string
    {
        $backendUrl = URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
            ['id' => $notifiable->getKey(), 'hash' => sha1($notifiable->getEmailForVerification())]
        );

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

    public function toMail($notifiable): MailMessage
    {
        $url = $this->verificationUrl($notifiable);

        return (new MailMessage)
            ->subject('Verify your email — Aus Fair Go')
            ->view('emails.verify-email', [
                'url'  => $url,
                'name' => $notifiable->name,
            ]);
    }
}
