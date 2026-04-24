<?php

namespace App\Notifications;

use App\Models\Complaint;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent to the COMPANY ADMIN when a consumer marks a complaint as resolved/unresolved.
 */
class ComplaintResolvedCompany extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private Complaint $complaint) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $resolved = $this->complaint->status === 'resolved';
        $url      = rtrim(config('app.frontend_url', config('app.url')), '/') . '/complaints/' . $this->complaint->id;
        $consumer = $this->complaint->consumer->name ?? 'The customer';

        return (new MailMessage)
            ->subject($resolved ? 'Complaint resolved — Aus Fair Go' : 'Complaint unresolved — Aus Fair Go')
            ->view('emails.complaint-resolved-company', [
                'name'     => $notifiable->name,
                'consumer' => $consumer,
                'title'    => $this->complaint->title,
                'resolved' => $resolved,
                'url'      => $url,
            ]);
    }

    public function toArray(object $notifiable): array
    {
        return ['complaint_id' => $this->complaint->id];
    }
}
