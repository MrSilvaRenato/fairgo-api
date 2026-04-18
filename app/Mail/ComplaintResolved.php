<?php

namespace App\Mail;

use App\Models\Complaint;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ComplaintResolved extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Complaint $complaint) {}

    public function envelope(): Envelope
    {
        $status = $this->complaint->status === 'resolved' ? 'resolved' : 'marked unresolved';
        return new Envelope(subject: "Complaint {$status} — Fair Go");
    }

    public function content(): Content
    {
        return new Content(markdown: 'emails.complaint-resolved');
    }

    public function attachments(): array
    {
        return [];
    }
}
