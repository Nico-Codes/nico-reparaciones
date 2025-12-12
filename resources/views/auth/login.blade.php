@extends('layouts.app')

@section('title', 'Iniciar sesión - NicoReparaciones')

@section('content')
    <section class="auth-container">
        <h1 class="hero-title">Iniciar sesión</h1>
        <p class="hero-text">Accedé para ver tu carrito y tus pedidos.</p>

        @if(session('success'))
            <div class="alert-success">{{ session('success') }}</div>
        @endif

        @if($errors->any())
            <div class="alert-error">
                <ul>
                    @foreach($errors->all() as $error)
                        <li>- {{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <form action="{{ route('login.post') }}" method="POST" class="auth-form">
            @csrf

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

            <label class="remember-me">
                <input type="checkbox" name="remember">
                Recordarme
            </label>

            <button type="submit" class="btn" style="margin-top: 1rem;">
                Iniciar sesión
            </button>
        </form>

        <p class="hero-text" style="margin-top: 1rem;">
            ¿No tenés cuenta?
            <a href="{{ route('register') }}">Registrate acá</a>.
        </p>

        {{-- Más adelante acá va el botón "Continuar con Google" --}}
        {{-- <a href="{{ route('auth.google.redirect') }}" class="btn btn-outline">Continuar con Google</a> --}}
    </section>
@endsection
