<?php

namespace App\Notifications;

use App\Models\Complaint;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent to the consumer when their complaint is removed by admin for breaching guidelines.
 */
class ComplaintRemovedConsumer extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private Complaint $complaint,
        private ?string $reason = null
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Your complaint has been removed — Aus Fair Go')
            ->view('emails.complaint-removed-consumer', [
                'name'          => $notifiable->name,
                'title'         => $this->complaint->title,
                'companyName'   => $this->complaint->company?->name ?? 'Unknown company',
                'reason'        => $this->reason,
                'guidelinesUrl' => rtrim(config('app.frontend_url', config('app.url')), '/') . '/community-guidelines',
            ]);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'complaint_id'    => $this->complaint->id,
            'complaint_title' => $this->complaint->title,
            'reason'          => $this->reason,
        ];
    }
}
