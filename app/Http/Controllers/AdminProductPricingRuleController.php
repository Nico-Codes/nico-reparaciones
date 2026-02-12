<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\BusinessSetting;
use App\Models\Product;
use App\Models\ProductPricingRule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class AdminProductPricingRuleController extends Controller
{
    public function index()
    {
        $schemaMissing = !Schema::hasTable('product_pricing_rules');

        if ($schemaMissing) {
            $categories = Category::query()->select(['id', 'name'])->orderBy('name')->get();
            $products = Product::query()->select(['id', 'name'])->orderBy('name')->limit(200)->get();

            return view('admin.product_pricing_rules.index', [
                'rules' => collect(),
                'categories' => $categories,
                'products' => $products,
                'schemaMissing' => true,
                'defaultMarginPercent' => (string) BusinessSetting::getValue('product_default_margin_percent', '35'),
                'preventNegativeMargin' => BusinessSetting::getValue('product_prevent_negative_margin', '1') === '1',
            ]);
        }

        $rules = ProductPricingRule::query()
            ->with(['category:id,name', 'product:id,name'])
            ->orderByDesc('active')
            ->orderByDesc('priority')
            ->orderBy('id')
            ->get();

        $categories = Category::query()->select(['id', 'name'])->orderBy('name')->get();
        $products = Product::query()->select(['id', 'name'])->orderBy('name')->limit(200)->get();

        return view('admin.product_pricing_rules.index', [
            'rules' => $rules,
            'categories' => $categories,
            'products' => $products,
            'schemaMissing' => false,
            'defaultMarginPercent' => (string) BusinessSetting::getValue('product_default_margin_percent', '35'),
            'preventNegativeMargin' => BusinessSetting::getValue('product_prevent_negative_margin', '1') === '1',
        ]);
    }

    public function updateSettings(Request $request)
    {
        $data = $request->validate([
            'product_default_margin_percent' => ['required', 'numeric', 'min:0', 'max:500'],
            'product_prevent_negative_margin' => ['nullable'],
        ]);

        BusinessSetting::updateOrCreate(
            ['key' => 'product_default_margin_percent'],
            ['value' => (string) $data['product_default_margin_percent'], 'updated_by' => auth()->id()]
        );

        BusinessSetting::updateOrCreate(
            ['key' => 'product_prevent_negative_margin'],
            ['value' => $request->boolean('product_prevent_negative_margin') ? '1' : '0', 'updated_by' => auth()->id()]
        );

        return redirect()
            ->route('admin.product_pricing_rules.index')
            ->with('success', 'Preferencias de calculo de productos actualizadas.');
    }

    public function store(Request $request)
    {
        if (!Schema::hasTable('product_pricing_rules')) {
            return back()->withErrors([
                'pricing_rules' => 'Falta la tabla de reglas de productos. Ejecuta migraciones.',
            ]);
        }

        $data = $this->validateRule($request);
        ProductPricingRule::create($data);

        return redirect()
            ->route('admin.product_pricing_rules.index')
            ->with('success', 'Regla de producto creada.');
    }

    public function update(Request $request, ProductPricingRule $rule)
    {
        if (!Schema::hasTable('product_pricing_rules')) {
            return back()->withErrors([
                'pricing_rules' => 'Falta la tabla de reglas de productos. Ejecuta migraciones.',
            ]);
        }

        $data = $this->validateRule($request);
        $rule->update($data);

        return redirect()
            ->route('admin.product_pricing_rules.index')
            ->with('success', 'Regla de producto actualizada.');
    }

    public function destroy(ProductPricingRule $rule)
    {
        if (!Schema::hasTable('product_pricing_rules')) {
            return back()->withErrors([
                'pricing_rules' => 'Falta la tabla de reglas de productos. Ejecuta migraciones.',
            ]);
        }

        $rule->delete();

        return redirect()
            ->route('admin.product_pricing_rules.index')
            ->with('success', 'Regla de producto eliminada.');
    }

    private function validateRule(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'product_id' => ['nullable', 'integer', 'exists:products,id'],
            'cost_min' => ['nullable', 'integer', 'min:0'],
            'cost_max' => ['nullable', 'integer', 'min:0'],
            'margin_percent' => ['required', 'numeric', 'min:0', 'max:500'],
            'priority' => ['nullable', 'integer', 'min:-9999', 'max:9999'],
            'active' => ['nullable'],
        ]);

        $costMin = isset($data['cost_min']) ? (int) $data['cost_min'] : null;
        $costMax = isset($data['cost_max']) ? (int) $data['cost_max'] : null;
        if ($costMin !== null && $costMax !== null && $costMax < $costMin) {
            throw ValidationException::withMessages([
                'cost_max' => 'Costo maximo debe ser mayor o igual al minimo.',
            ]);
        }

        $data['active'] = (bool) ($data['active'] ?? false);
        $data['priority'] = (int) ($data['priority'] ?? 0);
        $data['cost_min'] = $costMin;
        $data['cost_max'] = $costMax;

        return $data;
    }
}
