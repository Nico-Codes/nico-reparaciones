<?php

namespace App\Models;

use App\Notifications\ResetPasswordNotification;
use App\Notifications\VerifyEmailNotification;
use App\Support\MailDispatch;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable;

    private const ADMIN_2FA_RECOVERY_GROUPS = 3;
    private const ADMIN_2FA_RECOVERY_CHARS_PER_GROUP = 4;
    private const ADMIN_2FA_RECOVERY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    /**
     * The attributes that are mass assignable.
     *
     * Nota: este proyecto usa registro custom y además un campo `role` (user/admin).
     */
    protected $fillable = [
        'name',
        'last_name',
        'phone',
        'email',
        'google_id',
        'password',
        'role',

        // legado (por compatibilidad si quedó en alguna DB vieja)
        'is_admin',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'password',
        'remember_token',
        'admin_two_factor_secret',
        'admin_two_factor_recovery_codes',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
            'admin_two_factor_enabled_at' => 'datetime',
            'admin_two_factor_recovery_codes_generated_at' => 'datetime',
            'admin_two_factor_recovery_codes' => 'array',
        ];
    }

    /**
     * Pedidos realizados por el usuario.
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Reparaciones asociadas al usuario.
     */
    public function repairs(): HasMany
    {
        return $this->hasMany(Repair::class);
    }

    public function sendEmailVerificationNotification(): void
    {
        $notification = new VerifyEmailNotification();

        if (MailDispatch::asyncEnabled()) {
            $this->notify($notification);

            return;
        }

        Notification::sendNow($this, $notification);
    }

    public function sendPasswordResetNotification($token): void
    {
        $notification = new ResetPasswordNotification((string) $token);

        if (MailDispatch::asyncEnabled()) {
            $this->notify($notification);

            return;
        }

        Notification::sendNow($this, $notification);
    }

    /**
     * Helper para chequear admin (soporta `role` y `is_admin` legado).
     */
    public function isAdmin(): bool
    {
        return ($this->role ?? null) === 'admin' || (bool) ($this->is_admin ?? false);
    }

    public function hasAdminTwoFactorEnabled(): bool
    {
        return $this->isAdmin()
            && !empty($this->admin_two_factor_secret)
            && !empty($this->admin_two_factor_enabled_at);
    }

    public function getAdminTwoFactorRecoveryCodeHashes(): array
    {
        $codes = $this->admin_two_factor_recovery_codes;
        if (!is_array($codes)) {
            return [];
        }

        return array_values(array_filter(array_map(
            static fn (mixed $value): string => is_string($value) ? trim($value) : '',
            $codes
        )));
    }

    public function getAdminTwoFactorRecoveryCodesRemainingCount(): int
    {
        return count($this->getAdminTwoFactorRecoveryCodeHashes());
    }

    /**
     * @return array<int, string> Plain recovery codes.
     */
    public function generateAdminTwoFactorRecoveryCodes(?int $count = null): array
    {
        $count = max(1, (int) ($count ?? config('security.admin.two_factor_recovery_codes_count', 8)));

        $codes = [];
        while (count($codes) < $count) {
            $code = self::makeAdminTwoFactorRecoveryCode();
            if (!in_array($code, $codes, true)) {
                $codes[] = $code;
            }
        }

        $this->admin_two_factor_recovery_codes = array_map(
            static fn (string $code): string => Hash::make($code),
            $codes
        );
        $this->admin_two_factor_recovery_codes_generated_at = now();

        return $codes;
    }

    public function consumeAdminTwoFactorRecoveryCode(string $inputCode): bool
    {
        $normalizedInput = self::normalizeAdminTwoFactorRecoveryCode($inputCode);
        if ($normalizedInput === '') {
            return false;
        }

        $hashes = $this->getAdminTwoFactorRecoveryCodeHashes();
        if ($hashes === []) {
            return false;
        }

        $matched = false;
        $remaining = [];

        foreach ($hashes as $hash) {
            if (!$matched && Hash::check($normalizedInput, $hash)) {
                $matched = true;
                continue;
            }

            $remaining[] = $hash;
        }

        if (!$matched) {
            return false;
        }

        $this->admin_two_factor_recovery_codes = $remaining;
        $this->save();

        return true;
    }

    public function getAdminTwoFactorSecret(): ?string
    {
        if (!$this->admin_two_factor_secret) {
            return null;
        }

        try {
            return Crypt::decryptString((string) $this->admin_two_factor_secret);
        } catch (\Throwable) {
            return null;
        }
    }

    public static function normalizeAdminTwoFactorRecoveryCode(string $code): string
    {
        $clean = strtoupper(preg_replace('/[^A-Z0-9]/', '', $code) ?? '');
        $expectedLength = self::ADMIN_2FA_RECOVERY_GROUPS * self::ADMIN_2FA_RECOVERY_CHARS_PER_GROUP;
        if (strlen($clean) !== $expectedLength) {
            return '';
        }

        $chunks = str_split($clean, self::ADMIN_2FA_RECOVERY_CHARS_PER_GROUP);

        return implode('-', $chunks);
    }

    public static function makeAdminTwoFactorRecoveryCode(): string
    {
        $length = self::ADMIN_2FA_RECOVERY_GROUPS * self::ADMIN_2FA_RECOVERY_CHARS_PER_GROUP;
        $alphabet = self::ADMIN_2FA_RECOVERY_ALPHABET;
        $maxIndex = strlen($alphabet) - 1;

        $raw = '';
        for ($i = 0; $i < $length; $i++) {
            $raw .= $alphabet[random_int(0, $maxIndex)];
        }

        return self::normalizeAdminTwoFactorRecoveryCode($raw);
    }
}
