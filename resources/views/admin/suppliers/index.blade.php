@extends('layouts.app')

@section('title', 'Admin - Proveedores')

@php
  $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');
  $probe = session('supplier_probe');
  $probeQuery = (string) request('probe_q', is_array($probe) ? ($probe['query'] ?? 'modulo a30') : 'modulo a30');
  $searchSuppliers = collect($suppliers)->filter(fn($s) => (bool) ($s->search_enabled ?? false))->sortBy('search_priority')->values();
  $scoreBadge = function ($score) {
    $s = (int) ($score ?? 0);
    if ($s >= 85) return 'badge-emerald';
    if ($s >= 70) return 'badge-sky';
    if ($s >= 50) return 'badge-amber';
    return 'badge-rose';
  };
  $probeBadge = function ($status) {
    return match ((string) $status) {
      'ok' => 'badge-emerald',
      'empty' => 'badge-amber',
      'error' => 'badge-rose',
      default => 'badge-zinc',
    };
  };
  $probeLabel = function ($status) {
    return match ((string) $status) {
      'ok' => 'Probe OK',
      'empty' => 'Sin resultados',
      'error' => 'Error probe',
      default => 'Sin probar',
    };
  };
@endphp

@section('content')
  <div class="space-y-5">
  <div class="flex items-start justify-between gap-3 flex-wrap">
    <div class="page-head mb-0">
      <div class="page-title">Proveedores</div>
      <div class="page-subtitle">Gestiona tus lugares de compra para trazabilidad de fallas.</div>
    </div>

    <div class="flex gap-2 w-full sm:w-auto">
      <form method="POST" action="{{ route('admin.suppliers.import_defaults') }}" data-disable-on-submit class="w-full sm:w-auto">
        @csrf
        <button class="btn-outline h-11 w-full sm:w-auto justify-center" type="submit">Importar sugeridos</button>
      </form>
      <a href="{{ route('admin.warranty_incidents.index') }}" class="btn-outline h-11 w-full sm:w-auto justify-center">Ver garantias</a>
    </div>
  </div>

  @if(session('success'))
    <div class="alert-success">{{ session('success') }}</div>
  @endif
  @if(session('warning'))
    <div class="alert-warning">{{ session('warning') }}</div>
  @endif

  <div class="card">
    <div class="card-head">
      <div class="font-black">Prioridad de busqueda</div>
      <span class="badge-zinc">Arrastra para ordenar</span>
    </div>
    <div class="card-body space-y-3">
      <form method="POST" action="{{ route('admin.suppliers.reorder') }}" data-disable-on-submit data-supplier-reorder-form>
        @csrf
        <ul class="space-y-2" data-supplier-sortable>
          @foreach($searchSuppliers as $s)
            <li class="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 flex items-center justify-between gap-2 cursor-move"
                draggable="true"
                data-supplier-item
                data-id="{{ $s->id }}">
              <div class="text-sm font-semibold text-zinc-900">{{ $s->name }}</div>
              <div class="text-xs text-zinc-500">Prioridad #{{ (int)($s->search_priority ?? 100) }}</div>
            </li>
          @endforeach
        </ul>
        <input type="hidden" name="ordered_ids" value="" data-supplier-ordered-ids>
        <div class="mt-3">
          <button class="btn-outline h-10 w-full sm:w-auto justify-center" type="submit">Guardar orden</button>
        </div>
      </form>
      <div class="text-xs text-zinc-500">Este orden se usa en la búsqueda progresiva de repuestos (primero arriba, luego abajo).</div>
    </div>
  </div>

  <div class="card">
    <div class="card-body">
      <form method="GET" action="{{ route('admin.suppliers.index') }}" class="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div class="space-y-1 w-full sm:max-w-sm">
          <label>Query de prueba para "Probar busqueda"</label>
          <input type="text" name="probe_q" value="{{ $probeQuery }}" class="h-11" placeholder="Ej: modulo samsung a30">
        </div>
        <button class="btn-outline h-11 w-full justify-center sm:w-auto" type="submit">Aplicar query</button>
      </form>
    </div>
  </div>

  <div class="card">
    <div class="card-head">
      <div class="font-black">Nuevo proveedor</div>
    </div>
    <div class="card-body">
      <form method="POST" action="{{ route('admin.suppliers.store') }}" class="grid gap-3 sm:grid-cols-2" data-disable-on-submit>
        @csrf
        <div class="space-y-1">
          <label>Nombre *</label>
          <input name="name" class="h-11" required placeholder="Ej: Importadora Centro">
        </div>
        <div class="space-y-1">
          <label>Telefono (opcional)</label>
          <input name="phone" class="h-11" placeholder="Ej: 3511234567">
        </div>
        <div class="space-y-1">
          <label>Prioridad de busqueda</label>
          <input name="search_priority" class="h-11" type="number" min="1" step="1" value="100">
        </div>
        <div class="space-y-1 sm:col-span-2">
          <label>Notas (opcional)</label>
          <textarea name="notes" rows="3" placeholder="Contacto, zona, tiempos, etc."></textarea>
        </div>
        <div class="space-y-1 sm:col-span-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
          <label class="inline-flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="search_enabled" value="1">
            <span>Habilitar búsqueda de repuestos</span>
          </label>
          <div class="mt-2 grid gap-2 sm:grid-cols-2">
            <div>
              <label>Modo</label>
              <select name="search_mode" class="h-11">
                <option value="json">JSON API</option>
                <option value="html">HTML simple</option>
              </select>
            </div>
            <div>
              <label>Endpoint (usar {query})</label>
              <input name="search_endpoint" class="h-11" placeholder="https://proveedor.com/api/search?q={query}">
            </div>
            <div class="sm:col-span-2">
              <label>Config JSON (opcional)</label>
              <textarea name="search_config" rows="2" placeholder='{"items_path":"items","name_field":"title","price_field":"price","stock_field":"stock","url_field":"url"}'></textarea>
            </div>
          </div>
        </div>
        <div class="sm:col-span-2">
          <button class="btn-primary h-11 justify-center w-full sm:w-auto" type="submit">Guardar proveedor</button>
        </div>
      </form>
    </div>
  </div>

  <div class="card">
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Proveedor</th>
            <th>Telefono</th>
            <th class="text-right">Productos</th>
            <th class="text-right">Incidentes</th>
            <th class="text-right">Garantias OK</th>
            <th class="text-right">Perdida</th>
            <th>Puntuacion</th>
            <th>Estado</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          @forelse($suppliers as $supplier)
            <tr>
              <td>
                <div class="font-semibold text-zinc-900">{{ $supplier->name }}</div>
                @if($supplier->notes)
                  <div class="text-xs text-zinc-500 mt-1">{{ $supplier->notes }}</div>
                @endif
              </td>
              <td class="text-sm text-zinc-700">{{ $supplier->phone ?: '-' }}</td>
              <td class="text-right font-semibold">{{ (int)$supplier->products_count }}</td>
              <td class="text-right font-semibold">{{ (int)$supplier->warranty_incidents_count }}</td>
              <td class="text-right font-semibold">
                {{ (int)($supplier->warranty_success_count ?? 0) }}/{{ (int)($supplier->warranty_eligible_count ?? 0) }}
                <div class="text-xs text-zinc-500 mt-1">
                  @if($supplier->warranty_success_rate !== null)
                    {{ (int)$supplier->warranty_success_rate }}% exito
                  @else
                    Sin garantias vencidas
                  @endif
                </div>
              </td>
              <td class="text-right font-semibold {{ (int)$supplier->warranty_loss_total > 0 ? 'text-rose-700' : 'text-zinc-700' }}">{{ $money((int)$supplier->warranty_loss_total) }}</td>
              <td>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="{{ $scoreBadge($supplier->score ?? 0) }}">{{ (int)($supplier->score ?? 0) }}/100</span>
                  <span class="text-xs font-semibold text-zinc-600">{{ $supplier->score_tier ?? 'Sin datos' }}</span>
                  <span class="{{ $probeBadge($supplier->last_probe_status) }}">{{ $probeLabel($supplier->last_probe_status) }}</span>
                </div>
                @if($supplier->last_probe_at)
                  <div class="text-[11px] text-zinc-500 mt-1">
                    {{ $supplier->last_probe_at->format('d/m H:i') }} | q: "{{ $supplier->last_probe_query ?: '-' }}" | n: {{ (int)($supplier->last_probe_count ?? 0) }}
                    @if($supplier->last_probe_error)
                      | {{ $supplier->last_probe_error }}
                    @endif
                  </div>
                @endif
              </td>
              <td><span class="{{ $supplier->active ? 'badge-emerald' : 'badge-zinc' }}">{{ $supplier->active ? 'Activo' : 'Inactivo' }}</span></td>
              <td class="text-right">
                <div class="inline-flex items-center gap-2">
                  @if($supplier->search_enabled)
                    <span class="badge-sky">Buscador ON</span>
                  @endif
                  <form method="POST" action="{{ route('admin.suppliers.probe', $supplier) }}" data-disable-on-submit>
                    @csrf
                    <input type="hidden" name="q" value="{{ $probeQuery }}">
                    <button class="btn-outline btn-sm" type="submit">Probar busqueda</button>
                  </form>
                  <form method="POST" action="{{ route('admin.suppliers.toggle', $supplier) }}" data-disable-on-submit>
                    @csrf
                    <button class="btn-outline btn-sm" type="submit">{{ $supplier->active ? 'Desactivar' : 'Activar' }}</button>
                  </form>
                </div>
              </td>
            </tr>
            @if(is_array($probe) && (int)($probe['supplier_id'] ?? 0) === (int)$supplier->id)
              <tr>
                <td colspan="9" class="pt-0">
                  <div class="mx-4 mb-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                    <div class="text-sm font-semibold text-zinc-900">
                      Prueba en {{ $probe['supplier_name'] ?? $supplier->name }} con "{{ $probe['query'] ?? '' }}"
                    </div>
                    <div class="text-xs text-zinc-600 mt-1">
                      Resultados con precio: {{ (int)($probe['count'] ?? 0) }}
                    </div>
                    @if(!empty($probe['results']) && is_array($probe['results']))
                      <div class="mt-2 space-y-1">
                        @foreach($probe['results'] as $row)
                          <div class="text-xs text-zinc-700">
                            • {{ $row['part_name'] ?? 'Repuesto' }} | {{ $money((int)($row['price'] ?? 0)) }} | {{ $row['stock'] ?? '-' }}
                          </div>
                        @endforeach
                      </div>
                    @endif
                  </div>
                </td>
              </tr>
            @endif
            <tr>
              <td colspan="9" class="pt-0 pb-4">
                <form method="POST" action="{{ route('admin.suppliers.update', $supplier) }}" class="grid gap-2 sm:grid-cols-3" data-disable-on-submit>
                  @csrf
                  @method('PUT')
                  <input name="name" class="h-10" value="{{ $supplier->name }}" required>
                  <input name="phone" class="h-10" value="{{ $supplier->phone }}">
                  <div class="flex gap-2">
                    <input name="notes" class="h-10 flex-1" value="{{ $supplier->notes }}" placeholder="Notas">
                    <button class="btn-ghost btn-sm h-10" type="submit">Actualizar</button>
                  </div>
                  <input name="search_priority" class="h-10 sm:col-span-1" type="number" min="1" step="1" value="{{ (int)($supplier->search_priority ?? 100) }}">
                  <label class="inline-flex items-center gap-2 text-xs font-semibold sm:col-span-3">
                    <input type="checkbox" name="search_enabled" value="1" @checked($supplier->search_enabled)>
                    <span>Busqueda de repuestos habilitada</span>
                  </label>
                  <select name="search_mode" class="h-10 sm:col-span-1">
                    <option value="json" @selected($supplier->search_mode === 'json')>JSON API</option>
                    <option value="html" @selected($supplier->search_mode === 'html')>HTML simple</option>
                  </select>
                  <input name="search_endpoint" class="h-10 sm:col-span-2" value="{{ $supplier->search_endpoint }}" placeholder="https://...{query}">
                  <textarea name="search_config" rows="2" class="sm:col-span-3" placeholder='{"items_path":"items","name_field":"title","price_field":"price","stock_field":"stock","url_field":"url"}'>{{ is_array($supplier->search_config) ? json_encode($supplier->search_config, JSON_UNESCAPED_UNICODE) : '' }}</textarea>
                </form>
              </td>
            </tr>
          @empty
            <tr><td colspan="9" class="text-center py-8 text-zinc-500">Aun no hay proveedores cargados.</td></tr>
          @endforelse
        </tbody>
      </table>
    </div>
  </div>
