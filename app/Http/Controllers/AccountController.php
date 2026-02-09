<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;




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
                'phone'     => ['required', 'string', 'max:30', 'regex:/^(?=(?:\\D*\\d){8,15}\\D*$)[0-9+()\\s-]{8,30}$/'],
                'email'     => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            ], [
                'name.required'       => 'Ingresá tu nombre.',
                'name.max'            => 'El nombre no puede superar :max caracteres.',
                'last_name.required'  => 'Ingresá tu apellido.',
                'last_name.max'       => 'El apellido no puede superar :max caracteres.',
                'phone.required'      => 'Ingresá tu teléfono/WhatsApp.',
                'phone.regex'         => 'Ingresá un teléfono válido (solo números, espacios, +, -, paréntesis).',
                'phone.max'           => 'El teléfono no puede superar :max caracteres.',
                'email.required'      => 'Ingresá tu email.',
                'email.email'         => 'Ingresá un email válido.',
                'email.unique'        => 'Este email ya está registrado.',
                'email.max'           => 'El email no puede superar :max caracteres.',
            ]);


            $data['name']      = trim($data['name']);
            $data['last_name'] = trim($data['last_name']);
            $data['phone']     = trim($data['phone']);
            $data['email']     = Str::lower(trim($data['email']));

            $user->fill($data);
            $user->save();

            $returnTo = $request->session()->pull('profile_return_to');

            if ($returnTo) {
                return redirect()
                    ->to($returnTo)
                    ->with('success', 'Datos actualizados. Ya podés continuar.');
            }

            return redirect()
                ->route('account.edit')
                ->with('success', 'Datos actualizados.');

    }

    public function updatePassword(Request $request)
    {
        $user = Auth::user();
        $isGoogle = !empty($user->google_id);

        // ✅ Reglas: si NO es Google, pedimos contraseña actual.
        // Si es Google, permitimos setear una nueva sin current_password.
        $rules = [
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ];

        if (!$isGoogle) {
            $rules['current_password'] = ['required', 'string'];
        }

        $messages = [
            'current_password.required' => 'Ingresá tu contraseña actual.',
            'password.required'         => 'Ingresá una nueva contraseña.',
            'password.min'              => 'La nueva contraseña debe tener al menos :min caracteres.',
            'password.confirmed'        => 'La repetición de la contraseña no coincide.',
        ];

        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), $rules, $messages);

        if ($validator->fails()) {
            return back()
                ->withErrors($validator)
                ->withInput()
                ->withFragment('security');
        }

        $data = $validator->validated();

        // ✅ Si NO es Google, verificamos contraseña actual
        if (!$isGoogle) {
            if (!Hash::check($data['current_password'], $user->password)) {
                return back()
                    ->withErrors(['current_password' => 'La contraseña actual no es correcta.'])
                    ->withFragment('security');
            }
        }

        // ✅ Setear nueva contraseña
        $user->password = Hash::make($data['password']);
        $user->save();

        $request->session()->regenerate();

        return redirect()
            ->route('account.edit')
            ->with('password_success', 'Contraseña actualizada.')
            ->withFragment('security');

}




}
