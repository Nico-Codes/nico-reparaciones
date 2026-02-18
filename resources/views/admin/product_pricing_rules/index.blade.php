@extends('layouts.app')

@section('title', 'Admin - Reglas de productos')

@section('content')
<div class="store-shell space-y-6">
  <div class="reveal-item rounded-3xl border border-zinc-200/80 bg-gradient-to-r from-white via-sky-50/60 to-white p-4 sm:p-6">
    <div class="page-head mb-0">
      <div>
        <div class="page-title">Reglas de productos (costo -> venta)</div>
        <div class="page-subtitle">Define margen por categoria o producto. El sistema aplica la mejor coincidencia.</div>
      </div>
      <div class="flex w-full gap-2 flex-wrap sm:w-auto">
        <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.calculations.index') }}">Reglas de calculo</a>
        <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.products.index') }}">Productos</a>
      </div>
    </div>
  </div>

  @if (session('success'))
    <div class="reveal-item alert-success">{{ session('success') }}</div>
  @endif

  @if ($errors->any())
    <div class="reveal-item alert-error">
      <div class="font-black">Hay errores para corregir</div>
      <ul class="mt-2 list-disc pl-5 text-sm">
        @foreach ($errors->all() as $error)
          <li>{{ $error }}</li>
        @endforeach
      </ul>
    </div>
  @endif

  @if($schemaMissing ?? false)
    <div class="reveal-item alert-warning">
      <div class="font-black">Faltan migraciones para reglas de productos</div>
      <div class="mt-1">No existe la tabla <code>product_pricing_rules</code>. Ejecuta <code>php artisan migrate</code> para habilitar este modulo.</div>
      @if(Route::has('admin.maintenance.migrate') && (app()->environment(['local', 'development']) || filter_var((string) env('APP_ALLOW_WEB_MIGRATE', 'false'), FILTER_VALIDATE_BOOL)))
        <form method="POST" action="{{ route('admin.maintenance.migrate') }}" class="mt-3">
          @csrf
          <button type="submit" class="btn-outline btn-sm" data-confirm="Esto ejecutara php artisan migrate. Continuar?">Aplicar migraciones ahora</button>
        </form>
      @endif
    </div>
  @endif

  <div class="reveal-item grid gap-4 lg:grid-cols-2">
    <div class="card">
      <div class="card-head">
        <div class="font-black">Preferencias de calculo</div>
      </div>
      <div class="card-body">
        <form method="POST" action="{{ route('admin.product_pricing_rules.settings.update') }}" class="space-y-3">
          @csrf
          <div>
            <label>Margen por defecto (%)</label>
            <input name="product_default_margin_percent" class="h-11" type="number" step="0.01" min="0" max="500" value="{{ old('product_default_margin_percent', $defaultMarginPercent ?? '35') }}" required>
            <p class="mt-1 text-xs text-zinc-500">Se usa cuando no hay una regla puntual para el producto o categoria.</p>
          </div>

          <label class="inline-flex items-start gap-2 text-sm font-black text-zinc-800">
            <input type="checkbox" name="product_prevent_negative_margin" value="1" class="mt-0.5 h-4 w-4 rounded border-zinc-300" @checked(old('product_prevent_negative_margin', $preventNegativeMargin ?? true))>
            <span>Bloquear ventas con margen negativo (precio menor al costo)</span>
          </label>

          <div class="flex justify-end">
            <button class="btn-primary h-11" type="submit">Guardar preferencias</button>
          </div>
        </form>
      </div>
    </div>

    <div id="productPricingSimulator" class="card" data-product-pricing-simulator data-resolve-url="{{ route('admin.product_pricing_rules.resolve') }}">
      <div class="card-head">
        <div class="font-black">Simulador rapido</div>
      </div>
      <div class="card-body space-y-3">
        <div>
          <label>Categoria</label>
          <select class="h-11" data-sim-category>
            <option value="">Seleccionar categoria...</option>
            @foreach($categories as $category)
              <option value="{{ $category->id }}">{{ $category->name }}</option>
            @endforeach
          </select>
        </div>

        <div>
          <label>Producto (opcional)</label>
          <select class="h-11" data-sim-product>
            <option value="">Todos</option>
            @foreach($products as $product)
              <option value="{{ $product->id }}">{{ $product->name }}</option>
            @endforeach
          </select>
        </div>

        <div>
          <label>Costo</label>
          <input class="h-11" type="number" min="0" step="1" value="5000" data-sim-cost>
        </div>

        <button class="btn-outline h-11 w-full justify-center" type="button" data-sim-run>Simular precio recomendado</button>

        <div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700" data-sim-result>
          Completa categoria y costo para ver el resultado.
        </div>
      </div>
    </div>
  </div>

  <div class="reveal-item card">
    <div class="card-head">
      <div class="font-black">Nueva regla</div>
    </div>
    <div class="card-body">
      <form method="POST" action="{{ route('admin.product_pricing_rules.store') }}" class="grid gap-3 md:grid-cols-3">
        @csrf
        <div class="md:col-span-3">
          <label>Nombre *</label>
          <input class="h-11" name="name" value="{{ old('name') }}" required placeholder="Ej: Cables economicos (< 5000) +50%">
        </div>

        <div>
          <label>Categoria (opcional)</label>
          <select class="h-11" name="category_id">
            <option value="">Todas</option>
            @foreach($categories as $category)
              <option value="{{ $category->id }}">{{ $category->name }}</option>
            @endforeach
          </select>
        </div>

        <div>
          <label>Producto (opcional)</label>
          <select class="h-11" name="product_id">
            <option value="">Todos</option>
            @foreach($products as $product)
              <option value="{{ $product->id }}">{{ $product->name }}</option>
            @endforeach
          </select>
        </div>

        <div>
          <label>Margen % *</label>
          <input class="h-11" name="margin_percent" type="number" step="0.01" min="0" max="500" value="{{ old('margin_percent', '50') }}" required>
        </div>

        <div>
          <label>Costo minimo</label>
          <input class="h-11" name="cost_min" type="number" min="0" value="{{ old('cost_min') }}" placeholder="Ej: 0">
        </div>

        <div>
          <label>Costo maximo</label>
          <input class="h-11" name="cost_max" type="number" min="0" value="{{ old('cost_max') }}" placeholder="Ej: 5000">
        </div>

        <div>
          <label>Prioridad</label>
          <input class="h-11" name="priority" type="number" value="{{ old('priority', 0) }}">
        </div>

        <div class="md:col-span-3">
          <label class="inline-flex items-center gap-2 text-sm font-black text-zinc-800">
            <input type="checkbox" name="active" value="1" checked class="h-4 w-4 rounded border-zinc-300">
            Regla activa
          </label>
        </div>

        <div class="md:col-span-3 flex justify-end">
          <button class="btn-primary h-11" type="submit" @disabled($schemaMissing ?? false)>Crear regla</button>
        </div>
      </form>
    </div>
  </div>

  <div class="reveal-item card">
    <div class="card-head">
      <div class="font-black">Reglas cargadas</div>
      <span class="badge-zinc">{{ $rules->count() }} reglas</span>
    </div>
    <div class="card-body space-y-3">
      @forelse($rules as $rule)
        <div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
          <form method="POST" action="{{ route('admin.product_pricing_rules.update', $rule) }}" class="grid gap-2 md:grid-cols-8">
            @csrf
            @method('PUT')
            <div class="md:col-span-2">
              <label>Nombre</label>
              <input class="h-10" name="name" value="{{ $rule->name }}" required>
            </div>
            <div>
              <label>Categoria</label>
              <select class="h-10" name="category_id">
                <option value="">Todas</option>
                @foreach($categories as $category)
                  <option value="{{ $category->id }}" @selected((int)$rule->category_id === (int)$category->id)>{{ $category->name }}</option>
                @endforeach
              </select>
            </div>
            <div>
              <label>Producto</label>
              <select class="h-10" name="product_id">
                <option value="">Todos</option>
                @foreach($products as $product)
                  <option value="{{ $product->id }}" @selected((int)$rule->product_id === (int)$product->id)>{{ $product->name }}</option>
                @endforeach
              </select>
            </div>
            <div>
              <label>%</label>
              <input class="h-10" name="margin_percent" type="number" step="0.01" min="0" max="500" value="{{ (float)$rule->margin_percent }}" required>
            </div>
            <div>
              <label>Min</label>
              <input class="h-10" name="cost_min" type="number" min="0" value="{{ $rule->cost_min }}">
            </div>
            <div>
              <label>Max</label>
              <input class="h-10" name="cost_max" type="number" min="0" value="{{ $rule->cost_max }}">
            </div>
            <div>
              <label>Prioridad</label>
              <input class="h-10" name="priority" type="number" value="{{ (int)$rule->priority }}">
            </div>
            <div class="md:col-span-8 flex flex-wrap items-center justify-between gap-2">
              <label class="inline-flex items-center gap-2 text-sm font-black text-zinc-800">
                <input type="checkbox" name="active" value="1" @checked($rule->active) class="h-4 w-4 rounded border-zinc-300">
                Activa
              </label>
              <div class="flex gap-2">
                <button class="btn-outline btn-sm" type="submit">Guardar</button>
                <button class="btn-outline btn-sm text-rose-700" type="submit" form="delete-rule-{{ $rule->id }}">Eliminar</button>
              </div>
            </div>
          </form>
          <form id="delete-rule-{{ $rule->id }}" method="POST" action="{{ route('admin.product_pricing_rules.destroy', $rule) }}" class="hidden" onsubmit="return confirm('Eliminar regla?');">
            @csrf
            @method('DELETE')
          </form>
        </div>
      @empty
        <div class="text-sm text-zinc-500">No hay reglas cargadas.</div>
      @endforelse
    </div>
  </div>

  <div data-react-product-pricing-simulator data-root-id="productPricingSimulator"></div>
</div>
@endsection
