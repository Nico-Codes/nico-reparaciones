<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;



class AccountController extends Controller
{
    public function edit()
    {
        return view('account.edit', [
            'user' => Auth::user(),
        ]);
    }

    public function update(Request $request)
    {
        $user = Auth::user();

        $data = $request->validate([
            'name'      => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'phone'     => ['required', 'string', 'max:30'],
            'email'     => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
        ]);

        $user->fill($data);
        $user->save();

        return redirect()
            ->route('account.edit')
            ->with('success', 'Datos actualizados.');
    }

    public function updatePassword(Request $request)
    {
        $user = Auth::user();

        $validator = Validator::make(
            $request->all(),
            [
                'current_password' => ['required', 'string'],
                'password'         => ['required', 'string', 'min:8', 'confirmed'],
            ],
            [
                // Mensajes en español (solo para este form)
                'current_password.required' => 'Ingresá tu contraseña actual.',
                'password.required'         => 'Ingresá una nueva contraseña.',
                'password.min'              => 'La nueva contraseña debe tener al menos :min caracteres.',
                'password.confirmed'        => 'La repetición de la contraseña no coincide.',
            ]
        );

        if ($validator->fails()) {
            return back()
                ->withErrors($validator)
                ->withInput()
                ->withFragment('security'); // ✅ vuelve scrolleado a Seguridad
        }

        $data = $validator->validated();

        if (!Hash::check($data['current_password'], $user->password)) {
            return back()
                ->withErrors(['current_password' => 'La contraseña actual no es correcta.'])
                ->withFragment('security');
        }

        $user->password = Hash::make($data['password']);
        $user->save();

        $request->session()->regenerate();

        return redirect()
            ->route('account.edit')
            ->with('success', 'Contraseña actualizada.')
            ->withFragment('security');
    }



}
