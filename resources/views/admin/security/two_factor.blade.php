@extends('layouts.app')

@section('title', 'Admin - Seguridad 2FA')

@section('content')
<div class="space-y-6">
  <div class="flex items-start justify-between gap-4 flex-wrap">
    <div class="page-head mb-0 w-full lg:w-auto">
      <div class="page-title">Seguridad 2FA (Admin)</div>
      <div class="page-subtitle">Activa verificacion TOTP para reforzar el acceso al panel admin.</div>
    </div>

    @include('admin.settings.partials.top_actions')
  </div>

  @if(!empty($freshRecoveryCodes))
    <div class="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 space-y-3">
      <div class="font-black">Guarda estos codigos de recuperacion ahora</div>
      <div>Se muestran temporalmente. Cada codigo sirve para una sola verificacion.</div>
      <div class="grid gap-2 sm:grid-cols-2">
        @foreach($freshRecoveryCodes as $recoveryCode)
          <code class="block rounded-xl bg-zinc-900 text-zinc-100 px-3 py-2 text-sm">{{ $recoveryCode }}</code>
        @endforeach
      </div>
      <div class="text-xs text-amber-800">
        Disponibles por {{ (int) $recoveryExportTtlMinutes }} minutos desde su generacion.
      </div>
      @if($recoveryExportToken)
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
          <a
            class="btn-outline h-11 w-full justify-center sm:w-auto"
            href="{{ route('admin.two_factor.recovery.download', ['token' => $recoveryExportToken]) }}"
          >
            Descargar .txt
          </a>
          <a
            class="btn-outline h-11 w-full justify-center sm:w-auto"
            href="{{ route('admin.two_factor.recovery.print', ['token' => $recoveryExportToken]) }}"
            target="_blank"
            rel="noopener"
          >
            Imprimir / Guardar PDF
          </a>
          <form method="POST" action="{{ route('admin.two_factor.recovery.clear') }}" class="w-full sm:w-auto">
            @csrf
            <button type="submit" class="btn-outline h-11 w-full justify-center sm:w-auto">Ocultar codigos</button>
          </form>
        </div>
      @endif
    </div>
  @endif

  <div class="card">
    <div class="card-head">
      <div>
        <div class="font-black">Estado actual</div>
        <div class="text-xs text-zinc-500">Cuenta: {{ $accountLabel }}</div>
      </div>
      @if($isEnabled)
        <span class="badge-emerald">Activo</span>
      @else
        <span class="badge-zinc">Inactivo</span>
      @endif
    </div>
    <div class="card-body grid gap-4">
      @if($isEnabled)
        <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          2FA esta activo para esta cuenta admin.
          @if($enabledAt)
            <div class="mt-1 text-xs text-emerald-800">Activado: {{ $enabledAt->format('d/m/Y H:i') }}</div>
          @endif
        </div>

        <div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-800 space-y-2">
          <div><strong>Codigos de recuperacion restantes:</strong> {{ (int) $recoveryCodesRemaining }}</div>
          @if($recoveryCodesGeneratedAt)
            <div class="text-xs text-zinc-500">Ultima generacion: {{ $recoveryCodesGeneratedAt->format('d/m/Y H:i') }}</div>
          @endif
        </div>

        <form method="POST" action="{{ route('admin.two_factor.recovery.regenerate') }}" class="grid gap-3 rounded-2xl border border-zinc-200 p-4">
          @csrf
          <div class="font-bold">Regenerar codigos de recuperacion</div>
          <div class="grid gap-2">
            <label>Contrasena actual</label>
            <input type="password" name="current_password" class="h-11" autocomplete="current-password" required>
          </div>
          <div class="grid gap-2">
            <label>Codigo 2FA o codigo de recuperacion</label>
            <input type="text" name="code" class="h-11 uppercase tracking-[0.18em]" maxlength="64" autocomplete="one-time-code" required>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button class="btn-outline h-11 w-full justify-center sm:w-auto" type="submit">Regenerar codigos</button>
          </div>
        </form>

        <form method="POST" action="{{ route('admin.two_factor.disable') }}" class="grid gap-3">
          @csrf
          <div class="grid gap-2">
            <label>Contrasena actual</label>
            <input type="password" name="current_password" class="h-11" autocomplete="current-password" required>
          </div>
          <div class="grid gap-2">
            <label>Codigo 2FA o codigo de recuperacion</label>
            <input type="text" name="code" class="h-11 uppercase tracking-[0.18em]" maxlength="64" autocomplete="one-time-code" required>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button class="btn-danger h-11 w-full justify-center sm:w-auto" type="submit">Desactivar 2FA</button>
          </div>
        </form>
      @else
        <div class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Tu panel admin aun no tiene doble factor. Activalo para bloquear accesos aunque filtren tu contrasena.
        </div>

        @if(!$hasPendingSecret)
          <form method="POST" action="{{ route('admin.two_factor.regenerate') }}" class="grid gap-3">
            @csrf
            <button class="btn-primary h-11 w-full justify-center sm:w-auto" type="submit">Generar secreto 2FA</button>
          </form>
        @else
          <div class="grid gap-3">
            <div class="grid gap-1">
              <div class="text-xs font-bold uppercase tracking-wide text-zinc-500">Secreto</div>
              <code class="block rounded-xl bg-zinc-900 text-zinc-100 px-3 py-2 text-sm break-all">{{ $pendingSecret }}</code>
            </div>
            <div class="grid gap-1">
              <div class="text-xs font-bold uppercase tracking-wide text-zinc-500">URI OTPAuth</div>
              <textarea rows="3" readonly class="text-xs">{{ $otpauthUrl }}</textarea>
            </div>
            <div class="text-xs text-zinc-500">
              App sugeridas: Google Authenticator, Authy, Microsoft Authenticator. Puedes cargar el secreto manualmente o importar la URI.
            </div>
          </div>

          <form method="POST" action="{{ route('admin.two_factor.enable') }}" class="grid gap-3">
            @csrf
            <div class="grid gap-2">
              <label>Contrasena actual</label>
              <input type="password" name="current_password" class="h-11" autocomplete="current-password" required>
            </div>
            <div class="grid gap-2">
              <label>Codigo de 6 digitos</label>
              <input type="text" name="code" class="h-11 tracking-[0.3em]" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code" required>
            </div>
            <div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button class="btn-outline h-11 w-full justify-center sm:w-auto" type="submit" formaction="{{ route('admin.two_factor.regenerate') }}">Regenerar secreto</button>
              <button class="btn-primary h-11 w-full justify-center sm:w-auto" type="submit">Activar 2FA</button>
            </div>
          </form>
        @endif
      @endif
    </div>
  </div>
</div>
@endsection
