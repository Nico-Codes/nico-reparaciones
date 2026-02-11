<?php

namespace App\Support;

class MailHealthStatus
{
    /**
     * @return array{
     *   status:string,
     *   label:string,
     *   summary:string,
     *   mailer:string,
     *   from_address:string,
     *   issues:array<int,string>,
     *   ready_for_real_delivery:bool,
     *   local_only:bool
     * }
     */
    public static function evaluate(): array
    {
        $mailer = trim((string) config('mail.default', ''));
        $fromAddress = trim((string) config('mail.from.address', ''));
        $smtpHost = trim((string) config('mail.mailers.smtp.host', ''));
        $smtpPort = trim((string) config('mail.mailers.smtp.port', ''));
        $localOnly = in_array($mailer, ['log', 'array'], true);

        $issues = [];
        if ($mailer === '') {
            $issues[] = 'MAIL_MAILER no esta definido.';
        }
        if ($fromAddress === '') {
            $issues[] = 'MAIL_FROM_ADDRESS no esta definido.';
        }

        if ($mailer === 'smtp') {
            if ($smtpHost === '') {
                $issues[] = 'MAIL_HOST no esta definido.';
            }
            if ($smtpPort === '') {
                $issues[] = 'MAIL_PORT no esta definido.';
            }
        }

        if ($localOnly) {
            $issues[] = 'Mailer en modo local (log/array), no envia correos reales.';
        }

        $status = 'warning';
        $label = 'Incompleto';
        $summary = 'Configuracion incompleta para envio real.';

        if ($localOnly && $mailer !== '') {
            $status = 'local';
            $label = 'Modo local';
            $summary = 'Modo local (no envia correos reales).';
        } elseif ($issues === []) {
            $status = 'ok';
            $label = 'Listo';
            $summary = 'Listo para envio de correos.';
        }

        return [
            'status' => $status,
            'label' => $label,
            'summary' => $summary,
            'mailer' => $mailer !== '' ? $mailer : '-',
            'from_address' => $fromAddress !== '' ? $fromAddress : '-',
            'issues' => $issues,
            'ready_for_real_delivery' => $status === 'ok',
            'local_only' => $localOnly,
        ];
    }
}

