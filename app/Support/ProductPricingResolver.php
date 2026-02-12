<?php

namespace App\Support;

use App\Models\BusinessSetting;
use App\Models\ProductPricingRule;
use Illuminate\Support\Facades\Schema;

class ProductPricingResolver
{
    /**
     * @return array{recommended_price:int, margin_percent:float, rule:?ProductPricingRule}
     */
    public function resolve(int $categoryId, ?int $productId, int $costPrice): array
    {
        $costPrice = max(0, $costPrice);
        $defaultMargin = (float) BusinessSetting::getValue('product_default_margin_percent', '35');
        if ($defaultMargin < 0) {
            $defaultMargin = 0;
        }

        if (!Schema::hasTable('product_pricing_rules')) {
            $recommended = (int) round($costPrice * (1 + ($defaultMargin / 100)));

            return [
                'recommended_price' => max(0, $recommended),
                'margin_percent' => $defaultMargin,
                'rule' => null,
            ];
        }

        $rules = ProductPricingRule::query()
            ->where('active', true)
            ->where(function ($q) use ($categoryId): void {
                $q->whereNull('category_id')->orWhere('category_id', $categoryId);
            })
            ->where(function ($q) use ($productId): void {
                if ($productId) {
                    $q->whereNull('product_id')->orWhere('product_id', $productId);
                } else {
                    $q->whereNull('product_id');
                }
            })
            ->where(function ($q) use ($costPrice): void {
                $q->whereNull('cost_min')->orWhere('cost_min', '<=', $costPrice);
            })
            ->where(function ($q) use ($costPrice): void {
                $q->whereNull('cost_max')->orWhere('cost_max', '>=', $costPrice);
            })
            ->get();

        $best = null;
        $bestScore = -1;
        $bestPriority = -999999;

        foreach ($rules as $rule) {
            $score = 0;
            if ($rule->product_id !== null) {
                $score += 8;
            }
            if ($rule->category_id !== null) {
                $score += 4;
            }
            if ($rule->cost_min !== null) {
                $score += 2;
            }
            if ($rule->cost_max !== null) {
                $score += 1;
            }

            $priority = (int) ($rule->priority ?? 0);
            if ($score > $bestScore || ($score === $bestScore && $priority > $bestPriority)) {
                $best = $rule;
                $bestScore = $score;
                $bestPriority = $priority;
            }
        }

        $marginPercent = $best ? (float) $best->margin_percent : $defaultMargin;
        $recommended = (int) round($costPrice * (1 + ($marginPercent / 100)));

        return [
            'recommended_price' => max(0, $recommended),
            'margin_percent' => $marginPercent,
            'rule' => $best,
        ];
    }
}
