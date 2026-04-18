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
            ->subject($this->complaint->company->name . ' has responded to your complaint — Fair Go')
            ->greeting('Hi ' . $notifiable->name . ',')
            ->line('**' . $this->complaint->company->name . '** has replied to your complaint:')
            ->line('> "' . $this->complaint->title . '"')
            ->action('Read their response', $url)
            ->line('You can reply, continue the conversation, or mark it as resolved.')
            ->salutation('The Fair Go team');
    }

    public function toArray(object $notifiable): array
    {
        return ['complaint_id' => $this->complaint->id];
    }
}
