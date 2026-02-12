<?php

namespace App\Http\Controllers;

use App\Mail\AdminSmtpTestMail;
use App\Models\BusinessSetting;
use App\Support\AuditLogger;
use App\Support\BrandAssets;
use App\Support\MailFailureMonitor;
use App\Support\MailHealthStatus;
use App\Support\MailTemplateSettings;
use App\Support\OpsDashboardReportSettings;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Throwable;

class AdminBusinessSettingsController extends Controller
{
    public function index()
    {
        $business = $this->businessViewData();
        $reports = $this->reportsViewData();
        $mail = $this->mailViewData();

        $businessFilled = 0;
        foreach (['shopPhone', 'shopAddress', 'shopHours'] as $field) {
            if (trim((string) ($business[$field] ?? '')) !== '') {
                $businessFilled++;
            }
        }

        $reportsRecipientsCount = $this->countEmails((string) ($reports['weeklyReportEmails'] ?? ''));
        $smtpStatus = (string) ($mail['smtpHealth']['status'] ?? 'warning');
        $mailTemplatesCustomized = 0;
        foreach (MailTemplateSettings::definitions() as $templateKey => $templateDef) {
            foreach (array_keys((array) ($templateDef['fields'] ?? [])) as $fieldKey) {
                $settingKey = MailTemplateSettings::settingKey($templateKey, (string) $fieldKey);
                if (trim((string) BusinessSetting::getValue($settingKey, '')) !== '') {
                    $mailTemplatesCustomized++;
                }
            }
        }

        return view('admin.settings.index', [
            'statusBusiness' => $businessFilled >= 2 ? 'Completo' : 'Basico',
            'statusReports' => $reportsRecipientsCount > 0 ? 'Activo' : 'Sin destinatarios',
            'statusSmtpLabel' => (string) ($mail['smtpHealth']['label'] ?? 'Incompleto'),
            'statusSmtpTone' => $smtpStatus,
            'statusMailTemplates' => $mailTemplatesCustomized > 0 ? 'Personalizadas' : 'Por defecto',
        ]);
    }

    public function business()
    {
        return view('admin.settings.business', $this->businessViewData());
    }

    public function reports()
    {
        return view('admin.settings.reports', $this->reportsViewData());
    }

    public function mail()
    {
        return view('admin.settings.mail', $this->mailViewData());
    }

    public function assets()
    {
        return view('admin.settings.assets', [
            'brandAssets' => BrandAssets::resolved(),
        ]);
    }

    public function mailTemplates()
    {
        return view('admin.settings.mail_templates', [
            'templates' => MailTemplateSettings::editableTemplates(),
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'shop_address' => 'nullable|string|max:1000',
            'shop_hours' => 'nullable|string|max:1000',
            'shop_phone' => 'nullable|string|max:50',
            'default_ticket_paper' => 'nullable|string|in:58,80',
        ]);

        $this->persistSetting('shop_address', (string) ($data['shop_address'] ?? ''));
        $this->persistSetting('shop_hours', (string) ($data['shop_hours'] ?? ''));
        $this->persistSetting('shop_phone', (string) ($data['shop_phone'] ?? ''));
        $this->persistSetting('default_ticket_paper', (string) ($data['default_ticket_paper'] ?? '80'));

        return back()->with('success', 'Configuracion guardada.');
    }

    public function updateReports(Request $request)
    {
        $before = $this->currentWeeklyReportConfig();

        $data = $request->validate([
            'weekly_report_emails' => [
                'nullable',
                'string',
                'max:2000',
                static function (string $attribute, mixed $value, \Closure $fail): void {
                    $raw = trim((string) $value);
                    if ($raw === '') {
                        return;
                    }

                    $emails = array_values(array_filter(array_map(
                        static fn (string $item): string => trim($item),
                        explode(',', $raw)
                    )));

                    foreach ($emails as $email) {
                        if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
                            $fail("El campo {$attribute} contiene un email invalido: {$email}");

                            return;
                        }
                    }
                },
            ],
            'weekly_report_day' => 'required|string|in:sunday,monday,tuesday,wednesday,thursday,friday,saturday',
            'weekly_report_time' => [
                'required',
                'string',
                'regex:/^\\d{2}:\\d{2}$/',
                static function (string $attribute, mixed $value, \Closure $fail): void {
                    [$hours, $minutes] = array_map('intval', explode(':', (string) $value));
                    if ($hours < 0 || $hours > 23 || $minutes < 0 || $minutes > 59) {
                        $fail("El campo {$attribute} debe estar en formato HH:MM.");
                    }
                },
            ],
            'weekly_report_range_days' => 'required|integer|in:7,30,90',
        ]);

