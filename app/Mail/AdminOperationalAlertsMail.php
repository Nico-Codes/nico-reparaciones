<?php

namespace App\Mail;

use App\Support\MailDispatch;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdminOperationalAlertsMail extends Mailable
{
    use Queueable, SerializesModels;

    public int $tries;

    /**
     * @var array<int, int>
     */
    public array $backoff;

    /**
     * @param  array<int, array<string, mixed>>  $orders
     * @param  array<int, array<string, mixed>>  $repairs
     */
    public function __construct(
        public int $orderThresholdHours,
        public int $repairThresholdDays,
        public int $ordersCount,
        public int $repairsCount,
        public array $orders,
        public array $repairs
    ) {
        $this->tries = MailDispatch::tries();
        $this->backoff = MailDispatch::backoffSeconds();
        MailDispatch::applyQueueMetadata($this);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Alertas operativas: '.$this->ordersCount.' pedidos / '.$this->repairsCount.' reparaciones'
        );
    }

    public function content(): Content
    {
        return new Content(
            text: 'emails.admin_operational_alerts_text'
        );
    }
}

