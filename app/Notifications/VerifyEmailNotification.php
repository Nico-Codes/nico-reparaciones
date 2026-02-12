<?php

namespace App\Notifications;

use App\Support\MailDispatch;
use App\Support\MailTemplateSettings;
use Illuminate\Auth\Notifications\VerifyEmail as BaseVerifyEmail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

class VerifyEmailNotification extends BaseVerifyEmail implements ShouldQueue
{
    use Queueable;

    public int $tries;

    /**
     * @var array<int, int>
     */
    public array $backoff;

    public function __construct()
    {
        $this->tries = MailDispatch::tries();
        $this->backoff = MailDispatch::backoffSeconds();
        MailDispatch::applyQueueMetadata($this);
    }

    public function toMail($notifiable): MailMessage
    {
        $verificationUrl = $this->verificationUrl($notifiable);
        $expireMinutes = (int) config('auth.verification.expire', 60);
        $tokens = [
            'name' => (string) ($notifiable->name ?? ''),
            'expire_minutes' => (string) $expireMinutes,
        ];

        return (new MailMessage)
            ->subject(MailTemplateSettings::resolve('verify_email', 'subject', $tokens))
            ->greeting(MailTemplateSettings::resolve('verify_email', 'greeting', $tokens))
            ->line(MailTemplateSettings::resolve('verify_email', 'intro_line', $tokens))
            ->action(MailTemplateSettings::resolve('verify_email', 'action_label', $tokens), $verificationUrl)
            ->line(MailTemplateSettings::resolve('verify_email', 'expiry_line', $tokens))
            ->line(MailTemplateSettings::resolve('verify_email', 'outro_line', $tokens));
    }
}
