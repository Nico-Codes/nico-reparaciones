@extends('layouts.app')

@section('title', 'Crear cuenta - NicoReparaciones')

@section('content')
    <section class="auth-container">
        <h1 class="hero-title">Crear cuenta</h1>
        <p class="hero-text">Registrate para hacer pedidos y seguir tus reparaciones.</p>

        @if($errors->any())
            <div class="alert-error">
                <ul>
                    @foreach($errors->all() as $error)
                        <li>- {{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <form action="{{ route('register.post') }}" method="POST" class="auth-form">
            @csrf

            <label for="name">Nombre</label>
            <input
                type="text"
                id="name"
                name="name"
                value="{{ old('name') }}"
                required
            >

            <label for="last_name">Apellido (opcional)</label>
            <input
                type="text"
                id="last_name"
                name="last_name"
                value="{{ old('last_name') }}"
            >

            <label for="phone">WhatsApp / Teléfono (opcional)</label>
            <input
                type="text"
                id="phone"
                name="phone"
                value="{{ old('phone') }}"
            >

            <label for="email">Correo electrónico</label>
            <input
                type="email"
                id="email"
                name="email"
                value="{{ old('email') }}"
                required
            >

            <label for="password">Contraseña</label>
            <input
                type="password"
                id="password"
                name="password"
                required
            >

            <label for="password_confirmation">Repetir contraseña</label>
            <input
                type="password"
                id="password_confirmation"
                name="password_confirmation"
                required
            >

            <button type="submit" class="btn" style="margin-top: 1rem;">
                Crear cuenta
            </button>
        </form>

        <p class="hero-text" style="margin-top: 1rem;">
            ¿Ya tenés cuenta?
            <a href="{{ route('login') }}">Iniciá sesión acá</a>.
        </p>
    </section>
@endsection
