<?php

namespace App\Http\Controllers;

use App\Models\LedgerEntry;
use Illuminate\Http\Request;

class AdminLedgerController extends Controller
{
    public function index(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        $direction = trim((string) $request->query('direction', ''));
        $category = trim((string) $request->query('category', ''));
        $from = trim((string) $request->query('from', now()->subDays(30)->format('Y-m-d')));
        $to = trim((string) $request->query('to', now()->format('Y-m-d')));

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $from)) {
            $from = now()->subDays(30)->format('Y-m-d');
        }
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
            $to = now()->format('Y-m-d');
        }

        $query = LedgerEntry::query()
            ->whereDate('happened_at', '>=', $from)
            ->whereDate('happened_at', '<=', $to);

        if (isset(LedgerEntry::DIRECTIONS[$direction])) {
            $query->where('direction', $direction);
        }

        if ($category !== '') {
            $query->where('category', $category);
        }

        if ($q !== '') {
            $query->where(function ($sub) use ($q): void {
                $sub->where('description', 'like', "%{$q}%")
                    ->orWhere('event_key', 'like', "%{$q}%")
                    ->orWhere('source_type', 'like', "%{$q}%");
            });
        }

        $entries = (clone $query)
            ->latest('happened_at')
            ->latest('id')
            ->paginate(25)
            ->withQueryString();

        $summary = (clone $query)
            ->selectRaw("COALESCE(SUM(CASE WHEN direction='inflow' THEN amount ELSE 0 END),0) as inflow_total")
            ->selectRaw("COALESCE(SUM(CASE WHEN direction='outflow' THEN amount ELSE 0 END),0) as outflow_total")
            ->selectRaw("COUNT(*) as entries_count")
            ->first();

        $inflowTotal = (int) ($summary->inflow_total ?? 0);
        $outflowTotal = (int) ($summary->outflow_total ?? 0);

        $categories = LedgerEntry::query()
            ->select('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category')
            ->all();

        $categorySummary = (clone $query)
            ->selectRaw('category')
            ->selectRaw("COALESCE(SUM(CASE WHEN direction='inflow' THEN amount ELSE 0 END),0) as inflow_total")
            ->selectRaw("COALESCE(SUM(CASE WHEN direction='outflow' THEN amount ELSE 0 END),0) as outflow_total")
            ->selectRaw('COUNT(*) as entries_count')
            ->groupBy('category')
            ->orderBy('category')
            ->get()
            ->map(static function ($row) {
                $inflow = (int) ($row->inflow_total ?? 0);
                $outflow = (int) ($row->outflow_total ?? 0);

                return [
                    'category' => (string) ($row->category ?? ''),
                    'entries_count' => (int) ($row->entries_count ?? 0),
                    'inflow_total' => $inflow,
                    'outflow_total' => $outflow,
                    'net_total' => $inflow - $outflow,
                ];
            });

        return view('admin.ledger.index', [
            'entries' => $entries,
            'q' => $q,
            'direction' => $direction,
            'category' => $category,
            'from' => $from,
            'to' => $to,
            'categories' => $categories,
            'directions' => LedgerEntry::DIRECTIONS,
            'entriesCount' => (int) ($summary->entries_count ?? 0),
            'inflowTotal' => $inflowTotal,
            'outflowTotal' => $outflowTotal,
            'netTotal' => $inflowTotal - $outflowTotal,
            'categorySummary' => $categorySummary,
        ]);
    }
}
