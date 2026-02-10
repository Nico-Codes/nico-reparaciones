<?php

namespace App\Support;

use InvalidArgumentException;

class Totp
{
    private const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    public static function generateSecret(int $length = 32): string
    {
        $length = max(16, $length);
        $rawLength = (int) ceil($length * 5 / 8);
        $raw = random_bytes($rawLength + 2);
        $secret = self::base32Encode($raw);

        return substr($secret, 0, $length);
    }

    public static function buildOtpAuthUri(
        string $issuer,
        string $accountName,
        string $secret,
        int $digits = 6,
        int $period = 30
    ): string {
        $issuer = trim($issuer);
        $accountName = trim($accountName);
        $secret = strtoupper(trim($secret));

        if ($issuer === '' || $accountName === '' || $secret === '') {
            throw new InvalidArgumentException('Issuer, account name and secret are required.');
        }

        $label = rawurlencode($issuer.':'.$accountName);
        $query = http_build_query([
            'secret' => $secret,
            'issuer' => $issuer,
            'algorithm' => 'SHA1',
            'digits' => $digits,
            'period' => $period,
        ]);

        return "otpauth://totp/{$label}?{$query}";
    }

    public static function verifyCode(
        string $secret,
        string $code,
        int $window = 1,
        int $digits = 6,
        ?int $timestamp = null
    ): bool {
        $normalizedCode = preg_replace('/\s+/', '', $code) ?? '';
        if (!preg_match('/^\d{6,8}$/', $normalizedCode)) {
            return false;
        }

        $binarySecret = self::base32Decode($secret);
        if ($binarySecret === '') {
            return false;
        }

        $window = max(0, $window);
        $timestamp ??= time();
        $counter = (int) floor($timestamp / 30);

        for ($offset = -$window; $offset <= $window; $offset++) {
            $expected = self::hotp($binarySecret, $counter + $offset, $digits);
            if (hash_equals($expected, str_pad($normalizedCode, $digits, '0', STR_PAD_LEFT))) {
                return true;
            }
        }

        return false;
    }

    public static function currentCode(string $secret, ?int $timestamp = null, int $digits = 6): string
    {
        $binarySecret = self::base32Decode($secret);
        if ($binarySecret === '') {
            return '';
        }

        $timestamp ??= time();
        $counter = (int) floor($timestamp / 30);

        return self::hotp($binarySecret, $counter, $digits);
    }

    private static function hotp(string $binarySecret, int $counter, int $digits): string
    {
        $digits = max(6, min(8, $digits));
        $counter = max(0, $counter);

        $high = (int) floor($counter / 0x100000000);
        $low = $counter % 0x100000000;
        $counterBytes = pack('N2', $high, $low);

        $hash = hash_hmac('sha1', $counterBytes, $binarySecret, true);
        $offset = ord(substr($hash, -1)) & 0x0f;
        $binaryCode =
            ((ord($hash[$offset]) & 0x7f) << 24) |
            ((ord($hash[$offset + 1]) & 0xff) << 16) |
            ((ord($hash[$offset + 2]) & 0xff) << 8) |
            (ord($hash[$offset + 3]) & 0xff);

        $otp = $binaryCode % (10 ** $digits);

        return str_pad((string) $otp, $digits, '0', STR_PAD_LEFT);
    }

    private static function base32Encode(string $binary): string
    {
        if ($binary === '') {
            return '';
        }

        $bits = 0;
        $buffer = 0;
        $output = '';

        $length = strlen($binary);
        for ($i = 0; $i < $length; $i++) {
            $buffer = ($buffer << 8) | ord($binary[$i]);
            $bits += 8;

            while ($bits >= 5) {
                $bits -= 5;
                $index = ($buffer >> $bits) & 0x1f;
                $output .= self::BASE32_ALPHABET[$index];
            }
        }

        if ($bits > 0) {
            $index = ($buffer << (5 - $bits)) & 0x1f;
            $output .= self::BASE32_ALPHABET[$index];
        }

        return $output;
    }

    private static function base32Decode(string $secret): string
    {
        $clean = strtoupper(preg_replace('/[^A-Z2-7]/', '', $secret) ?? '');
        if ($clean === '') {
            return '';
        }

        $bits = 0;
        $buffer = 0;
        $output = '';

        $length = strlen($clean);
        for ($i = 0; $i < $length; $i++) {
            $char = $clean[$i];
            $value = strpos(self::BASE32_ALPHABET, $char);
            if ($value === false) {
                return '';
            }

            $buffer = ($buffer << 5) | $value;
            $bits += 5;

            if ($bits >= 8) {
                $bits -= 8;
                $output .= chr(($buffer >> $bits) & 0xff);
            }
        }

        return $output;
    }
}
