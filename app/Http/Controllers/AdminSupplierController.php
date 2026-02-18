<?php

namespace App\Http\Controllers;

use App\Models\Repair;
use App\Models\Supplier;
use App\Models\WarrantyIncident;
use App\Support\SupplierPartSearch;
use Illuminate\Http\Request;

class AdminSupplierController extends Controller
{
    /**
     * @return array<int, array{
     *   name:string,
     *   search_priority:int,
     *   search_endpoint:string,
     *   search_mode:string,
     *   search_enabled:bool,
     *   search_config?:array<string,mixed>
     * }>
     */
    private function defaultProviderCatalog(): array
    {
        return [
            [
                'name' => 'PuntoCell',
                'search_priority' => 10,
                'search_endpoint' => 'https://www.puntocell.com.ar/shop?search={query}',
                'search_mode' => 'html',
                'search_enabled' => true,
                'search_config' => [
                    'item_regex' => '/<div class="oe_product[\\s\\S]*?<\\/form>\\s*<\\/div>/i',
                    'name_regex' => '/o_wsale_products_item_title[\\s\\S]*?<a[^>]*>(.*?)<\\/a>/i',
                    'price_regex' => '/(?:\\$|ARS)[^0-9]{0,120}([0-9\\.,]+)/i',
                    'url_regex' => '/href="([^"]*\\/shop\\/\\d+\\-[^"]+)"/i',
                    'context_window' => 12000,
                ],
            ],
            [
                'name' => 'Evophone',
                'search_priority' => 20,
                'search_endpoint' => 'https://www.evophone.com.ar/?s={query}&post_type=product',
                'search_mode' => 'html',
                'search_enabled' => true,
                'search_config' => [
                    'candidate_paths' => ['/producto/'],
                    'exclude_paths' => ['/categoria-producto/', 'add-to-cart='],
                    'context_window' => 12000,
                    'stock_probe_product_page' => true,
                ],
            ],
            [
                'name' => 'CeluPhone',
                'search_priority' => 30,
                'search_endpoint' => 'https://celuphone.com.ar/?s={query}&post_type=product',
                'search_mode' => 'html',
                'search_enabled' => true,
                'search_config' => [
                    'candidate_paths' => ['/producto/'],
                    'exclude_paths' => ['/categoria-producto/', 'add-to-cart='],
                    'context_window' => 12000,
                ],
            ],
            [
                'name' => 'Okey Rosario',
                'search_priority' => 40,
                'search_endpoint' => 'https://okeyrosario.com.ar/?s={query}&post_type=product',
                'search_mode' => 'html',
                'search_enabled' => true,
                'search_config' => [
                    'candidate_paths' => ['/producto/'],
                    'exclude_paths' => ['/categoria-producto/', 'add-to-cart='],
                    'context_window' => 12000,
                ],
            ],
            [
                'name' => 'Electrostore',
                'search_priority' => 50,
                'search_endpoint' => 'https://electrostore.com.ar/?s={query}&post_type=product',
                'search_mode' => 'html',
                'search_enabled' => true,
                'search_config' => [
                    'candidate_paths' => ['/producto/'],
                    'exclude_paths' => ['/categoria-producto/', 'add-to-cart='],
                    'context_window' => 12000,
                ],
            ],
            [
                'name' => 'El Reparador de PC',
                'search_priority' => 60,
                'search_endpoint' => 'https://www.elreparadordepc.com/search_producto?term={query}',
                'search_mode' => 'html',
                'search_enabled' => true,
                'search_config' => [
                    'candidate_paths' => ['/producto/'],
                    'exclude_paths' => ['/categoria', '/carrito', '/deseos'],
                    'candidate_url_regex' => '/\\/producto\\/\\d+/',
                    'context_window' => 12000,
                ],
            ],
            [
                'name' => 'Tienda Movil Rosario',
                'search_priority' => 70,
                'search_endpoint' => 'https://tiendamovilrosario.com.ar/?s={query}&post_type=product',
                'search_mode' => 'html',
                'search_enabled' => true,
                'search_config' => [
                    'candidate_paths' => ['/product/'],
                    'exclude_paths' => ['/product-category/', 'add-to-cart='],
                    'context_window' => 12000,
                ],
            ],
        ];
    }

