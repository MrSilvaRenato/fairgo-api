<?php

namespace App\Notifications;

use App\Models\Complaint;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent to the COMPANY ADMIN when a new complaint is filed against them.
 * Notifiable = company->user (the company_admin account).
 */
class ComplaintFiledCompany extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private Complaint $complaint) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $dashUrl      = rtrim(config('app.frontend_url', config('app.url')), '/') . '/company/dashboard';
        $complaintUrl = rtrim(config('app.frontend_url', config('app.url')), '/') . '/complaints/' . $this->complaint->id;
        $consumer     = $this->complaint->consumer->name ?? 'A customer';
        $title        = $this->complaint->title;

        return (new MailMessage)
            ->subject('New complaint filed against ' . $this->complaint->company->name . ' — Fair Go')
            ->greeting('Hi ' . $notifiable->name . ',')
            ->line($consumer . ' has filed a complaint: **"' . $title . '"**')
            ->line('This complaint is now **publicly visible** on your Fair Go profile.')
            ->line('You have **7 days** to respond. Unanswered complaints impact your score.')
            ->action('Respond now', $complaintUrl)
            ->line('Manage all complaints from your dashboard.')
            ->action('Go to dashboard', $dashUrl)
            ->salutation('Fair Go');
    }

    public function toArray(object $notifiable): array
    {
        return ['complaint_id' => $this->complaint->id];
    }
}
