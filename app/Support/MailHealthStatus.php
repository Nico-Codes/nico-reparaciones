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

        $issues = [];
        if ($mailer === '') {
            $issues[] = 'MAIL_MAILER no esta definido.';
        }
        if ($fromAddress === '') {
            $issues[] = 'MAIL_FROM_ADDRESS no esta definido.';
        }

        $inspection = self::inspectMailer($mailer, []);
        if ($inspection['issues'] !== []) {
            $issues = array_merge($issues, $inspection['issues']);
        }

        $status = 'warning';
        $label = 'Incompleto';
        $summary = 'Configuracion incompleta para envio real.';
        $localOnly = $inspection['local_only'];
        $readyForRealDelivery = !$localOnly && $inspection['has_real_delivery'] && $issues === [];

        if ($localOnly && $mailer !== '') {
            $status = 'local';
            $label = 'Modo local';
            $summary = 'Modo local (no envia correos reales).';
        } elseif ($readyForRealDelivery) {
            $status = 'ok';
            $label = 'Listo';
            $summary = 'Listo para envio de correos.';
        } elseif ($inspection['has_real_delivery'] && $issues !== []) {
            $summary = 'Configuracion parcial: hay canal real, pero faltan ajustes.';
        }

        return [
            'status' => $status,
            'label' => $label,
            'summary' => $summary,
            'mailer' => $mailer !== '' ? $mailer : '-',
            'from_address' => $fromAddress !== '' ? $fromAddress : '-',
            'issues' => $issues,
            'ready_for_real_delivery' => $readyForRealDelivery,
            'local_only' => $localOnly,
        ];
    }

    /**
     * @param  array<int, string>  $visited
     * @return array{issues:array<int,string>,has_real_delivery:bool,local_only:bool}
     */
    private static function inspectMailer(string $mailer, array $visited): array
    {
        $mailer = trim($mailer);
        if ($mailer === '') {
            return [
                'issues' => [],
                'has_real_delivery' => false,
                'local_only' => false,
            ];
        }

        if (in_array($mailer, $visited, true)) {
            return [
                'issues' => ['Configuracion ciclica detectada en mailers: '.$mailer.'.'],
                'has_real_delivery' => false,
                'local_only' => false,
            ];
        }

        $visited[] = $mailer;

        $transport = trim((string) config('mail.mailers.'.$mailer.'.transport', $mailer));

        if (in_array($transport, ['log', 'array'], true)) {
            return [
                'issues' => ['Mailer en modo local (log/array), no envia correos reales.'],
                'has_real_delivery' => false,
                'local_only' => true,
            ];
        }

        if ($transport === 'smtp') {
            $smtpHost = trim((string) config('mail.mailers.'.$mailer.'.host', config('mail.mailers.smtp.host', '')));
            $smtpPort = trim((string) config('mail.mailers.'.$mailer.'.port', config('mail.mailers.smtp.port', '')));

            $issues = [];
            if ($smtpHost === '') {
                $issues[] = 'MAIL_HOST no esta definido.';
            }
            if ($smtpPort === '') {
                $issues[] = 'MAIL_PORT no esta definido.';
            }

            return [
                'issues' => $issues,
                'has_real_delivery' => true,
                'local_only' => false,
            ];
        }

        if (in_array($transport, ['failover', 'roundrobin'], true)) {
            $nestedMailers = config('mail.mailers.'.$mailer.'.mailers', []);
            if (!is_array($nestedMailers) || $nestedMailers === []) {
                return [
                    'issues' => ['Mailer '.$mailer.' no define sub-mailers en su configuracion.'],
                    'has_real_delivery' => false,
                    'local_only' => false,
                ];
            }

            $issues = [];
            $hasRealDelivery = false;
            $allLocalOnly = true;

            foreach ($nestedMailers as $nestedMailer) {
                $nestedMailer = trim((string) $nestedMailer);
                if ($nestedMailer === '') {
                    continue;
                }

                $nested = self::inspectMailer($nestedMailer, $visited);
                if ($nested['issues'] !== []) {
                    $issues = array_merge($issues, $nested['issues']);
                }
                if ($nested['has_real_delivery']) {
                    $hasRealDelivery = true;
                }
                if (!$nested['local_only']) {
                    $allLocalOnly = false;
                }
            }

            if ($hasRealDelivery) {
                $issues = array_values(array_filter($issues, static fn (string $issue): bool => !str_contains($issue, 'modo local')));
            }

            if (!$hasRealDelivery && !$allLocalOnly) {
                $issues[] = 'No se detecta canal de envio real en mailers compuestos.';
            }

            return [
                'issues' => array_values(array_unique($issues)),
                'has_real_delivery' => $hasRealDelivery,
                'local_only' => $allLocalOnly,
            ];
        }

        if (in_array($transport, ['ses', 'ses-v2', 'postmark', 'resend', 'sendmail', 'mailgun'], true)) {
            return [
                'issues' => [],
                'has_real_delivery' => true,
                'local_only' => false,
            ];
        }

        return [
            'issues' => ['MAIL_MAILER no reconocido: '.$mailer.'.'],
            'has_real_delivery' => false,
            'local_only' => false,
        ];
    }
}
