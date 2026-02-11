<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail as BaseVerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;

class VerifyEmailNotification extends BaseVerifyEmail
{
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

