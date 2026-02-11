<?php

namespace App\Notifications;

use App\Support\MailDispatch;
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

        return (new MailMessage)
            ->subject('Verifica tu correo en NicoReparaciones')
            ->greeting('Hola, '.$notifiable->name.'.')
            ->line('Gracias por crear tu cuenta. Para activarla, confirma tu correo electronico.')
            ->action('Verificar correo', $verificationUrl)
            ->line("Este enlace vence en {$expireMinutes} minutos.")
            ->line('Si no creaste esta cuenta, puedes ignorar este mensaje.');
    }
}
