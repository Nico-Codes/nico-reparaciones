<?php

namespace App\Console\Commands;

use App\Mail\AdminSmtpTestMail;
use App\Support\MailDispatch;
use App\Support\MailFailureMonitor;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Throwable;

class OpsMailTestCommand extends Command
{
    protected $signature = 'ops:mail-test
        {--to= : Destination email}
        {--force-sync : Send immediately even if async mail dispatch is enabled}';

    protected $description = 'Send a mail smoke test using current app mail configuration.';

    public function handle(): int
    {
        $to = trim((string) ($this->option('to') ?? ''));
        if ($to === '') {
            $to = trim((string) config('mail.from.address', ''));
        }

        if ($to === '' || filter_var($to, FILTER_VALIDATE_EMAIL) === false) {
            $this->error('Invalid destination email. Use --to=you@example.com or configure MAIL_FROM_ADDRESS.');

            return self::FAILURE;
        }

        $mailable = new AdminSmtpTestMail(
            sentByEmail: (string) (config('mail.from.address') ?: 'system@local'),
            appEnv: (string) app()->environment(),
            appUrl: (string) config('app.url')
        );

        try {
            if ((bool) $this->option('force-sync')) {
                Mail::to($to)->send($mailable);
                $this->info('Mail test sent (sync) to '.$to.'.');

                return self::SUCCESS;
            }

            MailDispatch::send($to, $mailable);

            if (MailDispatch::asyncEnabled()) {
                $this->info('Mail test queued to '.$to.'.');
            } else {
                $this->info('Mail test sent to '.$to.'.');
            }
        } catch (Throwable $exception) {
            app(MailFailureMonitor::class)->reportSyncFailure($exception, [
                'event' => 'ops.mail_test',
                'to' => $to,
                'force_sync' => (bool) $this->option('force-sync'),
            ]);

            $this->error('Mail test failed: '.$exception->getMessage());

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}

