<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword as BaseResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends BaseResetPassword
{
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

