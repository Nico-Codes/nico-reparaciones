<?php

namespace App\Support;

use App\Models\LedgerEntry;
use Illuminate\Database\Eloquent\Model;

class LedgerBook
{
    /**
     * @param array{
     *   happened_at?: \DateTimeInterface|string|null,
     *   direction: 'inflow'|'outflow',
     *   amount: int,
     *   category: string,
     *   description?: string|null,
     *   source?: Model|null,
     *   source_type?: string|null,
     *   source_id?: int|null,
     *   event_key?: string|null,
     *   created_by?: int|null,
     *   meta?: array<string,mixed>|null
     * } $data
     */
    public static function record(array $data): LedgerEntry
    {
        $direction = (string) ($data['direction'] ?? '');
        if (!isset(LedgerEntry::DIRECTIONS[$direction])) {
            throw new \InvalidArgumentException('Invalid ledger direction');
        }

        $amount = max(0, (int) ($data['amount'] ?? 0));
        if ($amount <= 0) {
            throw new \InvalidArgumentException('Ledger amount must be greater than zero');
        }

        $source = $data['source'] ?? null;
        $sourceType = $data['source_type'] ?? ($source ? $source::class : null);
        $sourceId = $data['source_id'] ?? ($source ? (int) ($source->getKey() ?? 0) : null);

        $payload = [
            'happened_at' => $data['happened_at'] ?? now(),
            'direction' => $direction,
            'amount' => $amount,
            'category' => trim((string) ($data['category'] ?? 'general')),
            'description' => isset($data['description']) ? trim((string) $data['description']) : null,
            'source_type' => $sourceType ? trim((string) $sourceType) : null,
            'source_id' => $sourceId ? (int) $sourceId : null,
            'event_key' => isset($data['event_key']) ? trim((string) $data['event_key']) : null,
            'created_by' => isset($data['created_by']) ? (int) $data['created_by'] : null,
            'meta' => $data['meta'] ?? null,
        ];

        if (!empty($payload['event_key'])) {
            return LedgerEntry::query()->firstOrCreate(
                ['event_key' => $payload['event_key']],
                $payload
            );
        }

        return LedgerEntry::query()->create($payload);
    }
}

