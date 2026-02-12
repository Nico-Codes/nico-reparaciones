<?php

namespace App\Notifications;

use App\Support\MailDispatch;
use App\Support\MailTemplateSettings;
use Illuminate\Auth\Notifications\ResetPassword as BaseResetPassword;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends BaseResetPassword implements ShouldQueue
{
    use Queueable;

    public int $tries;

    /**
     * @var array<int, int>
     */
    public array $backoff;

    public function __construct(string $token)
    {
        parent::__construct($token);

        $this->tries = MailDispatch::tries();
        $this->backoff = MailDispatch::backoffSeconds();
        MailDispatch::applyQueueMetadata($this);
    }

    public function toMail($notifiable): MailMessage
    {
        $resetUrl = $this->resetUrl($notifiable);
        $expireMinutes = (int) config('auth.passwords.'.config('auth.defaults.passwords').'.expire', 60);
        $tokens = [
            'name' => (string) ($notifiable->name ?? ''),
            'expire_minutes' => (string) $expireMinutes,
        ];

        return (new MailMessage)
            ->subject(MailTemplateSettings::resolve('reset_password', 'subject', $tokens))
            ->greeting(MailTemplateSettings::resolve('reset_password', 'greeting', $tokens))
            ->line(MailTemplateSettings::resolve('reset_password', 'intro_line', $tokens))
            ->action(MailTemplateSettings::resolve('reset_password', 'action_label', $tokens), $resetUrl)
            ->line(MailTemplateSettings::resolve('reset_password', 'expiry_line', $tokens))
            ->line(MailTemplateSettings::resolve('reset_password', 'outro_line', $tokens));
    }
}
