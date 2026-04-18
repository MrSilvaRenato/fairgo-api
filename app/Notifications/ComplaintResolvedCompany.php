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
            ->subject(
                $resolved
                    ? 'Complaint resolved — ' . $this->complaint->title
                    : 'Complaint closed as unresolved — ' . $this->complaint->title
            )
            ->greeting('Hi ' . $notifiable->name . ',')
            ->line(
                $resolved
                    ? $consumer . ' has marked their complaint as **resolved**. Great work!'
                    : $consumer . ' has closed their complaint as **unresolved**. This will affect your Aus Fair Go score.'
            )
            ->line('Complaint: "' . $this->complaint->title . '"')
            ->action('View complaint', $url)
            ->line('Your Aus Fair Go score has been recalculated.')
            ->salutation('Aus Fair Go');
    }

    public function toArray(object $notifiable): array
    {
        return ['complaint_id' => $this->complaint->id];
    }
}
