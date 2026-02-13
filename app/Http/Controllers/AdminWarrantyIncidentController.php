<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\Repair;
use App\Models\Supplier;
use App\Models\WarrantyIncident;
use Illuminate\Http\Request;

class AdminWarrantyIncidentController extends Controller
{
    public function index(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        $sourceType = trim((string) $request->query('source_type', ''));
        $status = trim((string) $request->query('status', ''));
        $from = trim((string) $request->query('from', ''));
        $to = trim((string) $request->query('to', ''));

        $query = WarrantyIncident::query()
            ->with([
                'repair:id,code,customer_name',
                'product:id,name,sku',
                'supplier:id,name',
                'order:id',
                'creator:id,name,last_name',
            ])
            ->latest('happened_at')
            ->latest('id');

        if ($q !== '') {
            $query->where(function ($inner) use ($q): void {
                $inner->where('title', 'like', "%{$q}%")
                    ->orWhere('reason', 'like', "%{$q}%")
                    ->orWhere('notes', 'like', "%{$q}%");
            });
        }

        if (isset(WarrantyIncident::SOURCE_TYPES[$sourceType])) {
            $query->where('source_type', $sourceType);
        }

        if (isset(WarrantyIncident::STATUSES[$status])) {
            $query->where('status', $status);
        }

        if ($from !== '') {
            $query->whereDate('happened_at', '>=', $from);
        }

        if ($to !== '') {
            $query->whereDate('happened_at', '<=', $to);
        }

        $incidents = $query->paginate(20)->withQueryString();

        $summaryQuery = WarrantyIncident::query();
        $summary = [
            'total_count' => (int) $summaryQuery->count(),
            'open_count' => (int) WarrantyIncident::query()->where('status', 'open')->count(),
            'closed_count' => (int) WarrantyIncident::query()->where('status', 'closed')->count(),
            'total_loss' => (int) WarrantyIncident::query()->sum('loss_amount'),
        ];

        $supplierStats = WarrantyIncident::query()
            ->selectRaw('supplier_id, COUNT(*) as incidents_count, COALESCE(SUM(loss_amount),0) as total_loss')
            ->whereNotNull('supplier_id')
            ->groupBy('supplier_id')
            ->orderByDesc('total_loss')
            ->limit(8)
            ->get()
            ->load('supplier:id,name');

        return view('admin.warranty_incidents.index', [
            'incidents' => $incidents,
            'summary' => $summary,
            'q' => $q,
            'sourceType' => $sourceType,
            'status' => $status,
            'from' => $from,
            'to' => $to,
            'sourceTypes' => WarrantyIncident::SOURCE_TYPES,
            'statuses' => WarrantyIncident::STATUSES,
            'supplierStats' => $supplierStats,
        ]);
    }