    public function index()
    {
        $suppliers = Supplier::query()
            ->withCount([
                'products',
                'warrantyIncidents',
                'warrantyIncidents as open_warranty_incidents_count' => fn ($q) => $q->where('status', 'open'),
            ])
            ->withSum('warrantyIncidents as warranty_loss_total', 'loss_amount')
            ->get()
            ->keyBy('id');

        $eligibleBySupplier = [];
        $successBySupplier = [];
        $failedBySupplier = [];

        $candidateRepairs = Repair::query()
            ->select(['id', 'supplier_id', 'delivered_at', 'warranty_days'])
            ->whereNotNull('supplier_id')
            ->whereNotNull('delivered_at')
            ->where('warranty_days', '>', 0)
            ->get();

        $candidateRepairIds = $candidateRepairs->pluck('id')->all();
        $incidentsByRepair = WarrantyIncident::query()
            ->select(['repair_id', 'happened_at'])
            ->whereNotNull('repair_id')
            ->whereIn('repair_id', $candidateRepairIds)
            ->get()
            ->groupBy('repair_id');

        foreach ($candidateRepairs as $repair) {
            $supplierId = (int) ($repair->supplier_id ?? 0);
            if ($supplierId <= 0) {
                continue;
            }

            $expiresAt = $repair->delivered_at?->copy()->addDays((int) $repair->warranty_days)->endOfDay();
            if (!$expiresAt || !$expiresAt->isPast()) {
                continue;
            }

            $eligibleBySupplier[$supplierId] = ($eligibleBySupplier[$supplierId] ?? 0) + 1;

            $hadIncidentInWindow = false;
            foreach (($incidentsByRepair[$repair->id] ?? collect()) as $incident) {
                $happenedAt = $incident->happened_at ?? null;
                if (!$happenedAt) {
                    continue;
                }

                if ($happenedAt->between($repair->delivered_at, $expiresAt, true)) {
                    $hadIncidentInWindow = true;
                    break;
                }
            }

            if ($hadIncidentInWindow) {
                $failedBySupplier[$supplierId] = ($failedBySupplier[$supplierId] ?? 0) + 1;
            } else {
                $successBySupplier[$supplierId] = ($successBySupplier[$supplierId] ?? 0) + 1;
            }
        }

        $suppliers = $suppliers
            ->map(function (Supplier $supplier) use ($eligibleBySupplier, $successBySupplier, $failedBySupplier): Supplier {
                $supplierId = (int) $supplier->id;
                $eligible = (int) ($eligibleBySupplier[$supplierId] ?? 0);
                $success = (int) ($successBySupplier[$supplierId] ?? 0);
                $failed = (int) ($failedBySupplier[$supplierId] ?? 0);
                $lossTotal = max(0, (int) ($supplier->warranty_loss_total ?? 0));
                $openIncidents = (int) ($supplier->open_warranty_incidents_count ?? 0);

                $successRate = $eligible > 0
                    ? (int) round(($success / max(1, $eligible)) * 100)
                    : null;

                $baseScore = $successRate ?? 80;
                $openPenalty = min(12, $openIncidents * 3);
                $lossPenalty = min(18, (int) round($lossTotal / 100000));
                $score = max(0, min(100, $baseScore - $openPenalty - $lossPenalty));

                if ($score >= 90) {
                    $tier = 'Excelente';
                } elseif ($score >= 75) {
                    $tier = 'Confiable';
                } elseif ($score >= 60) {
                    $tier = 'En seguimiento';
                } else {
                    $tier = 'Riesgo alto';
                }

                $supplier->warranty_eligible_count = $eligible;
                $supplier->warranty_success_count = $success;
                $supplier->warranty_failed_count = $failed;
                $supplier->warranty_success_rate = $successRate;
                $supplier->score = (int) $score;
                $supplier->score_tier = $tier;
                $supplier->warranty_loss_total = $lossTotal;

                return $supplier;
            })
            ->sortBy([
                ['active', 'desc'],
                ['search_priority', 'asc'],
                ['score', 'desc'],
                ['name', 'asc'],
            ])
            ->values();

        return view('admin.suppliers.index', [
            'suppliers' => $suppliers,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120', 'unique:suppliers,name'],
            'phone' => ['nullable', 'string', 'max:40'],
            'notes' => ['nullable', 'string', 'max:1500'],
            'search_priority' => ['nullable', 'integer', 'min:1', 'max:99999'],
            'search_enabled' => ['nullable', 'boolean'],
            'search_mode' => ['nullable', 'in:json,html'],
            'search_endpoint' => ['nullable', 'url', 'max:500'],
            'search_config' => ['nullable', 'string', 'max:4000'],
        ]);

        Supplier::query()->create([
            'name' => $data['name'],
            'phone' => $data['phone'] ?? null,
            'notes' => $data['notes'] ?? null,
            'active' => true,
            'search_priority' => (int) ($data['search_priority'] ?? 100),
            'search_enabled' => $request->boolean('search_enabled'),
            'search_mode' => (string) ($data['search_mode'] ?? 'json'),
            'search_endpoint' => $data['search_endpoint'] ?? null,
            'search_config' => $this->decodeSearchConfig($data['search_config'] ?? null),
        ]);

        return back()->with('success', 'Proveedor creado.');
    }

