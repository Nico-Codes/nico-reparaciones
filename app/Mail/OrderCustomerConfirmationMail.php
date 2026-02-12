<?php

namespace App\Mail;

use App\Models\Order;
use App\Support\MailDispatch;
use App\Support\MailTemplateSettings;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderCustomerConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    public int $tries;

    /**
     * @var array<int, int>
     */
    public array $backoff;

    public function __construct(public Order $order)
    {
        $this->tries = MailDispatch::tries();
        $this->backoff = MailDispatch::backoffSeconds();
        MailDispatch::applyQueueMetadata($this);

        $this->order->loadMissing('items');
    }

    public function envelope(): Envelope
    {
        $tokens = MailTemplateSettings::orderCustomerTokens(
            (int) $this->order->id,
            (string) $this->order->pickup_name
        );

        return new Envelope(
            subject: MailTemplateSettings::resolve('order_customer_confirmation', 'subject', $tokens)
        );
    }

    public function content(): Content
    {
        $tokens = MailTemplateSettings::orderCustomerTokens(
            (int) $this->order->id,
            (string) $this->order->pickup_name
        );

        return new Content(
            view: 'emails.order_customer_confirmation',
            text: 'emails.order_customer_confirmation_text',
            with: [
                'mailTitle' => MailTemplateSettings::resolve('order_customer_confirmation', 'title', $tokens),
                'mailIntroLine' => MailTemplateSettings::resolve('order_customer_confirmation', 'intro_line', $tokens),
                'mailFooterLine' => MailTemplateSettings::resolve('order_customer_confirmation', 'footer_line', $tokens),
            ]
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
