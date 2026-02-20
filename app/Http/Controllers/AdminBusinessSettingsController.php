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
use Illuminate\Support\Carbon;
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

    public function storeHero()
    {
        $assets = BrandAssets::resolved();

        return view('admin.settings.store_hero', array_merge(
            $this->businessViewData(),
            [
                'heroAssetDesktop' => $assets['store_home_hero_desktop'] ?? null,
                'heroAssetMobile' => $assets['store_home_hero_mobile'] ?? null,
            ]
        ));
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
            'ops_alert_order_stale_hours' => 'nullable|integer|min:1|max:720',
            'ops_alert_repair_stale_days' => 'nullable|integer|min:1|max:180',
            'store_home_hero_title' => 'nullable|string|max:120',
            'store_home_hero_subtitle' => 'nullable|string|max:240',
            'store_home_hero_fade_intensity' => 'nullable|integer|min:0|max:100',
            'store_home_hero_fade_size' => 'nullable|integer|min:24|max:260',
            'store_home_hero_fade_high_contrast' => 'nullable|boolean',
            'store_home_hero_fade_color_manual' => ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{6})$/'],
        ]);

        $this->persistSetting('shop_address', (string) ($data['shop_address'] ?? ''));
        $this->persistSetting('shop_hours', (string) ($data['shop_hours'] ?? ''));
        $this->persistSetting('shop_phone', (string) ($data['shop_phone'] ?? ''));
        $this->persistSetting('default_ticket_paper', (string) ($data['default_ticket_paper'] ?? '80'));
        $this->persistSetting('ops_alert_order_stale_hours', (string) ($data['ops_alert_order_stale_hours'] ?? '24'));
        $this->persistSetting('ops_alert_repair_stale_days', (string) ($data['ops_alert_repair_stale_days'] ?? '3'));
        $this->persistSetting('store_home_hero_title', (string) ($data['store_home_hero_title'] ?? ''));
        $this->persistSetting('store_home_hero_subtitle', (string) ($data['store_home_hero_subtitle'] ?? ''));
        $this->persistSetting('store_home_hero_fade_intensity', (string) ($data['store_home_hero_fade_intensity'] ?? '42'));
        $this->persistSetting('store_home_hero_fade_size', (string) ($data['store_home_hero_fade_size'] ?? '96'));
        $this->persistSetting('store_home_hero_fade_high_contrast', $request->boolean('store_home_hero_fade_high_contrast') ? '1' : '0');
        $this->persistSetting('store_home_hero_fade_color_manual', strtoupper((string) ($data['store_home_hero_fade_color_manual'] ?? '')));

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
            'operational_alerts_emails' => [
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
            'operational_alerts_dedupe_minutes' => 'required|integer|min:5|max:10080',
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
        $operationalAlertsEmails = collect(explode(',', (string) ($data['operational_alerts_emails'] ?? '')))
            ->map(static fn (string $item): string => trim($item))
            ->filter(static fn (string $item): bool => $item !== '')
            ->unique()
            ->values()
            ->implode(', ');
        $this->persistSetting('ops_operational_alerts_emails', $operationalAlertsEmails);
        $this->persistSetting('ops_operational_alerts_dedupe_minutes', (string) ((int) $data['operational_alerts_dedupe_minutes']));

        $after = [
            'emails' => $emails,
            'day' => (string) $data['weekly_report_day'],
            'time' => (string) $data['weekly_report_time'],
            'range_days' => (int) $data['weekly_report_range_days'],
            'operational_alerts_emails' => $operationalAlertsEmails,
            'operational_alerts_dedupe_minutes' => (int) $data['operational_alerts_dedupe_minutes'],
        ];

        $changedKeys = [];
        foreach (['emails', 'day', 'time', 'range_days', 'operational_alerts_emails', 'operational_alerts_dedupe_minutes'] as $field) {
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

    public function sendOperationalAlerts(Request $request)
    {
        $exitCode = Artisan::call('ops:operational-alerts-email', [
            '--force' => true,
        ]);

        $output = trim((string) Artisan::output());
        if ($exitCode !== 0) {
            return back()->withErrors([
                'operational_alerts_send' => $output !== ''
                    ? $output
                    : 'No se pudo enviar el resumen de alertas operativas.',
            ]);
        }

        return back()->with('success', 'Resumen de alertas operativas enviado correctamente.');
    }

    public function clearOperationalAlertsHistory(Request $request)
    {
        $keys = [
            'ops_operational_alerts_last_status',
            'ops_operational_alerts_last_run_at',
            'ops_operational_alerts_last_recipients',
            'ops_operational_alerts_last_summary',
            'ops_operational_alerts_last_error',
            'ops_operational_alerts_last_signature',
            'ops_operational_alerts_last_sent_at',
        ];

        BusinessSetting::query()->whereIn('key', $keys)->delete();

        return back()->with('success', 'Historial de alertas operativas limpiado.');
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

        $heroColorSettingKey = $this->heroColorSettingKeyForAsset($assetKey);
        if ($heroColorSettingKey !== null) {
            $absolutePath = public_path($newRelativePath);
            $dominantHex = $this->extractDominantHexColorFromImage($absolutePath);
            if ($dominantHex !== null) {
                $this->persistSetting($heroColorSettingKey, $dominantHex);
            }
        }

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

        $heroColorSettingKey = $this->heroColorSettingKeyForAsset($assetKey);
        if ($heroColorSettingKey !== null) {
            BusinessSetting::where('key', $heroColorSettingKey)->delete();
        }

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
        $operationalAlertsDedupe = (int) BusinessSetting::getValue('ops_operational_alerts_dedupe_minutes', '');
        if ($operationalAlertsDedupe <= 0) {
            $operationalAlertsDedupe = (int) config('ops.alerts.operational_dedupe_minutes', 360);
        }

        return [
            'emails' => OpsDashboardReportSettings::recipientsRaw(),
            'day' => OpsDashboardReportSettings::day(),
            'time' => OpsDashboardReportSettings::time(),
            'range_days' => OpsDashboardReportSettings::rangeDays(),
            'operational_alerts_emails' => (string) (BusinessSetting::getValue('ops_operational_alerts_emails', (string) config('ops.alerts.operational_email_recipients', ''))),
            'operational_alerts_dedupe_minutes' => max(5, min(10080, $operationalAlertsDedupe)),
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

    private function heroColorSettingKeyForAsset(string $assetKey): ?string
    {
        return match ($assetKey) {
            'store_home_hero_desktop' => 'store_home_hero_desktop_color',
            'store_home_hero_mobile' => 'store_home_hero_mobile_color',
            default => null,
        };
    }

    private function extractDominantHexColorFromImage(string $absolutePath): ?string
    {
        if (!is_file($absolutePath) || !function_exists('imagecreatefromstring')) {
            return null;
        }

        $raw = @file_get_contents($absolutePath);
        if ($raw === false || $raw === '') {
            return null;
        }

        $src = @imagecreatefromstring($raw);
        if ($src === false) {
            return null;
        }

        $thumb = imagecreatetruecolor(24, 24);
        if ($thumb === false) {
            imagedestroy($src);
            return null;
        }

        imagecopyresampled(
            $thumb,
            $src,
            0,
            0,
            0,
            0,
            24,
            24,
            (int) imagesx($src),
            (int) imagesy($src)
        );

        // Prioriza la franja inferior real de la imagen para evitar "cortes"
        // entre el hero y el inicio del degradado.
        $sumR = 0;
        $sumG = 0;
        $sumB = 0;
        $count = 0;

        for ($y = 20; $y <= 23; $y++) {
            for ($x = 1; $x <= 22; $x++) {
                $rgb = imagecolorat($thumb, $x, $y);
                $r = ($rgb >> 16) & 0xFF;
                $g = ($rgb >> 8) & 0xFF;
                $b = $rgb & 0xFF;

                // Evita píxeles casi blancos que "apagan" el color dominante.
                if ($r > 240 && $g > 240 && $b > 240) {
                    continue;
                }

                $sumR += $r;
                $sumG += $g;
                $sumB += $b;
                $count++;
            }
        }

        if ($count === 0) {
            $rgb = imagecolorat($thumb, 12, 22);
            $r = ($rgb >> 16) & 0xFF;
            $g = ($rgb >> 8) & 0xFF;
            $b = $rgb & 0xFF;
        } else {
            $r = (int) round($sumR / $count);
            $g = (int) round($sumG / $count);
            $b = (int) round($sumB / $count);
        }

        imagedestroy($thumb);
        imagedestroy($src);

        return sprintf('#%02X%02X%02X', $r, $g, $b);
    }

    /**
     * @return array{shopAddress:string,shopHours:string,shopPhone:string,defaultTicketPaper:string,opsAlertOrderStaleHours:int,opsAlertRepairStaleDays:int,storeHomeHeroTitle:string,storeHomeHeroSubtitle:string,storeHomeHeroFadeIntensity:int,storeHomeHeroFadeSize:int,storeHomeHeroFadeHighContrast:bool,storeHomeHeroFadeColorManual:string}
     */
    private function businessViewData(): array
    {
        $settings = BusinessSetting::allValues();

        return [
            'shopAddress' => (string) ($settings->get('shop_address') ?? ''),
            'shopHours' => (string) ($settings->get('shop_hours') ?? ''),
            'shopPhone' => (string) ($settings->get('shop_phone') ?? ''),
            'defaultTicketPaper' => (string) ($settings->get('default_ticket_paper') ?? '80'),
            'opsAlertOrderStaleHours' => max(1, min(720, (int) ($settings->get('ops_alert_order_stale_hours') ?? 24))),
            'opsAlertRepairStaleDays' => max(1, min(180, (int) ($settings->get('ops_alert_repair_stale_days') ?? 3))),
            'storeHomeHeroTitle' => (string) ($settings->get('store_home_hero_title') ?? ''),
            'storeHomeHeroSubtitle' => (string) ($settings->get('store_home_hero_subtitle') ?? ''),
            'storeHomeHeroFadeIntensity' => (int) ($settings->get('store_home_hero_fade_intensity') ?? 42),
            'storeHomeHeroFadeSize' => (int) ($settings->get('store_home_hero_fade_size') ?? 96),
            'storeHomeHeroFadeHighContrast' => ((string) ($settings->get('store_home_hero_fade_high_contrast') ?? '0')) === '1',
            'storeHomeHeroFadeColorManual' => strtoupper((string) ($settings->get('store_home_hero_fade_color_manual') ?? '')),
        ];
    }

    /**
     * @return array{weeklyReportEmails:string,weeklyReportDay:string,weeklyReportTime:string,weeklyReportRangeDays:int,operationalAlertsEmails:string,operationalAlertsDedupeMinutes:int,operationalAlertsLastStatus:string,operationalAlertsLastRunAt:?string,operationalAlertsLastRecipients:string,operationalAlertsLastSummary:array<string,mixed>,operationalAlertsLastError:string}
     */
    private function reportsViewData(): array
    {
        $operationalAlertsDedupe = (int) BusinessSetting::getValue('ops_operational_alerts_dedupe_minutes', '');
        if ($operationalAlertsDedupe <= 0) {
            $operationalAlertsDedupe = (int) config('ops.alerts.operational_dedupe_minutes', 360);
        }

        $lastSummaryRaw = (string) BusinessSetting::getValue('ops_operational_alerts_last_summary', '{}');
        $lastSummary = json_decode($lastSummaryRaw, true);
        if (!is_array($lastSummary)) {
            $lastSummary = [];
        }

        $lastRunAtRaw = trim((string) BusinessSetting::getValue('ops_operational_alerts_last_run_at', ''));
        $lastRunAt = null;
        if ($lastRunAtRaw !== '') {
            try {
                $lastRunAt = Carbon::parse($lastRunAtRaw)->format('d/m/Y H:i');
            } catch (Throwable) {
                $lastRunAt = $lastRunAtRaw;
            }
        }

        return [
            'weeklyReportEmails' => OpsDashboardReportSettings::recipientsRaw(),
            'weeklyReportDay' => OpsDashboardReportSettings::day(),
            'weeklyReportTime' => OpsDashboardReportSettings::time(),
            'weeklyReportRangeDays' => OpsDashboardReportSettings::rangeDays(),
            'operationalAlertsEmails' => (string) (BusinessSetting::getValue('ops_operational_alerts_emails', (string) config('ops.alerts.operational_email_recipients', ''))),
            'operationalAlertsDedupeMinutes' => max(5, min(10080, $operationalAlertsDedupe)),
            'operationalAlertsLastStatus' => (string) BusinessSetting::getValue('ops_operational_alerts_last_status', ''),
            'operationalAlertsLastRunAt' => $lastRunAt,
            'operationalAlertsLastRecipients' => (string) BusinessSetting::getValue('ops_operational_alerts_last_recipients', ''),
            'operationalAlertsLastSummary' => $lastSummary,
            'operationalAlertsLastError' => (string) BusinessSetting::getValue('ops_operational_alerts_last_error', ''),
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
