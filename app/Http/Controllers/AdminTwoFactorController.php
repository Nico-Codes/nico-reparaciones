<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\Totp;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

class AdminTwoFactorController extends Controller
{
    public function settings(Request $request)
    {
        $user = $request->user();
        abort_unless($user && $user->isAdmin(), 403);

        $pendingSecret = (string) $request->session()->get('admin_2fa_pending_secret', '');
        $pendingSecret = strtoupper(trim($pendingSecret));
        $hasPendingSecret = $pendingSecret !== '';

        $issuer = (string) config('app.name', 'NicoReparaciones');
        $accountLabel = (string) $user->email;
        $otpauthUrl = $hasPendingSecret
            ? Totp::buildOtpAuthUri($issuer, $accountLabel, $pendingSecret)
            : null;

        $exportPayload = $this->getRecoveryExportPayload($request);
        $freshRecoveryCodes = $exportPayload['codes'] ?? [];
        $recoveryExportToken = $exportPayload['token'] ?? null;

        return view('admin.security.two_factor', [
            'isEnabled' => $user->hasAdminTwoFactorEnabled(),
            'enabledAt' => $user->admin_two_factor_enabled_at,
            'pendingSecret' => $pendingSecret,
            'hasPendingSecret' => $hasPendingSecret,
            'otpauthUrl' => $otpauthUrl,
            'issuer' => $issuer,
            'accountLabel' => $accountLabel,
            'recoveryCodesRemaining' => $user->getAdminTwoFactorRecoveryCodesRemainingCount(),
            'recoveryCodesGeneratedAt' => $user->admin_two_factor_recovery_codes_generated_at,
            'freshRecoveryCodes' => $freshRecoveryCodes,
            'recoveryExportToken' => $recoveryExportToken,
            'recoveryExportTtlMinutes' => max(1, (int) config('security.admin.two_factor_recovery_export_ttl_minutes', 30)),
        ]);
    }

    public function regenerate(Request $request)
    {
        $user = $request->user();
        abort_unless($user && $user->isAdmin(), 403);

        if ($user->hasAdminTwoFactorEnabled()) {
            return back()->withErrors([
                'current_password' => '2FA ya esta activado. Si quieres cambiarlo, desactiva y vuelve a activar.',
            ]);
        }

        $request->session()->put('admin_2fa_pending_secret', Totp::generateSecret());

        return redirect()
            ->route('admin.two_factor.settings')
            ->with('success', 'Se genero un nuevo secreto. Escanealo con tu app autenticadora.');
    }

    public function enable(Request $request)
    {
        $user = $request->user();
        abort_unless($user && $user->isAdmin(), 403);

        if ($user->hasAdminTwoFactorEnabled()) {
            return back()->withErrors([
                'code' => '2FA ya esta activado para este usuario admin.',
            ]);
        }

        $data = $request->validate([
            'current_password' => ['required', 'current_password'],
            'code' => ['required', 'regex:/^\d{6}$/'],
        ], [
            'current_password.required' => 'Ingresa tu contrasena actual.',
            'current_password.current_password' => 'La contrasena actual no es correcta.',
            'code.required' => 'Ingresa el codigo de 6 digitos.',
            'code.regex' => 'El codigo debe tener 6 digitos numericos.',
        ]);

        $pendingSecret = (string) $request->session()->get('admin_2fa_pending_secret', '');
        if ($pendingSecret === '') {
            return back()->withErrors([
                'code' => 'Primero genera un secreto para activar 2FA.',
            ]);
        }

        if (!Totp::verifyCode($pendingSecret, $data['code'])) {
            return back()->withErrors([
                'code' => 'Codigo 2FA invalido. Verifica la hora del telefono y vuelve a intentar.',
            ]);
        }

        $recoveryCodes = $user->generateAdminTwoFactorRecoveryCodes();

        $user->forceFill([
            'admin_two_factor_secret' => Crypt::encryptString($pendingSecret),
            'admin_two_factor_enabled_at' => now(),
        ])->save();

        $request->session()->forget('admin_2fa_pending_secret');
        $request->session()->put('admin_2fa_passed_at', time());
        $this->storeRecoveryExportPayload($request, $recoveryCodes);

        return redirect()
            ->route('admin.two_factor.settings')
            ->with('success', '2FA activado correctamente para tu cuenta admin.');
    }

