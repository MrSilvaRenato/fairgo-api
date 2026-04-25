<?php

namespace App\Notifications;

use App\Models\CompanyClaim;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ClaimApproved extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private CompanyClaim $claim) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $dashboardUrl = rtrim(config('app.frontend_url'), '/') . '/company/dashboard';

        return (new MailMessage)
            ->subject('Your claim was approved — Aus Fair Go')
            ->view('emails.claim-approved', [
                'name'         => $this->claim->claimant_name,
                'companyName'  => $this->claim->company->name,
                'dashboardUrl' => $dashboardUrl,
            ]);
    }
}
