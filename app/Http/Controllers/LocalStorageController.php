<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Storage;

class LocalStorageController extends Controller
{
    public function __invoke(string $path)
    {
        $allowedInThisEnv = app()->environment(['local', 'development'])
            || filter_var((string) env('APP_ALLOW_STORAGE_LOCAL_ROUTE', 'false'), FILTER_VALIDATE_BOOL);

        if (!$allowedInThisEnv) {
            abort(404);
        }

        $path = ltrim($path, '/');
        if (str_contains($path, '..')) {
            abort(400);
        }

        $disk = Storage::disk('public');
        if (!$disk->exists($path)) {
            abort(404);
        }

        return $disk->response($path);
    }
}