    public function regenerateRecoveryCodes(Request $request)
    {
        $user = $request->user();
        abort_unless($user && $user->isAdmin(), 403);

        if (!$user->hasAdminTwoFactorEnabled()) {
            return back()->withErrors([
                'code' => 'Activa 2FA antes de generar codigos de recuperacion.',
            ]);
        }

        $data = $request->validate([
            'current_password' => ['required', 'current_password'],
            'code' => ['required', 'string', 'max:64'],
        ], [
            'current_password.required' => 'Ingresa tu contrasena actual.',
            'current_password.current_password' => 'La contrasena actual no es correcta.',
            'code.required' => 'Ingresa tu codigo 2FA o codigo de recuperacion.',
            'code.max' => 'El codigo ingresado es demasiado largo.',
        ]);

        $factorType = $this->verifySecondFactorToken($user, $data['code'], true);
        if ($factorType === null) {
            return back()->withErrors([
                'code' => 'Codigo 2FA o codigo de recuperacion invalido.',
            ]);
        }

        $recoveryCodes = $user->generateAdminTwoFactorRecoveryCodes();
        $user->save();
        $this->storeRecoveryExportPayload($request, $recoveryCodes);

        $message = $factorType === 'recovery'
            ? 'Codigos de recuperacion regenerados. El codigo usado quedo invalidado.'
            : 'Codigos de recuperacion regenerados correctamente.';

        return redirect()
            ->route('admin.two_factor.settings')
            ->with('success', $message);
    }

