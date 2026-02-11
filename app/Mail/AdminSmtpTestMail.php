<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdminSmtpTestMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $sentByEmail,
        public string $appEnv,
        public string $appUrl
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Prueba SMTP - NicoReparaciones'
        );
    }

    public function content(): Content
    {
        return new Content(
            text: 'emails.admin_smtp_test_text'
        );
    }

    /**
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}

