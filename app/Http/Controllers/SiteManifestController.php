<?php

namespace App\Http\Controllers;

use App\Support\BrandAssets;
use Illuminate\Http\JsonResponse;

class SiteManifestController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'name' => config('app.name', 'NicoReparaciones'),
            'short_name' => config('app.name', 'NicoReparaciones'),
            'icons' => [
                [
                    'src' => BrandAssets::url('android_chrome_192'),
                    'sizes' => '192x192',
                    'type' => 'image/png',
                ],
                [
                    'src' => BrandAssets::url('android_chrome_512'),
                    'sizes' => '512x512',
                    'type' => 'image/png',
                ],
            ],
            'theme_color' => '#0ea5e9',
            'background_color' => '#ffffff',
            'display' => 'standalone',
        ], 200, [
            'Content-Type' => 'application/manifest+json',
        ]);
    }
}