    public function create(Request $request)
    {
        $repairId = (int) $request->query('repair_id', 0);
        $productId = (int) $request->query('product_id', 0);
        $orderId = (int) $request->query('order_id', 0);

        $selectedRepair = $repairId > 0
            ? Repair::query()->select(['id', 'code', 'customer_name', 'supplier_id', 'parts_cost'])->find($repairId)
            : null;
        $selectedProduct = $productId > 0
            ? Product::query()->select(['id', 'name', 'sku', 'supplier_id', 'cost_price'])->find($productId)
            : null;
        $selectedOrder = $orderId > 0
            ? Order::query()->select(['id'])->find($orderId)
            : null;
        $selectedSupplierId = $selectedProduct?->supplier_id ?: $selectedRepair?->supplier_id;
        $selectedSupplier = $selectedSupplierId
            ? Supplier::query()->select(['id', 'name'])->find((int) $selectedSupplierId)
            : null;

        $recentRepairs = Repair::query()
            ->select(['id', 'code', 'customer_name', 'created_at', 'supplier_id', 'parts_cost'])
            ->latest('id')
            ->limit(30)
            ->get();

        $recentProducts = Product::query()
            ->select(['id', 'name', 'sku', 'active', 'supplier_id', 'cost_price'])
            ->orderByDesc('id')
            ->limit(50)
            ->get();
        $suppliers = Supplier::query()->where('active', true)->orderBy('name')->get(['id', 'name']);

        return view('admin.warranty_incidents.create', [
            'sourceTypes' => WarrantyIncident::SOURCE_TYPES,
            'selectedRepair' => $selectedRepair,
            'selectedProduct' => $selectedProduct,
            'selectedOrder' => $selectedOrder,
            'selectedSupplier' => $selectedSupplier,
            'recentRepairs' => $recentRepairs,
            'recentProducts' => $recentProducts,
            'suppliers' => $suppliers,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'source_type' => ['required', 'in:repair,product'],
            'title' => ['required', 'string', 'max:120'],
            'reason' => ['nullable', 'string', 'max:255'],
            'repair_id' => ['nullable', 'integer', 'exists:repairs,id'],
            'product_id' => ['nullable', 'integer', 'exists:products,id'],
            'order_id' => ['nullable', 'integer', 'exists:orders,id'],
            'supplier_id' => ['nullable', 'integer', 'exists:suppliers,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:999'],
            'unit_cost' => ['nullable', 'integer', 'min:0'],
            'extra_cost' => ['nullable', 'integer', 'min:0'],
            'recovered_amount' => ['nullable', 'integer', 'min:0'],
            'happened_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $quantity = (int) ($data['quantity'] ?? 1);
        $unitCost = (int) ($data['unit_cost'] ?? 0);
        $extraCost = (int) ($data['extra_cost'] ?? 0);
        $recovered = (int) ($data['recovered_amount'] ?? 0);

        $repairId = isset($data['repair_id']) ? (int) $data['repair_id'] : null;
        $productId = isset($data['product_id']) ? (int) $data['product_id'] : null;

        if ($data['source_type'] === 'repair' && !$repairId) {
            return back()->withErrors(['repair_id' => 'Selecciona la reparacion asociada.'])->withInput();
        }

        if ($data['source_type'] === 'product' && !$productId) {
            return back()->withErrors(['product_id' => 'Selecciona el producto asociado.'])->withInput();
        }

        if ($unitCost <= 0 && $repairId) {
            $repairPartsCost = (float) (Repair::query()->whereKey($repairId)->value('parts_cost') ?? 0);
            $unitCost = max(0, (int) round($repairPartsCost));
        }

        if ($unitCost <= 0 && $productId) {
            $productCost = (int) (Product::query()->whereKey($productId)->value('cost_price') ?? 0);
            $unitCost = max(0, $productCost);
        }

        if ($unitCost <= 0) {
            return back()->withErrors(['unit_cost' => 'No se pudo resolver costo unitario automatico. Cargalo manualmente.'])->withInput();
        }

        $loss = ($quantity * $unitCost) + $extraCost - $recovered;

        $supplierId = isset($data['supplier_id']) ? (int) $data['supplier_id'] : null;
        if (!$supplierId && $repairId) {
            $supplierId = (int) (Repair::query()->whereKey($repairId)->value('supplier_id') ?? 0);
        }
        if (!$supplierId && $productId) {
            $supplierId = (int) (Product::query()->whereKey($productId)->value('supplier_id') ?? 0);
        }
        if ($supplierId <= 0) {
            $supplierId = null;
        }

        WarrantyIncident::query()->create([
            'source_type' => $data['source_type'],
            'status' => 'open',
            'title' => $data['title'],
            'reason' => $data['reason'] ?? null,
            'repair_id' => $repairId,
            'product_id' => $productId,
            'order_id' => isset($data['order_id']) ? (int) $data['order_id'] : null,
            'supplier_id' => $supplierId,
            'quantity' => $quantity,
            'unit_cost' => $unitCost,
            'extra_cost' => $extraCost,
            'recovered_amount' => $recovered,
            'loss_amount' => $loss,
            'happened_at' => $data['happened_at'] ?? now(),
            'notes' => $data['notes'] ?? null,
            'created_by' => auth()->id(),
        ]);

        return redirect()
            ->route('admin.warranty_incidents.index')
            ->with('success', 'Incidente de garantia registrado correctamente.');
    }

    public function close(WarrantyIncident $incident)
    {
        $incident->update([
            'status' => 'closed',
            'resolved_at' => now(),
        ]);

        return back()->with('success', 'Incidente marcado como cerrado.');
    }
}
