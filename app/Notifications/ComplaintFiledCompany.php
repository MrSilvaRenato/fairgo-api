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

        return (new MailMessage)
            ->subject('New complaint filed against ' . $this->complaint->company->name . ' — Aus Fair Go')
            ->view('emails.complaint-filed-company', [
                'name'         => $notifiable->name,
                'companyName'  => $this->complaint->company->name,
                'title'        => $this->complaint->title,
                'consumer'     => $this->complaint->consumer->name ?? 'A customer',
                'complaintUrl' => $complaintUrl,
                'dashUrl'      => $dashUrl,
            ]);
    }

    public function toArray(object $notifiable): array
    {
        return ['complaint_id' => $this->complaint->id];
    }
}
