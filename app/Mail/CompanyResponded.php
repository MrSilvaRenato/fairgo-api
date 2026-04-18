<?php

namespace App\Mail;

use App\Models\Complaint;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CompanyResponded extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Complaint $complaint) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Company has responded to your complaint — Aus Fair Go');
    }

    public function content(): Content
    {
        return new Content(markdown: 'emails.company-responded');
    }

    public function attachments(): array
    {
        return [];
    }
}
