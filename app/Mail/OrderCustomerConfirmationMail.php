<?php

namespace App\Mail;

use App\Models\Order;
use App\Support\MailDispatch;
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
        return new Envelope(
            subject: 'Confirmacion de pedido #'.$this->order->id.' - NicoReparaciones'
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.order_customer_confirmation',
            text: 'emails.order_customer_confirmation_text'
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
