<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
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
        $currentEmail = Str::lower(trim((string) $user->email));

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30', 'regex:/^(?=(?:\\D*\\d){8,15}\\D*$)[0-9+()\\s-]{8,30}$/'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
        ], [
            'name.required' => 'IngresÃ¡ tu nombre.',
            'name.max' => 'El nombre no puede superar :max caracteres.',
            'last_name.required' => 'IngresÃ¡ tu apellido.',
            'last_name.max' => 'El apellido no puede superar :max caracteres.',
            'phone.required' => 'IngresÃ¡ tu telÃ©fono/WhatsApp.',
            'phone.regex' => 'IngresÃ¡ un telÃ©fono vÃ¡lido (solo nÃºmeros, espacios, +, -, parÃ©ntesis).',
            'phone.max' => 'El telÃ©fono no puede superar :max caracteres.',
            'email.required' => 'IngresÃ¡ tu email.',
            'email.email' => 'IngresÃ¡ un email vÃ¡lido.',
            'email.unique' => 'Este email ya estÃ¡ registrado.',
            'email.max' => 'El email no puede superar :max caracteres.',
        ]);

        $data['name'] = trim($data['name']);
        $data['last_name'] = trim($data['last_name']);
        $data['phone'] = trim($data['phone']);
        $data['email'] = Str::lower(trim($data['email']));

        $emailChanged = $data['email'] !== $currentEmail;

        $user->fill($data);
        if ($emailChanged) {
            $user->email_verified_at = null;
        }
        $user->save();

        if ($emailChanged) {
            $user->sendEmailVerificationNotification();

            return redirect()
                ->route('verification.notice')
                ->with('success', 'Email actualizado. Verifica tu nuevo correo para habilitar todas las funciones.');
        }

        $returnTo = $request->session()->pull('profile_return_to');

        if ($returnTo) {
            return redirect()
                ->to($returnTo)
                ->with('success', 'Datos actualizados. Ya podÃ©s continuar.');
        }

        return redirect()
            ->route('account.edit')
            ->with('success', 'Datos actualizados.');
    }

    public function updatePassword(Request $request)
    {
        $user = Auth::user();

        $rules = [
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ];

        $messages = [
            'current_password.required' => 'IngresÃ¡ tu contraseÃ±a actual.',
            'password.required' => 'IngresÃ¡ una nueva contraseÃ±a.',
            'password.min' => 'La nueva contraseÃ±a debe tener al menos :min caracteres.',
            'password.confirmed' => 'La repeticiÃ³n de la contraseÃ±a no coincide.',
        ];

        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), $rules, $messages);

        if ($validator->fails()) {
            return back()
                ->withErrors($validator)
                ->withInput()
                ->withFragment('security');
        }

        $data = $validator->validated();

        if (!Hash::check($data['current_password'], $user->password)) {
            return back()
                ->withErrors(['current_password' => 'La contraseÃ±a actual no es correcta.'])
                ->withFragment('security');
        }

        $user->password = Hash::make($data['password']);
        $user->save();

        $request->session()->regenerate();

        return redirect()
            ->route('account.edit')
            ->with('password_success', 'ContraseÃ±a actualizada.')
            ->withFragment('security');
    }
}