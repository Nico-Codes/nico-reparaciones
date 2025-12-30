<?php

namespace App\Support;

class WhatsApp
{
    /**
     * Normaliza un teléfono para WhatsApp en Argentina.
     * Devuelve solo dígitos con prefijo 549... (móvil) cuando aplica.
     */
    public static function normalizePhoneAR(?string $raw): ?string
    {
        $digits = preg_replace('/\D+/', '', (string) ($raw ?? '')) ?: '';
        if ($digits === '') return null;

        // Si viene como 00+país...
        if (str_starts_with($digits, '00')) {
            $digits = substr($digits, 2);
        }

        // Trunk 0 (0341... -> 341...)
        if (str_starts_with($digits, '0')) {
            $digits = ltrim($digits, '0');
        }

        // Prefijo móvil local "15"
        if (str_starts_with($digits, '15')) {
            $digits = substr($digits, 2);
        }

        $digits = trim($digits);
        if ($digits === '' || strlen($digits) < 8) return null;

        // Si ya viene con 54...
        if (str_starts_with($digits, '54')) {
            // Asegurar 549 (móvil) si no lo trae
            if (!str_starts_with($digits, '549')) {
                $digits = '549' . substr($digits, 2);
            }
            return $digits;
        }

        // Sin país -> asumimos AR móvil: 549 + número
        return '549' . $digits;
    }

    /**
     * Arma URL wa.me a partir de un teléfono "crudo" (pickup_phone / user.phone)
     * y un mensaje opcional.
     */
    public static function waMeUrlFromRaw(?string $rawPhone, ?string $message = null): ?string
    {
        $phone = self::normalizePhoneAR($rawPhone);
        if (!$phone) return null;

        $text = trim((string) ($message ?? ''));
        return "https://wa.me/{$phone}" . ($text !== '' ? ('?text=' . rawurlencode($text)) : '');
    }
}