</div>
@endsection

<script>
(() => {
  const form = document.querySelector('[data-supplier-reorder-form]');
  if (!form) return;
  const list = form.querySelector('[data-supplier-sortable]');
  const hidden = form.querySelector('[data-supplier-ordered-ids]');
  if (!list || !hidden) return;

  let dragEl = null;

  const items = () => Array.from(list.querySelectorAll('[data-supplier-item]'));
  const refreshHidden = () => {
    const ids = items().map((el) => Number(el.dataset.id || 0)).filter((id) => id > 0);
    hidden.value = JSON.stringify(ids);
  };

  list.addEventListener('dragstart', (e) => {
    const target = e.target.closest('[data-supplier-item]');
    if (!target) return;
    dragEl = target;
    target.classList.add('opacity-50');
  });

  list.addEventListener('dragend', (e) => {
    const target = e.target.closest('[data-supplier-item]');
    if (target) target.classList.remove('opacity-50');
    dragEl = null;
    refreshHidden();
  });

  list.addEventListener('dragover', (e) => {
    e.preventDefault();
    const target = e.target.closest('[data-supplier-item]');
    if (!target || !dragEl || target === dragEl) return;

    const rect = target.getBoundingClientRect();
    const after = e.clientY > rect.top + rect.height / 2;
    if (after) {
      target.after(dragEl);
    } else {
      target.before(dragEl);
    }
  });

  form.addEventListener('submit', () => {
    refreshHidden();
  });

  refreshHidden();
})();
</script>
