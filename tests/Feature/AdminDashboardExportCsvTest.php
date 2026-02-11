<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Repair;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;
use ZipArchive;

class AdminDashboardExportCsvTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_export_dashboard_csv_with_kpis_and_top_products(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 2, 11, 12, 0, 0));

        try {
            $admin = User::factory()->create(['role' => 'admin']);
            $customer = User::factory()->create(['phone' => '3415557777']);

            $category = Category::create([
                'name' => 'Categoria KPI',
                'slug' => 'categoria-kpi',
                'description' => 'Categoria para export csv',
                'active' => true,
            ]);

            $product = Product::create([
                'category_id' => $category->id,
                'name' => 'Producto KPI',
                'slug' => 'producto-kpi',
                'price' => 1000,
                'stock' => 20,
                'active' => true,
                'featured' => false,
            ]);

            $createOrder = function (array $attributes, int $daysAgo): Order {
                $order = Order::create($attributes);
                $stamp = now()->copy()->subDays($daysAgo);
                $order->forceFill(['created_at' => $stamp, 'updated_at' => $stamp])->saveQuietly();

                return $order;
            };

            $rangeOrder = $createOrder([
                'user_id' => $customer->id,
                'status' => 'entregado',
                'payment_method' => 'local',
                'total' => 3000,
                'pickup_name' => 'Cliente KPI',
                'pickup_phone' => '3415557001',
            ], 5);

            OrderItem::create([
                'order_id' => $rangeOrder->id,
                'product_id' => $product->id,
                'product_name' => $product->name,
                'price' => 1000,
                'quantity' => 3,
                'subtotal' => 3000,
            ]);

            $createOrder([
                'user_id' => $customer->id,
                'status' => 'pendiente',
                'payment_method' => 'local',
                'total' => 1200,
                'pickup_name' => 'Cliente KPI 2',
                'pickup_phone' => '3415557002',
            ], 3);

            $createOrder([
                'user_id' => $customer->id,
                'status' => 'entregado',
                'payment_method' => 'local',
                'total' => 1000,
                'pickup_name' => 'Cliente KPI Prev',
                'pickup_phone' => '3415557003',
            ], 40);

            Repair::create([
                'code' => 'R-CSV-001',
                'user_id' => $customer->id,
                'customer_name' => 'Repair CSV',
                'customer_phone' => '3415558001',
                'issue_reported' => 'Pantalla',
                'status' => 'delivered',
                'received_at' => now()->copy()->subDays(5),
                'delivered_at' => now()->copy()->subDays(4),
                'created_at' => now()->copy()->subDays(5),
                'updated_at' => now()->copy()->subDays(4),
            ]);

            Repair::create([
                'code' => 'R-CSV-002',
                'user_id' => $customer->id,
                'customer_name' => 'Repair CSV Pending',
                'customer_phone' => '3415558002',
                'issue_reported' => 'Bateria',
                'status' => 'waiting_approval',
                'received_at' => now()->copy()->subDays(3),
                'created_at' => now()->copy()->subDays(3),
                'updated_at' => now()->copy()->subDays(3),
            ]);

            $response = $this->actingAs($admin)->get(route('admin.dashboard.export', ['range' => 30]));

            $response->assertOk();
            $response->assertHeader('content-type', 'text/csv; charset=UTF-8');

            $csv = $response->streamedContent();
            $csv = preg_replace('/^\xEF\xBB\xBF/', '', (string) $csv);

            $this->assertStringContainsString('seccion,metrica,valor,unidad,detalle', $csv);
            $this->assertStringContainsString('kpi,"Ticket promedio entregados",3000.00,ARS,', $csv);
            $this->assertStringContainsString('kpi,"Tasa entrega",50.00,porcentaje,"entregados/creados en rango"', $csv);
            $this->assertStringContainsString('kpi,"Presupuestos esperando aprobacion",1,cantidad,', $csv);
            $this->assertStringContainsString('top_product,1,3,unidades,', $csv);
            $this->assertStringContainsString('"Producto KPI | id='.$product->id.' | revenue=3000"', $csv);
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_non_admin_cannot_export_dashboard_csv(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $response = $this->actingAs($user)->get(route('admin.dashboard.export', ['range' => 30]));

        $response->assertForbidden();
    }

    public function test_admin_can_export_dashboard_xlsx(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 2, 11, 12, 0, 0));

        try {
            $admin = User::factory()->create(['role' => 'admin']);
            $customer = User::factory()->create(['phone' => '3415559998']);

            Order::create([
                'user_id' => $customer->id,
                'status' => 'entregado',
                'payment_method' => 'local',
                'total' => 2500,
                'pickup_name' => 'Cliente XLSX',
                'pickup_phone' => '3415557010',
            ]);

            $response = $this->actingAs($admin)->get(route('admin.dashboard.export_xlsx', ['range' => 30]));
            $response->assertOk();
            $response->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

            $binary = (string) $response->getContent();
            $this->assertStringStartsWith('PK', $binary);

            $tmp = tempnam(sys_get_temp_dir(), 'xlsx_test_');
            $this->assertNotFalse($tmp);
            file_put_contents($tmp, $binary);

            $zip = new ZipArchive;
            $openResult = $zip->open($tmp);
            $this->assertTrue($openResult === true);

            $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
            $zip->close();
            @unlink($tmp);

            $this->assertNotFalse($sheetXml);
            $this->assertStringContainsString('Ticket promedio entregados', (string) $sheetXml);
            $this->assertStringContainsString('Rango analizado', (string) $sheetXml);
        } finally {
            Carbon::setTestNow();
        }
    }
}
