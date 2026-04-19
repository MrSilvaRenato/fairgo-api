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
        $dashboardUrl = rtrim(config('app.frontend_url', config('app.url')), '/') . '/dashboard';

        $mail = (new MailMessage)
            ->subject('Your complaint has been removed — Aus Fair Go')
            ->greeting('Hi ' . $notifiable->name . ',')
            ->line('We have reviewed your complaint and determined that it breaches our community guidelines.')
            ->line('**Complaint:** ' . $this->complaint->title)
            ->line('**Against:** ' . ($this->complaint->company?->name ?? 'Unknown company'));

        if ($this->reason) {
            $mail->line('**Reason for removal:** ' . $this->reason);
        } else {
            $mail->line('The complaint contained content that violates our guidelines (e.g. profanity, defamatory claims, or personal attacks).');
        }

        return $mail
            ->line('If you believe this was a mistake, please contact us at hello@ausfairgo.com.au with your complaint details.')
            ->action('Review our Community Guidelines', rtrim(config('app.frontend_url', config('app.url')), '/') . '/community-guidelines')
            ->line('You are welcome to re-submit a complaint that complies with our guidelines.')
            ->salutation('The Aus Fair Go team');
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