    public function downloadRecoveryCodesTxt(Request $request)
    {
        $user = $request->user();
        abort_unless($user && $user->isAdmin(), 403);

        $payload = $this->getRecoveryExportPayload($request);
        if (!$this->payloadTokenMatches($payload, (string) $request->query('token', ''))) {
            abort(404);
        }

        $codes = $payload['codes'] ?? [];
        if (!is_array($codes) || $codes === []) {
            abort(404);
        }

        $lines = [
            'NicoReparaciones - Codigos de recuperacion 2FA (Admin)',
            'Cuenta: '.($user->email ?? 'admin'),
            'Generado: '.now()->format('d/m/Y H:i:s'),
            '',
            'IMPORTANTE:',
            '- Cada codigo se puede usar una sola vez.',
            '- Guardalos offline en un lugar seguro.',
            '',
            'Codigos:',
        ];

        foreach ($codes as $code) {
            $lines[] = '- '.$code;
        }

        $content = implode(PHP_EOL, $lines).PHP_EOL;
        $filename = 'recovery-codes-admin-'.now()->format('Ymd-His').'.txt';

        return response($content, 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
        ]);
    }

    public function printRecoveryCodes(Request $request)
    {
        $user = $request->user();
        abort_unless($user && $user->isAdmin(), 403);

        $payload = $this->getRecoveryExportPayload($request);
        if (!$this->payloadTokenMatches($payload, (string) $request->query('token', ''))) {
            abort(404);
        }

        $codes = $payload['codes'] ?? [];
        if (!is_array($codes) || $codes === []) {
            abort(404);
        }

        return view('admin.security.recovery_codes_print', [
            'codes' => $codes,
            'accountEmail' => (string) ($user->email ?? 'admin'),
            'generatedAt' => now(),
        ]);
    }

    public function clearRecoveryExport(Request $request)
    {
        $request->session()->forget('admin_2fa_recovery_export');

        return redirect()
            ->route('admin.two_factor.settings')
            ->with('success', 'Se ocultaron los codigos de recuperacion visibles.');
    }

    public function disable(Request $request)
    {
        $user = $request->user();
        abort_unless($user && $user->isAdmin(), 403);

        if (!$user->hasAdminTwoFactorEnabled()) {
            return back()->withErrors([
                'code' => '2FA no esta activo en esta cuenta admin.',
            ]);
        }

        $data = $request->validate([
            'current_password' => ['required', 'current_password'],
            'code' => ['required', 'string', 'max:64'],
        ], [
            'current_password.required' => 'Ingresa tu contrasena actual.',
            'current_password.current_password' => 'La contrasena actual no es correcta.',
            'code.required' => 'Ingresa tu codigo 2FA o codigo de recuperacion.',
            'code.max' => 'El codigo ingresado es demasiado largo.',
        ]);

        $factorType = $this->verifySecondFactorToken($user, $data['code'], true);
        if ($factorType === null) {
            return back()->withErrors([
                'code' => 'Codigo 2FA o codigo de recuperacion invalido. No se pudo desactivar.',
            ]);
        }

        $user->forceFill([
            'admin_two_factor_secret' => null,
            'admin_two_factor_enabled_at' => null,
            'admin_two_factor_recovery_codes' => null,
            'admin_two_factor_recovery_codes_generated_at' => null,
        ])->save();

        $request->session()->forget('admin_2fa_passed_at');
        $request->session()->forget('admin_2fa_pending_secret');
        $request->session()->forget('admin_2fa_recovery_export');

        return redirect()
            ->route('admin.two_factor.settings')
            ->with('success', '2FA desactivado correctamente.');
    }

    public function challenge(Request $request)
    {
        $user = $request->user();
        abort_unless($user && $user->isAdmin(), 403);

        if (!$user->hasAdminTwoFactorEnabled()) {
            return redirect()->route('admin.dashboard');
        }

        $verifiedAt = (int) $request->session()->get('admin_2fa_passed_at', 0);
        if ($verifiedAt > 0) {
            return redirect()->route('admin.dashboard');
        }

        return view('auth.admin_two_factor_challenge');
    }

    public function verifyChallenge(Request $request)
    {
        $user = $request->user();
        abort_unless($user && $user->isAdmin(), 403);

        if (!$user->hasAdminTwoFactorEnabled()) {
            return redirect()->route('admin.dashboard');
        }

        $data = $request->validate([
            'code' => ['required', 'string', 'max:64'],
        ], [
            'code.required' => 'Ingresa tu codigo 2FA o codigo de recuperacion.',
            'code.max' => 'El codigo ingresado es demasiado largo.',
        ]);

        $factorType = $this->verifySecondFactorToken($user, $data['code'], true);
        if ($factorType === null) {
            return back()->withErrors([
                'code' => 'Codigo 2FA o codigo de recuperacion invalido. Intenta nuevamente.',
            ]);
        }

        $request->session()->put('admin_2fa_passed_at', time());

        $success = 'Verificacion 2FA completada.';
        if ($factorType === 'recovery') {
            $remaining = $user->getAdminTwoFactorRecoveryCodesRemainingCount();
            $success = "Verificacion completada con codigo de recuperacion. Restantes: {$remaining}.";
        }

        return redirect()
            ->intended(route('admin.dashboard'))
            ->with('success', $success);
    }

    private function verifySecondFactorToken(User $user, string $token, bool $consumeRecovery): ?string
    {
        $clean = trim($token);
        $digits = preg_replace('/\s+/', '', $clean) ?? '';

        $secret = $user->getAdminTwoFactorSecret();
        if ($secret && preg_match('/^\d{6}$/', $digits) && Totp::verifyCode($secret, $digits)) {
            return 'totp';
        }

        if ($consumeRecovery && $user->consumeAdminTwoFactorRecoveryCode($clean)) {
            return 'recovery';
        }

        return null;
    }

    /**
     * @param array<int, string> $codes
     */
    private function storeRecoveryExportPayload(Request $request, array $codes): void
    {
        $cleanCodes = array_values(array_filter(array_map(
            static fn (mixed $code): string => is_string($code) ? trim($code) : '',
            $codes
        )));

        if ($cleanCodes === []) {
            $request->session()->forget('admin_2fa_recovery_export');
            return;
        }

        $request->session()->put('admin_2fa_recovery_export', [
            'token' => Str::random(48),
            'codes' => $cleanCodes,
            'created_at' => time(),
        ]);
    }

    /**
     * @return array{token:string,codes:array<int,string>,created_at:int}|null
     */
    private function getRecoveryExportPayload(Request $request): ?array
    {
        $payload = $request->session()->get('admin_2fa_recovery_export');
        if (!is_array($payload)) {
            return null;
        }

        $token = trim((string) ($payload['token'] ?? ''));
        $createdAt = (int) ($payload['created_at'] ?? 0);
        $codes = $payload['codes'] ?? [];

        if ($token === '' || $createdAt <= 0 || !is_array($codes)) {
            $request->session()->forget('admin_2fa_recovery_export');
            return null;
        }

        $cleanCodes = array_values(array_filter(array_map(
            static fn (mixed $code): string => is_string($code) ? trim($code) : '',
            $codes
        )));

        if ($cleanCodes === []) {
            $request->session()->forget('admin_2fa_recovery_export');
            return null;
        }

        $ttlMinutes = max(1, (int) config('security.admin.two_factor_recovery_export_ttl_minutes', 30));
        if ((time() - $createdAt) > ($ttlMinutes * 60)) {
            $request->session()->forget('admin_2fa_recovery_export');
            return null;
        }

        return [
            'token' => $token,
            'codes' => $cleanCodes,
            'created_at' => $createdAt,
        ];
    }

    /**
     * @param array{token:string,codes:array<int,string>,created_at:int}|null $payload
     */
    private function payloadTokenMatches(?array $payload, string $token): bool
    {
        $token = trim($token);

        return $payload !== null
            && $token !== ''
            && hash_equals((string) $payload['token'], $token);
    }
}
