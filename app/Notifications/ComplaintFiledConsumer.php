<?php

namespace App\Notifications;

use App\Models\Complaint;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent to the CONSUMER immediately after filing a complaint.
 *
 * LOCAL:  logged to storage/logs/laravel.log  (MAIL_MAILER=log)
 * PROD:   set MAIL_MAILER=smtp + SMTP credentials in .env
 */
class ComplaintFiledConsumer extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private Complaint $complaint) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = rtrim(config('app.frontend_url', config('app.url')), '/') . '/complaints/' . $this->complaint->id;

        return (new MailMessage)
            ->subject('Your complaint is live — Aus Fair Go')
            ->view('emails.complaint-filed-consumer', [
                'name'        => $notifiable->name,
                'companyName' => $this->complaint->company->name,
                'title'       => $this->complaint->title,
                'url'         => $url,
            ]);
    }

    public function toArray(object $notifiable): array
    {
        return ['complaint_id' => $this->complaint->id];
    }
}