        $emails = collect(explode(',', (string) ($data['weekly_report_emails'] ?? '')))
            ->map(static fn (string $item): string => trim($item))
            ->filter(static fn (string $item): bool => $item !== '')
            ->unique()
            ->values()
            ->implode(', ');

        $this->persistSetting(OpsDashboardReportSettings::KEY_RECIPIENTS, $emails);
        $this->persistSetting(OpsDashboardReportSettings::KEY_DAY, (string) $data['weekly_report_day']);
        $this->persistSetting(OpsDashboardReportSettings::KEY_TIME, (string) $data['weekly_report_time']);
        $this->persistSetting(OpsDashboardReportSettings::KEY_RANGE_DAYS, (string) $data['weekly_report_range_days']);

        $after = [
            'emails' => $emails,
            'day' => (string) $data['weekly_report_day'],
            'time' => (string) $data['weekly_report_time'],
            'range_days' => (int) $data['weekly_report_range_days'],
        ];

        $changedKeys = [];
        foreach (['emails', 'day', 'time', 'range_days'] as $field) {
            if ((string) ($before[$field] ?? '') !== (string) ($after[$field] ?? '')) {
                $changedKeys[] = $field;
            }
        }

        AuditLogger::log($request, 'admin.settings.weekly_report.updated', [
            'subject_type' => BusinessSetting::class,
            'metadata' => [
                'before' => $before,
                'after' => $after,
                'changed_keys' => $changedKeys,
                'recipients_count' => $this->countEmails($emails),
            ],
        ]);

