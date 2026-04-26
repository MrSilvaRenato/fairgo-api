<?php

namespace App\Notifications;

use App\Models\CompanyClaim;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ClaimRejected extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private CompanyClaim $claim) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Update on your claim — Aus Fair Go')
            ->view('emails.claim-rejected', [
                'name'        => $this->claim->claimant_name,
                'companyName' => $this->claim->company->name,
                'reason'      => $this->claim->rejection_reason,
            ]);
    }
}
