<?php

namespace App\Notifications;

use App\Support\MailDispatch;
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

        return (new MailMessage)
            ->subject('Recuperar contrasena - NicoReparaciones')
            ->greeting('Hola, '.$notifiable->name.'.')
            ->line('Recibimos una solicitud para restablecer tu contrasena.')
            ->action('Restablecer contrasena', $resetUrl)
            ->line("Este enlace vence en {$expireMinutes} minutos.")
            ->line('Si no solicitaste este cambio, puedes ignorar este mensaje.');
    }
}
