<?php

namespace App\Http\Controllers;

use App\Models\DeviceType;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminDeviceTypeController extends Controller
{
    public function index()
    {
        $deviceTypes = DeviceType::orderBy('name')->get();

        return view('admin.device_types.index', compact('deviceTypes'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'active' => ['nullable'],
        ]);

        $slugBase = Str::slug($data['name']);
        $slug = $slugBase ?: Str::random(8);

        $i = 2;
        while (DeviceType::where('slug', $slug)->exists()) {
            $slug = $slugBase . '-' . $i++;
        }

        DeviceType::create([
            'name' => $data['name'],
            'slug' => $slug,
            'active' => array_key_exists('active', $data),
        ]);

        return back()->with('success', 'Tipo de dispositivo creado.');
    }

    public function update(DeviceType $deviceType, Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'active' => ['nullable'],
        ]);

        $deviceType->update([
            'name' => $data['name'],
            'active' => array_key_exists('active', $data),
        ]);

        return back()->with('success', 'Tipo de dispositivo actualizado.');
    }
}
