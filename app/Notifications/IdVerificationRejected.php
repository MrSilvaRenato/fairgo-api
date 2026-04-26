<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class IdVerificationRejected extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private ?string $note = null) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $profileUrl = rtrim(config('app.frontend_url'), '/') . '/profile';

        return (new MailMessage)
            ->subject('Update on your identity verification — Aus Fair Go')
            ->view('emails.id-verification-rejected', [
                'name'       => $notifiable->name,
                'note'       => $this->note,
                'profileUrl' => $profileUrl,
            ]);
    }
}