        return back()->with('success', 'Configuracion de reportes guardada.');
    }

    public function updateMailTemplates(Request $request)
    {
        $definitions = MailTemplateSettings::definitions();
        $rules = [];

        foreach ($definitions as $templateKey => $templateDef) {
            foreach ((array) ($templateDef['fields'] ?? []) as $fieldKey => $fieldDef) {
                $inputKey = $this->mailTemplateInputKey($templateKey, $fieldKey);
                $rules[$inputKey] = 'nullable|string|max:1000';
            }
        }

        $data = $request->validate($rules);
        $before = MailTemplateSettings::editableTemplates();
        $changedKeys = [];

        foreach ($definitions as $templateKey => $templateDef) {
            foreach ((array) ($templateDef['fields'] ?? []) as $fieldKey => $fieldDef) {
                $inputKey = $this->mailTemplateInputKey($templateKey, $fieldKey);
                $settingKey = MailTemplateSettings::settingKey($templateKey, $fieldKey);
                $defaultValue = (string) ($fieldDef['default'] ?? '');
                $incomingValue = trim((string) ($data[$inputKey] ?? ''));
                $toPersist = $incomingValue !== '' && $incomingValue !== $defaultValue
                    ? $incomingValue
                    : null;

                $previousStoredValue = (string) (BusinessSetting::where('key', $settingKey)->value('value') ?? '');
                if ((string) $toPersist !== $previousStoredValue) {
                    $changedKeys[] = $settingKey;
                }

                BusinessSetting::updateOrCreate(
                    ['key' => $settingKey],
                    [
                        'value' => $toPersist,
                        'updated_by' => auth()->id(),
                    ]
                );
            }
        }

        AuditLogger::log($request, 'admin.settings.mail_templates.updated', [
            'subject_type' => BusinessSetting::class,
            'metadata' => [
                'changed_keys' => $changedKeys,
                'before' => $before,
                'after' => MailTemplateSettings::editableTemplates(),
            ],
        ]);

        return back()->with('success', 'Plantillas de correo guardadas.');
    }

    public function resetMailTemplate(Request $request, string $templateKey)
    {
        $definitions = MailTemplateSettings::definitions();
        if (!isset($definitions[$templateKey])) {
            abort(404);
        }

        $fields = (array) ($definitions[$templateKey]['fields'] ?? []);
        $affectedSettingKeys = [];

        foreach (array_keys($fields) as $fieldKey) {
            $settingKey = MailTemplateSettings::settingKey($templateKey, (string) $fieldKey);
            BusinessSetting::where('key', $settingKey)->delete();
            $affectedSettingKeys[] = $settingKey;
        }

        AuditLogger::log($request, 'admin.settings.mail_templates.reset', [
            'subject_type' => BusinessSetting::class,
            'metadata' => [
                'template_key' => $templateKey,
                'affected_keys' => $affectedSettingKeys,
            ],
        ]);

        return back()->with('success', 'Plantilla restaurada a valores por defecto.');
    }

    public function sendWeeklyReport(Request $request)
    {
        $data = $request->validate([
            'weekly_report_range_days' => 'nullable|integer|in:7,30,90',
        ]);

        $rangeDays = (int) ($data['weekly_report_range_days'] ?? OpsDashboardReportSettings::rangeDays());
        $exitCode = Artisan::call('ops:dashboard-report-email', [
            '--range' => $rangeDays,
        ]);

        $output = trim((string) Artisan::output());
        if ($exitCode !== 0) {
            AuditLogger::log($request, 'admin.settings.weekly_report.send_failed', [
                'subject_type' => BusinessSetting::class,
                'metadata' => [
                    'range_days' => $rangeDays,
                    'recipients_count' => $this->countEmails(OpsDashboardReportSettings::recipientsRaw()),
                    'output' => $output !== '' ? $output : null,
                ],
            ]);

            return back()->withErrors([
                'weekly_report_send' => $output !== ''
                    ? $output
                    : 'No se pudo enviar el reporte semanal.',
            ]);
        }

        AuditLogger::log($request, 'admin.settings.weekly_report.sent', [
            'subject_type' => BusinessSetting::class,
            'metadata' => [
                'range_days' => $rangeDays,
                'recipients_count' => $this->countEmails(OpsDashboardReportSettings::recipientsRaw()),
            ],
        ]);

        return back()->with('success', 'Reporte semanal enviado correctamente.');
    }

    public function sendSmtpTestEmail(Request $request)
    {
        $data = $request->validate([
            'test_email' => 'required|email|max:255',
        ], [
            'test_email.required' => 'Ingresa un email de destino para la prueba.',
            'test_email.email' => 'Ingresa un email valido.',
            'test_email.max' => 'El email no puede superar :max caracteres.',
        ]);

        $testEmail = Str::lower(trim((string) $data['test_email']));
        $adminEmail = (string) (auth()->user()?->email ?? '');

        try {
            Mail::to($testEmail)->send(new AdminSmtpTestMail(
                sentByEmail: $adminEmail !== '' ? $adminEmail : 'admin@local',
                appEnv: (string) app()->environment(),
                appUrl: (string) config('app.url')
            ));
        } catch (Throwable $exception) {
            app(MailFailureMonitor::class)->reportSyncFailure($exception, [
                'event' => 'admin.settings.smtp_test',
                'to' => $testEmail,
            ]);

            AuditLogger::log($request, 'admin.settings.smtp_test.failed', [
                'subject_type' => BusinessSetting::class,
                'metadata' => [
                    'to' => $testEmail,
                    'error' => $exception->getMessage(),
                ],
            ]);

            return back()->withErrors([
                'smtp_test' => 'No se pudo enviar el correo de prueba SMTP. Revisa la configuracion de mail.',
            ]);
        }

        AuditLogger::log($request, 'admin.settings.smtp_test.sent', [
            'subject_type' => BusinessSetting::class,
            'metadata' => [
                'to' => $testEmail,
            ],
        ]);

        return back()->with('success', 'Correo de prueba SMTP enviado a '.$testEmail.'.');
    }

    public function updateAsset(Request $request, string $assetKey)
    {
        $definition = BrandAssets::definition($assetKey);
        if (!$definition) {
            abort(404);
        }

        $extensions = (array) ($definition['extensions'] ?? []);
        $maxKb = (int) ($definition['max_kb'] ?? 2048);

        $data = $request->validate([
            'file' => [
                'required',
                'file',
                'max:' . $maxKb,
                'mimes:' . implode(',', $extensions),
            ],
        ]);

        $file = $data['file'];
        $ext = strtolower((string) ($file->extension() ?: $file->getClientOriginalExtension()));

        if ($ext === '' || !in_array($ext, $extensions, true)) {
            return back()->withErrors([
                'file' => 'Formato de archivo no permitido para este recurso visual.',
            ]);
        }

        $uploadDir = BrandAssets::uploadDir();
        $targetDir = public_path($uploadDir);
        File::ensureDirectoryExists($targetDir);

        $filename = $assetKey . '-' . now()->format('YmdHis') . '-' . Str::lower(Str::random(8)) . '.' . $ext;
        $file->move($targetDir, $filename);

        $newRelativePath = $uploadDir . '/' . $filename;
        $settingKey = BrandAssets::settingKey($assetKey);
        $oldRelativePath = (string) BusinessSetting::where('key', $settingKey)->value('value');

        BusinessSetting::updateOrCreate(
            ['key' => $settingKey],
            ['value' => $newRelativePath, 'updated_by' => auth()->id()]
        );

        $this->deleteManagedAssetFile($oldRelativePath);
        BrandAssets::clearRuntimeCache();

        return back()->with('success', 'Recurso visual actualizado: ' . ($definition['label'] ?? $assetKey));
    }

    public function resetAsset(Request $request, string $assetKey)
    {
        $definition = BrandAssets::definition($assetKey);
        if (!$definition) {
            abort(404);
        }

        $settingKey = BrandAssets::settingKey($assetKey);
        $oldRelativePath = (string) BusinessSetting::where('key', $settingKey)->value('value');

        BusinessSetting::where('key', $settingKey)->delete();

        $this->deleteManagedAssetFile($oldRelativePath);
        BrandAssets::clearRuntimeCache();

        return back()->with('success', 'Recurso visual restaurado al valor por defecto: ' . ($definition['label'] ?? $assetKey));
    }

    private function deleteManagedAssetFile(?string $relativePath): void
    {
        $normalized = BrandAssets::normalizeRelativePath((string) $relativePath);
        if (!$normalized || !BrandAssets::isManagedCustomPath($normalized)) {
            return;
        }

        $absolutePath = public_path($normalized);
        if (is_file($absolutePath)) {
            @unlink($absolutePath);
        }
    }

    private function persistSetting(string $key, ?string $value): void
    {
        $normalized = trim((string) $value);

        BusinessSetting::updateOrCreate(
            ['key' => $key],
            [
                'value' => $normalized !== '' ? $normalized : null,
                'updated_by' => auth()->id(),
            ]
        );
    }

    /**
     * @return array{emails:string,day:string,time:string,range_days:int}
     */
    private function currentWeeklyReportConfig(): array
    {
        return [
            'emails' => OpsDashboardReportSettings::recipientsRaw(),
            'day' => OpsDashboardReportSettings::day(),
            'time' => OpsDashboardReportSettings::time(),
            'range_days' => OpsDashboardReportSettings::rangeDays(),
        ];
    }

    private function countEmails(string $raw): int
    {
        $list = array_values(array_filter(array_map(
            static fn (string $email): string => trim($email),
            explode(',', $raw)
        )));

        return count($list);
    }

    private function mailTemplateInputKey(string $templateKey, string $fieldKey): string
    {
        return 'tpl_' . $templateKey . '_' . $fieldKey;
    }

    /**
     * @return array{shopAddress:string,shopHours:string,shopPhone:string,defaultTicketPaper:string}
     */
    private function businessViewData(): array
    {
        $settings = BusinessSetting::allValues();

        return [
            'shopAddress' => (string) ($settings->get('shop_address') ?? ''),
            'shopHours' => (string) ($settings->get('shop_hours') ?? ''),
            'shopPhone' => (string) ($settings->get('shop_phone') ?? ''),
            'defaultTicketPaper' => (string) ($settings->get('default_ticket_paper') ?? '80'),
        ];
    }

    /**
     * @return array{weeklyReportEmails:string,weeklyReportDay:string,weeklyReportTime:string,weeklyReportRangeDays:int}
     */
    private function reportsViewData(): array
    {
        return [
            'weeklyReportEmails' => OpsDashboardReportSettings::recipientsRaw(),
            'weeklyReportDay' => OpsDashboardReportSettings::day(),
            'weeklyReportTime' => OpsDashboardReportSettings::time(),
            'weeklyReportRangeDays' => OpsDashboardReportSettings::rangeDays(),
        ];
    }

    /**
     * @return array{smtpDefaultTo:string,smtpHealth:array<string,mixed>}
     */
    private function mailViewData(): array
    {
        return [
            'smtpDefaultTo' => (string) (auth()->user()?->email ?? ''),
            'smtpHealth' => MailHealthStatus::evaluate(),
        ];
    }

}
