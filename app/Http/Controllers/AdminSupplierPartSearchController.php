<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use App\Support\SupplierPartSearch;
use Illuminate\Http\Request;

class AdminSupplierPartSearchController extends Controller
{
    public function __invoke(Request $request, SupplierPartSearch $search)
    {
        $data = $request->validate([
            'q' => ['required', 'string', 'min:2', 'max:120'],
        ]);

        $results = $search->search((string) $data['q'], 5);
        $prices = array_values(array_filter(array_map(
            static fn (array $row): int => (int) ($row['price'] ?? 0),
            $results
        ), static fn (int $price): bool => $price > 0));

        $avgPrice = count($prices) > 0
            ? (int) round(array_sum($prices) / count($prices))
            : 0;
        $bestPrice = count($prices) > 0 ? min($prices) : 0;

        $ranked = array_map(static function (array $row) use ($avgPrice, $bestPrice): array {
            $price = (int) ($row['price'] ?? 0);
            $savingVsAvg = max(0, $avgPrice - $price);
            $savingPctVsAvg = $avgPrice > 0
                ? (int) round(($savingVsAvg / $avgPrice) * 100)
                : 0;

            $row['saving_vs_avg'] = $savingVsAvg;
            $row['saving_pct_vs_avg'] = $savingPctVsAvg;
            $row['is_best_price'] = $bestPrice > 0 && $price === $bestPrice;

            return $row;
        }, $results);

        return response()->json([
            'ok' => true,
            'query' => (string) $data['q'],
            'count' => count($ranked),
            'avg_price' => $avgPrice,
            'best_price' => $bestPrice,
            'results' => $ranked,
        ]);
    }

    public function bySupplier(Request $request, Supplier $supplier, SupplierPartSearch $search)
    {
        $data = $request->validate([
            'q' => ['required', 'string', 'min:2', 'max:120'],
        ]);

        if (!$supplier->active || !$supplier->search_enabled || !$supplier->search_endpoint) {
            return response()->json([
                'ok' => true,
                'query' => (string) $data['q'],
                'supplier' => [
                    'id' => (int) $supplier->id,
                    'name' => (string) $supplier->name,
                    'priority' => (int) ($supplier->search_priority ?? 100),
                ],
                'count' => 0,
                'results' => [],
            ]);
        }

        $results = $search->probeSupplier($supplier, (string) $data['q'], 5);

        return response()->json([
            'ok' => true,
            'query' => (string) $data['q'],
            'supplier' => [
                'id' => (int) $supplier->id,
                'name' => (string) $supplier->name,
                'priority' => (int) ($supplier->search_priority ?? 100),
            ],
            'count' => count($results),
            'results' => $results,
        ]);
    }
}