    public function update(Request $request, Supplier $supplier)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120', 'unique:suppliers,name,' . $supplier->id],
            'phone' => ['nullable', 'string', 'max:40'],
            'notes' => ['nullable', 'string', 'max:1500'],
            'search_priority' => ['nullable', 'integer', 'min:1', 'max:99999'],
            'search_enabled' => ['nullable', 'boolean'],
            'search_mode' => ['nullable', 'in:json,html'],
            'search_endpoint' => ['nullable', 'url', 'max:500'],
            'search_config' => ['nullable', 'string', 'max:4000'],
        ]);

        $supplier->update([
            'name' => $data['name'],
            'phone' => $data['phone'] ?? null,
            'notes' => $data['notes'] ?? null,
            'search_priority' => (int) ($data['search_priority'] ?? $supplier->search_priority ?? 100),
            'search_enabled' => $request->boolean('search_enabled'),
            'search_mode' => (string) ($data['search_mode'] ?? 'json'),
            'search_endpoint' => $data['search_endpoint'] ?? null,
            'search_config' => $this->decodeSearchConfig($data['search_config'] ?? null),
        ]);

        return back()->with('success', 'Proveedor actualizado.');
    }

    public function toggle(Supplier $supplier)
    {
        $supplier->update(['active' => !$supplier->active]);
        return back()->with('success', $supplier->active ? 'Proveedor activado.' : 'Proveedor desactivado.');
    }

    public function importDefaults()
    {
        $created = 0;
        $updated = 0;

        foreach ($this->defaultProviderCatalog() as $provider) {
            $supplier = Supplier::query()->where('name', $provider['name'])->first();
            if ($supplier) {
                $supplier->update([
                    'search_priority' => (int) ($provider['search_priority'] ?? ($supplier->search_priority ?? 100)),
                    'search_enabled' => (bool) $provider['search_enabled'],
                    'search_mode' => (string) $provider['search_mode'],
                    'search_endpoint' => (string) $provider['search_endpoint'],
                    'search_config' => $provider['search_config'] ?? null,
                ]);
                $updated++;
                continue;
            }

            Supplier::query()->create([
                'name' => (string) $provider['name'],
                'active' => true,
                'search_priority' => (int) ($provider['search_priority'] ?? 100),
                'search_enabled' => (bool) $provider['search_enabled'],
                'search_mode' => (string) $provider['search_mode'],
                'search_endpoint' => (string) $provider['search_endpoint'],
                'search_config' => $provider['search_config'] ?? null,
            ]);
            $created++;
        }

        return back()->with('success', "Proveedores sugeridos importados. Nuevos: {$created}. Actualizados: {$updated}.");
    }

    public function reorder(Request $request)
    {
        $raw = $request->input('ordered_ids');
        $orderedIds = [];
        if (is_string($raw) && trim($raw) !== '') {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                $orderedIds = $decoded;
            }
        } elseif (is_array($raw)) {
            $orderedIds = $raw;
        }

        $orderedIds = array_values(array_unique(array_map('intval', $orderedIds)));
        $validIds = Supplier::query()->whereIn('id', $orderedIds)->pluck('id')->map(fn ($id) => (int) $id)->all();
        $orderedIds = array_values(array_intersect($orderedIds, $validIds));
        if (count($orderedIds) === 0) {
            return back()->with('warning', 'No se pudo actualizar el orden.');
        }

        $priority = 10;
        foreach ($orderedIds as $id) {
            Supplier::query()->whereKey($id)->update(['search_priority' => $priority]);
            $priority += 10;
        }

        return back()->with('success', 'Orden de búsqueda actualizado.');
    }

    public function probe(Request $request, Supplier $supplier, SupplierPartSearch $search)
    {
        $data = $request->validate([
            'q' => ['nullable', 'string', 'min:2', 'max:120'],
        ]);

        $q = trim((string) ($data['q'] ?? 'modulo a30'));
        if ($q === '') {
            $q = 'modulo a30';
        }

        if (!$supplier->search_endpoint) {
            $supplier->update([
                'last_probe_status' => 'error',
                'last_probe_query' => $q,
                'last_probe_count' => 0,
                'last_probe_error' => 'Sin endpoint configurado',
                'last_probe_at' => now(),
            ]);
            return back()->with('warning', 'El proveedor no tiene endpoint de búsqueda configurado.');
        }

        try {
            $results = $search->probeSupplier($supplier, $q, 3);
        } catch (\Throwable) {
            $supplier->update([
                'last_probe_status' => 'error',
                'last_probe_query' => $q,
                'last_probe_count' => 0,
                'last_probe_error' => 'Fallo de conexión o parseo',
                'last_probe_at' => now(),
            ]);
            return back()->with('warning', "No se pudo consultar '{$supplier->name}'. Revisa endpoint/config.");
        }

        $status = count($results) > 0 ? 'ok' : 'empty';
        $supplier->update([
            'last_probe_status' => $status,
            'last_probe_query' => $q,
            'last_probe_count' => count($results),
            'last_probe_error' => null,
            'last_probe_at' => now(),
        ]);

        return back()->with('supplier_probe', [
            'supplier_id' => (int) $supplier->id,
            'supplier_name' => (string) $supplier->name,
            'query' => $q,
            'count' => count($results),
            'results' => array_map(static fn (array $row): array => [
                'part_name' => (string) ($row['part_name'] ?? 'Repuesto'),
                'price' => (int) ($row['price'] ?? 0),
                'stock' => (string) ($row['stock'] ?? '-'),
                'url' => (string) ($row['url'] ?? ''),
            ], $results),
        ]);
    }

    private function decodeSearchConfig(?string $json): ?array
    {
        $payload = trim((string) $json);
        if ($payload === '') {
            return null;
        }

        $decoded = json_decode($payload, true);
        if (!is_array($decoded)) {
            return null;
        }

        return $decoded;
    }
}
