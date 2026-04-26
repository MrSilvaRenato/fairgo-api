<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class IdVerificationApproved extends Notification implements ShouldQueue
{
    use Queueable;

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $profileUrl = rtrim(config('app.frontend_url'), '/') . '/profile';

        return (new MailMessage)
            ->subject('Your identity has been verified — Aus Fair Go')
            ->view('emails.id-verification-approved', [
                'name'       => $notifiable->name,
                'profileUrl' => $profileUrl,
            ]);
    }
}
