<?php

namespace App\Support;

use App\Models\BusinessSetting;

class BrandAssets
{
    private const BASE_UPLOAD_DIR = 'brand-assets';

    private const DEFINITIONS = [
        'logo_main' => [
            'label' => 'Logo principal',
            'group' => 'logos',
            'fallback' => 'brand/logo.png',
            'extensions' => ['png', 'jpg', 'jpeg', 'webp', 'svg'],
            'max_kb' => 4096,
        ],
        'icon_store' => [
            'label' => 'Icono tienda',
            'group' => 'icons',
            'fallback' => 'icons/tienda.svg',
            'extensions' => ['svg', 'png', 'jpg', 'jpeg', 'webp'],
            'max_kb' => 2048,
        ],
        'icon_repair_lookup' => [
            'label' => 'Icono consultar reparacion',
            'group' => 'icons',
            'fallback' => 'icons/consultar-reparacion.svg',
            'extensions' => ['svg', 'png', 'jpg', 'jpeg', 'webp'],
            'max_kb' => 2048,
        ],
        'icon_cart' => [
            'label' => 'Icono carrito',
            'group' => 'icons',
            'fallback' => 'icons/carrito.svg',
            'extensions' => ['svg', 'png', 'jpg', 'jpeg', 'webp'],
            'max_kb' => 2048,
        ],
        'icon_orders' => [
            'label' => 'Icono mis pedidos',
            'group' => 'icons',
            'fallback' => 'icons/mis-pedidos.svg',
            'extensions' => ['svg', 'png', 'jpg', 'jpeg', 'webp'],
            'max_kb' => 2048,
        ],
        'icon_repairs' => [
            'label' => 'Icono mis reparaciones',
            'group' => 'icons',
            'fallback' => 'icons/mis-reparaciones.svg',
            'extensions' => ['svg', 'png', 'jpg', 'jpeg', 'webp'],
            'max_kb' => 2048,
        ],
        'icon_logout' => [
            'label' => 'Icono cerrar sesion',
            'group' => 'icons',
            'fallback' => 'icons/logout.svg',
            'extensions' => ['svg', 'png', 'jpg', 'jpeg', 'webp'],
            'max_kb' => 2048,
        ],
        'icon_dashboard' => [
            'label' => 'Icono panel admin',
            'group' => 'icons',
            'fallback' => 'icons/dashboard.svg',
            'extensions' => ['svg', 'png', 'jpg', 'jpeg', 'webp'],
            'max_kb' => 2048,
        ],
        'icon_settings' => [
            'label' => 'Icono ajustes',
            'group' => 'icons',
            'fallback' => 'icons/settings.svg',
            'extensions' => ['svg', 'png', 'jpg', 'jpeg', 'webp'],
            'max_kb' => 2048,
        ],
        'favicon_ico' => [
            'label' => 'Favicon .ico',
            'group' => 'favicons',
            'fallback' => 'favicon.ico',
            'extensions' => ['ico'],
            'max_kb' => 1024,
        ],
        'favicon_16' => [
            'label' => 'Favicon 16x16',
            'group' => 'favicons',
            'fallback' => 'favicon-16x16.png',
            'extensions' => ['png', 'ico', 'webp'],
            'max_kb' => 1024,
        ],
        'favicon_32' => [
            'label' => 'Favicon 32x32',
            'group' => 'favicons',
            'fallback' => 'favicon-32x32.png',
            'extensions' => ['png', 'ico', 'webp'],
            'max_kb' => 1024,
        ],
        'apple_touch_icon' => [
            'label' => 'Icono Apple Touch',
            'group' => 'favicons',
            'fallback' => 'apple-touch-icon.png',
            'extensions' => ['png', 'jpg', 'jpeg', 'webp'],
            'max_kb' => 2048,
        ],
        'android_chrome_192' => [
            'label' => 'Icono Android 192',
            'group' => 'favicons',
            'fallback' => 'android-chrome-192x192.png',
            'extensions' => ['png', 'jpg', 'jpeg', 'webp'],
            'max_kb' => 2048,
        ],
        'android_chrome_512' => [
            'label' => 'Icono Android 512',
            'group' => 'favicons',
            'fallback' => 'android-chrome-512x512.png',
            'extensions' => ['png', 'jpg', 'jpeg', 'webp'],
            'max_kb' => 4096,
        ],
    ];

    private static ?array $resolvedCache = null;

    public static function definitions(): array
    {
        return self::DEFINITIONS;
    }

    public static function definition(string $assetKey): ?array
    {
        return self::DEFINITIONS[$assetKey] ?? null;
    }

    public static function settingKey(string $assetKey): string
    {
        return 'brand_asset_' . $assetKey;
    }

    public static function uploadDir(): string
    {
        return self::BASE_UPLOAD_DIR;
    }

    public static function clearRuntimeCache(): void
    {
        self::$resolvedCache = null;
    }

    public static function resolved(): array
    {
        if (self::$resolvedCache !== null) {
            return self::$resolvedCache;
        }

        $settingKeys = [];
        foreach (array_keys(self::DEFINITIONS) as $assetKey) {
            $settingKeys[] = self::settingKey($assetKey);
        }

        $overrides = BusinessSetting::query()
            ->whereIn('key', $settingKeys)
            ->pluck('value', 'key')
            ->toArray();

        $resolved = [];
        foreach (self::DEFINITIONS as $assetKey => $definition) {
            $overrideKey = self::settingKey($assetKey);
            $rawOverride = (string) ($overrides[$overrideKey] ?? '');
            $normalizedOverride = self::normalizeRelativePath($rawOverride);

            $isCustom = $normalizedOverride !== null && file_exists(public_path($normalizedOverride));
            $relativePath = $isCustom ? $normalizedOverride : (string) $definition['fallback'];

            $resolved[$assetKey] = array_merge($definition, [
                'key' => $assetKey,
                'setting_key' => $overrideKey,
                'path' => $relativePath,
                'url' => asset($relativePath),
                'is_custom' => $isCustom,
                'custom_path' => $isCustom ? $normalizedOverride : null,
                'accept' => self::buildAcceptAttribute((array) ($definition['extensions'] ?? [])),
                'extensions_label' => strtoupper(implode(', ', (array) ($definition['extensions'] ?? []))),
            ]);
        }

        self::$resolvedCache = $resolved;

        return $resolved;
    }

    public static function url(string $assetKey): string
    {
        $resolved = self::resolved();
        if (isset($resolved[$assetKey]['url'])) {
            return (string) $resolved[$assetKey]['url'];
        }

        return asset('brand/logo.png');
    }

    public static function isManagedCustomPath(?string $relativePath): bool
    {
        $normalized = self::normalizeRelativePath((string) $relativePath);
        if ($normalized === null) {
            return false;
        }

        return str_starts_with($normalized, self::uploadDir() . '/');
    }

    public static function normalizeRelativePath(string $path): ?string
    {
        $path = trim(str_replace('\\', '/', $path));
        $path = ltrim($path, '/');

        if ($path === '' || str_contains($path, '..')) {
            return null;
        }

        return $path;
    }

    private static function buildAcceptAttribute(array $extensions): string
    {
        $items = [];
        foreach ($extensions as $ext) {
            $ext = strtolower(trim((string) $ext));
            if ($ext === '') {
                continue;
            }
            $items[] = '.' . $ext;
        }

        return implode(',', array_unique($items));
    }
}
