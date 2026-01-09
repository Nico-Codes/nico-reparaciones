<?php

namespace App\Http\Controllers;

use App\Models\RepairType;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminRepairTypeController extends Controller
{
    public function index()
    {
        $repairTypes = RepairType::orderBy('name')->get();
        return view('admin.repair_types.index', compact('repairTypes'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required','string','max:100'],
            'active' => ['nullable'],
        ]);

        $slugBase = Str::slug($data['name']);
        $slug = $slugBase;
        $i = 2;
        while (RepairType::where('slug', $slug)->exists()) {
            $slug = $slugBase . '-' . $i++;
        }

        RepairType::create([
            'name' => $data['name'],
            'slug' => $slug,
            'active' => (bool)($data['active'] ?? true),
        ]);

        return back()->with('success', 'Tipo de reparación creado.');
    }

    public function update(RepairType $repairType, Request $request)
    {
        $data = $request->validate([
            'name' => ['required','string','max:100'],
            'active' => ['nullable'],
        ]);

        $repairType->name = $data['name'];
        $repairType->active = (bool)($data['active'] ?? false);
        $repairType->save();

        return back()->with('success', 'Tipo de reparación actualizado.');
    }
}
