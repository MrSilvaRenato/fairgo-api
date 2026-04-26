<?php

namespace App\Notifications;

use App\Models\Complaint;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent to the CONSUMER when the company posts a reply on their complaint.
 */
class CompanyRepliedConsumer extends Notification implements ShouldQueue
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
            ->subject($this->complaint->company->name . ' has responded — Aus Fair Go')
            ->view('emails.company-replied-consumer', [
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
