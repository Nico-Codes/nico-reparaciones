<?php

namespace App\Mail;

use App\Support\MailDispatch;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

class AdminDashboardWeeklyReportMail extends Mailable
{
    use Queueable, SerializesModels;

    public int $tries;

    /**
     * @var array<int, int>
     */
    public array $backoff;

    /**
     * @param  array<string, float|int|null>  $kpis
     */
    public function __construct(
        public int $rangeDays,
        public Carbon $fromRange,
        public Carbon $toRange,
        public array $kpis,
        public string $csvFilename,
        public string $csvContent
    ) {
        $this->tries = MailDispatch::tries();
        $this->backoff = MailDispatch::backoffSeconds();
        MailDispatch::applyQueueMetadata($this);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reporte dashboard semanal ('.$this->rangeDays.' dias)'
        );
    }

    public function content(): Content
    {
        return new Content(
            text: 'emails.admin_dashboard_weekly_report_text'
        );
    }

    /**
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [
            \Illuminate\Mail\Mailables\Attachment::fromData(fn (): string => $this->csvContent, $this->csvFilename)
                ->withMime('text/csv; charset=UTF-8'),
        ];
    }
}
