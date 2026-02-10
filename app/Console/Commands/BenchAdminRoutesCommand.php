<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\Process\Process;
use Throwable;

class BenchAdminRoutesCommand extends Command
{
    protected $signature = 'bench:admin-routes
        {--base-url=http://127.0.0.1:8000 : Base URL where the app is reachable}
        {--email= : Admin email used to authenticate (required without --fixture)}
        {--password= : Admin password used to authenticate (required without --fixture)}
        {--warm=18 : Warm iterations per route (cold is always 1)}
        {--output=storage/app/benchmarks/admin-routes-latest.json : Output JSON path}
        {--compare= : Optional JSON file to compare against}
        {--routes= : Comma-separated route list (defaults to standard admin pages)}
        {--fixture : Create temporary benchmark fixture data and admin user automatically}
        {--fixture-size=1800 : Number of benchmark orders and repairs to generate when using --fixture}
        {--keep-fixture : Keep fixture data instead of cleaning it at the end}
        {--serve : Start a temporary `php artisan serve` process}
        {--host=127.0.0.1 : Host for temporary server when using --serve}
        {--port=8000 : Port for temporary server when using --serve}
        {--clear-cache : Clear application cache before running benchmark}
        {--no-store : Do not write output JSON file}';

    protected $description = 'Benchmark authenticated admin pages and optionally compare with a previous run.';

    private const DEFAULT_ROUTES = [
        '/admin/pedidos',
        '/admin/pedidos?status=pendiente',
        '/admin/pedidos?status=confirmado',
        '/admin/pedidos?wa=pending',
        '/admin/pedidos?wa=sent',
        '/admin/reparaciones',
        '/admin/reparaciones?status=received',
        '/admin/reparaciones?status=repairing',
        '/admin/reparaciones?wa=pending',
        '/admin/reparaciones?wa=sent',
    ];

    private ?Process $serverProcess = null;
    private ?array $fixtureMeta = null;

    public function handle(): int
    {
        $warm = max(5, (int) $this->option('warm'));
        $useFixture = (bool) $this->option('fixture');

        $baseUrl = rtrim((string) $this->option('base-url'), '/');
        if ((bool) $this->option('serve')) {
            $host = (string) $this->option('host');
            $port = (int) $this->option('port');
            $baseUrl = "http://{$host}:{$port}";
        }

        $outputPath = $this->resolvePath((string) $this->option('output'));
        $comparePath = $this->option('compare')
            ? $this->resolvePath((string) $this->option('compare'))
            : (is_file($outputPath) ? $outputPath : null);

        try {
            if ($useFixture) {
                $fixtureSize = max(100, (int) $this->option('fixture-size'));
                $this->fixtureMeta = $this->prepareFixture($fixtureSize);
                $this->info(sprintf(
                    'Fixture creada: %d pedidos, %d reparaciones, %d logs pedidos, %d logs reparaciones.',
                    $this->fixtureMeta['counts']['orders'],
                    $this->fixtureMeta['counts']['repairs'],
                    $this->fixtureMeta['counts']['order_logs'],
                    $this->fixtureMeta['counts']['repair_logs']
                ));
            }

            if ((bool) $this->option('clear-cache')) {
                Artisan::call('cache:clear');
                $this->info('Cache limpiada.');
            }

            if ((bool) $this->option('serve')) {
                $this->startServer();
            } else {
                $this->waitForEndpoint($baseUrl . '/login', 10);
            }

            [$email, $password] = $this->resolveCredentials($useFixture);

            $routes = $this->resolveRoutes((string) $this->option('routes'));
            $results = $this->runBenchmark($baseUrl, $email, $password, $routes, $warm);

            $payload = [
                'generated_at' => now()->toIso8601String(),
                'base_url' => $baseUrl,
                'warm_iterations' => $warm,
                'fixture' => $useFixture,
                'routes' => $routes,
                'results' => $results,
            ];

            $this->renderCurrentResults($results);

            $previousPayload = $comparePath ? $this->loadJson($comparePath) : null;
            if ($previousPayload && isset($previousPayload['results']) && is_array($previousPayload['results'])) {
                $this->line('');
                $this->info('Comparación contra: ' . $comparePath);
                $this->renderComparison($previousPayload['results'], $results);
            }

            if (!(bool) $this->option('no-store')) {
                $dir = dirname($outputPath);
                if (!is_dir($dir)) {
                    mkdir($dir, 0777, true);
                }

                file_put_contents(
                    $outputPath,
                    json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
                );
                $this->line('');
                $this->info('Resultado guardado en: ' . $outputPath);
            }

            return self::SUCCESS;
        } catch (Throwable $e) {
            $this->error('Benchmark falló: ' . $e->getMessage());
            return self::FAILURE;
        } finally {
            $this->stopServer();

            if ($this->fixtureMeta && !(bool) $this->option('keep-fixture')) {
                $this->cleanupFixture($this->fixtureMeta['email']);
                $this->info('Fixture eliminada.');
            }
        }
    }

    private function resolvePath(string $path): string
    {
        if ($path === '') {
            return base_path('storage/app/benchmarks/admin-routes-latest.json');
        }

        if (Str::startsWith($path, ['/', '\\']) || preg_match('/^[A-Za-z]:\\\\/', $path) === 1) {
            return $path;
        }

        return base_path($path);
    }

    private function resolveCredentials(bool $useFixture): array
    {
        if ($useFixture && $this->fixtureMeta) {
            return [$this->fixtureMeta['email'], $this->fixtureMeta['password']];
        }

        $email = trim((string) $this->option('email'));
        $password = (string) $this->option('password');

        if ($email === '' || $password === '') {
            throw new RuntimeException('Sin --fixture tenés que indicar --email y --password.');
        }

        return [$email, $password];
    }

    private function resolveRoutes(string $routesRaw): array
    {
        if (trim($routesRaw) === '') {
            return self::DEFAULT_ROUTES;
        }

        $routes = array_values(array_filter(array_map(
            static fn (string $r): string => '/' . ltrim(trim($r), '/'),
            explode(',', $routesRaw)
        )));

        return empty($routes) ? self::DEFAULT_ROUTES : array_values(array_unique($routes));
    }

    private function startServer(): void
    {
        $host = (string) $this->option('host');
        $port = (int) $this->option('port');

        $this->serverProcess = new Process(
            [PHP_BINARY, 'artisan', 'serve', '--host=' . $host, '--port=' . $port],
            base_path()
        );
        $this->serverProcess->start();

        $this->waitForEndpoint("http://{$host}:{$port}/login", 20);
        $this->info(sprintf('Servidor temporal iniciado en http://%s:%d', $host, $port));
    }

    private function stopServer(): void
    {
        if (!$this->serverProcess) {
            return;
        }

        if ($this->serverProcess->isRunning()) {
            $this->serverProcess->stop(2);
        }

        $this->serverProcess = null;
    }

    private function waitForEndpoint(string $url, int $timeoutSeconds): void
    {
        $start = microtime(true);
        do {
            try {
                [$status] = $this->request('GET', $url, null, null, true);
                if ($status >= 200 && $status < 500) {
                    return;
                }
            } catch (Throwable) {
                // Keep retrying until timeout.
            }

            usleep(200_000);
        } while ((microtime(true) - $start) < $timeoutSeconds);

        throw new RuntimeException('No se pudo conectar a ' . $url);
    }

    private function runBenchmark(string $baseUrl, string $email, string $password, array $routes, int $warmIterations): array
    {
        $cookieFile = storage_path('app/bench-cookie-' . Str::random(8) . '.txt');

        try {
            [$loginPageStatus, , $loginPageBody] = $this->request('GET', $baseUrl . '/login', $cookieFile, null, true);
            if ($loginPageStatus !== 200) {
                throw new RuntimeException('No se pudo abrir login (HTTP ' . $loginPageStatus . ').');
            }

            $token = $this->extractCsrfToken($loginPageBody);

            [$loginStatus] = $this->request('POST', $baseUrl . '/login', $cookieFile, [
                '_token' => $token,
                'email' => $email,
                'password' => $password,
            ], false);

            if ($loginStatus !== 302 && $loginStatus !== 200) {
                throw new RuntimeException('Login falló (HTTP ' . $loginStatus . ').');
            }

            [$adminStatus] = $this->request('GET', $baseUrl . '/admin/dashboard', $cookieFile, null, true);
            if ($adminStatus !== 200) {
                throw new RuntimeException('Credenciales admin inválidas o sin acceso (HTTP ' . $adminStatus . ').');
            }

            $results = [];
            foreach ($routes as $route) {
                [$coldStatus, $coldMs] = $this->request('GET', $baseUrl . $route, $cookieFile, null, true);

                $warmTimes = [];
                $warmNon200 = 0;

                for ($i = 0; $i < $warmIterations; $i++) {
                    [$status, $ms] = $this->request('GET', $baseUrl . $route, $cookieFile, null, true);
                    $warmTimes[] = $ms;
                    if ($status !== 200) {
                        $warmNon200++;
                    }
                }

                $results[$route] = [
                    'cold_ms' => $coldMs,
                    'cold_status' => $coldStatus,
                    'warm' => $this->computeStats($warmTimes),
                    'warm_non_200' => $warmNon200,
                ];
            }

            return $results;
        } finally {
            if (is_file($cookieFile)) {
                @unlink($cookieFile);
            }
        }
    }

    private function request(
        string $method,
        string $url,
        ?string $cookieFile,
        ?array $formData,
        bool $followRedirects
    ): array {
        $ch = curl_init($url);
        if ($ch === false) {
            throw new RuntimeException('No se pudo inicializar cURL.');
        }

        $headers = [];
        if ($formData !== null) {
            $headers[] = 'Content-Type: application/x-www-form-urlencoded';
        }

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HEADER => true,
            CURLOPT_FOLLOWLOCATION => $followRedirects,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers,
        ]);

        if ($cookieFile) {
            curl_setopt($ch, CURLOPT_COOKIEFILE, $cookieFile);
            curl_setopt($ch, CURLOPT_COOKIEJAR, $cookieFile);
        }

        if ($formData !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($formData));
        }

        $start = hrtime(true);
        $raw = curl_exec($ch);
        $ms = (hrtime(true) - $start) / 1_000_000;

        if ($raw === false) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new RuntimeException('cURL error: ' . $error);
        }

        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $body = substr($raw, $headerSize);
        curl_close($ch);

        return [$status, $ms, $body];
    }

    private function extractCsrfToken(string $html): string
    {
        if (preg_match('/name="_token"\s+value="([^"]+)"/', $html, $m) === 1) {
            return $m[1];
        }

        if (preg_match('/value="([^"]+)"\s+name="_token"/', $html, $m) === 1) {
            return $m[1];
        }

        throw new RuntimeException('No se encontró token CSRF en login.');
    }

    private function computeStats(array $values): array
    {
        sort($values);
        $n = count($values);

        if ($n === 0) {
            return ['avg' => 0.0, 'p50' => 0.0, 'p95' => 0.0, 'min' => 0.0, 'max' => 0.0];
        }

        $avg = array_sum($values) / $n;

        return [
            'avg' => $avg,
            'p50' => $values[(int) floor(0.50 * ($n - 1))],
            'p95' => $values[(int) floor(0.95 * ($n - 1))],
            'min' => $values[0],
            'max' => $values[$n - 1],
        ];
    }

    private function renderCurrentResults(array $results): void
    {
        $rows = [];

        foreach ($results as $route => $data) {
            $rows[] = [
                'route' => $route,
                'cold_ms' => number_format((float) $data['cold_ms'], 2),
                'warm_avg_ms' => number_format((float) ($data['warm']['avg'] ?? 0), 2),
                'warm_p95_ms' => number_format((float) ($data['warm']['p95'] ?? 0), 2),
                'warm_non_200' => (int) ($data['warm_non_200'] ?? 0),
            ];
        }

        $this->table(
            ['Ruta', 'Cold ms', 'Warm avg ms', 'Warm p95 ms', 'Warm !=200'],
            $rows
        );

        [$avgBefore, $p95Before] = $this->aggregateWarmStats($results);
        $this->line(sprintf('Promedio warm avg: %.2f ms | Promedio warm p95: %.2f ms', $avgBefore, $p95Before));
    }

    private function renderComparison(array $beforeResults, array $afterResults): void
    {
        $rows = [];
        $commonRoutes = array_values(array_intersect(array_keys($beforeResults), array_keys($afterResults)));

        foreach ($commonRoutes as $route) {
            $bAvg = (float) ($beforeResults[$route]['warm']['avg'] ?? 0);
            $aAvg = (float) ($afterResults[$route]['warm']['avg'] ?? 0);
            $bP95 = (float) ($beforeResults[$route]['warm']['p95'] ?? 0);
            $aP95 = (float) ($afterResults[$route]['warm']['p95'] ?? 0);

            $deltaAvg = $bAvg > 0 ? (($aAvg - $bAvg) / $bAvg) * 100 : 0;
            $deltaP95 = $bP95 > 0 ? (($aP95 - $bP95) / $bP95) * 100 : 0;

            $rows[] = [
                'route' => $route,
                'before_avg' => number_format($bAvg, 2),
                'after_avg' => number_format($aAvg, 2),
                'delta_avg' => number_format($deltaAvg, 2) . '%',
                'before_p95' => number_format($bP95, 2),
                'after_p95' => number_format($aP95, 2),
                'delta_p95' => number_format($deltaP95, 2) . '%',
            ];
        }

        $this->table(
            ['Ruta', 'Avg antes', 'Avg ahora', 'Delta avg', 'P95 antes', 'P95 ahora', 'Delta p95'],
            $rows
        );

        [$bAvgAgg, $bP95Agg] = $this->aggregateWarmStats($beforeResults);
        [$aAvgAgg, $aP95Agg] = $this->aggregateWarmStats($afterResults);

        $deltaAvgAgg = $bAvgAgg > 0 ? (($aAvgAgg - $bAvgAgg) / $bAvgAgg) * 100 : 0;
        $deltaP95Agg = $bP95Agg > 0 ? (($aP95Agg - $bP95Agg) / $bP95Agg) * 100 : 0;

        $this->line(sprintf(
            'Global avg: %.2f -> %.2f ms (%+.2f%%) | Global p95: %.2f -> %.2f ms (%+.2f%%)',
            $bAvgAgg,
            $aAvgAgg,
            $deltaAvgAgg,
            $bP95Agg,
            $aP95Agg,
            $deltaP95Agg
        ));
    }

    private function aggregateWarmStats(array $results): array
    {
        $avgValues = [];
        $p95Values = [];

        foreach ($results as $row) {
            $avgValues[] = (float) ($row['warm']['avg'] ?? 0);
            $p95Values[] = (float) ($row['warm']['p95'] ?? 0);
        }

        $avg = count($avgValues) ? array_sum($avgValues) / count($avgValues) : 0.0;
        $p95 = count($p95Values) ? array_sum($p95Values) / count($p95Values) : 0.0;

        return [$avg, $p95];
    }

    private function loadJson(string $path): ?array
    {
        if (!is_file($path)) {
            return null;
        }

        $decoded = json_decode((string) file_get_contents($path), true);
        return is_array($decoded) ? $decoded : null;
    }

    private function prepareFixture(int $size): array
    {
        $this->cleanupFixture();

        $email = 'bench_admin_' . now()->format('YmdHis') . '_' . Str::lower(Str::random(4)) . '@example.com';
        $password = 'Bench12345!';

        $admin = User::create([
            'name' => 'Bench',
            'last_name' => 'Admin',
            'phone' => '1112345678',
            'email' => $email,
            'password' => Hash::make($password),
            'role' => 'admin',
        ]);

        $now = now();
        $orderStatuses = ['pendiente', 'confirmado', 'preparando', 'listo_retirar', 'entregado', 'cancelado'];
        $paymentMethods = ['local', 'mercado_pago', 'transferencia'];
        $repairStatuses = ['received', 'diagnosing', 'waiting_approval', 'repairing', 'ready_pickup', 'delivered', 'cancelled'];

        $orders = [];
        $repairs = [];

        for ($i = 1; $i <= $size; $i++) {
            $created = $now->copy()->subDays($i % 60)->subMinutes($i % 1200);

            $orders[] = [
                'user_id' => $admin->id,
                'status' => $orderStatuses[$i % count($orderStatuses)],
                'payment_method' => $paymentMethods[$i % count($paymentMethods)],
                'total' => 1000 + ($i * 5),
                'pickup_name' => 'BENCH_ORDER_' . $i,
                'pickup_phone' => ($i % 6 === 0) ? '' : ('11' . str_pad((string) $i, 8, '0', STR_PAD_LEFT)),
                'notes' => 'bench dataset',
                'created_at' => $created,
                'updated_at' => $created,
            ];

            $repairs[] = [
                'code' => 'BENCH-R-' . str_pad((string) $i, 6, '0', STR_PAD_LEFT),
                'user_id' => $admin->id,
                'customer_name' => 'BENCH_REPAIR_' . $i,
                'customer_phone' => ($i % 7 === 0) ? '' : ('11' . str_pad((string) (900000 + $i), 8, '0', STR_PAD_LEFT)),
                'device_brand' => 'BenchBrand',
                'device_model' => 'BenchModel',
                'issue_reported' => 'Falla benchmark',
                'parts_cost' => 1000,
                'labor_cost' => 2000,
                'final_price' => 3500,
                'status' => $repairStatuses[$i % count($repairStatuses)],
                'warranty_days' => 30,
                'received_at' => $created,
                'notes' => 'bench dataset',
                'created_at' => $created,
                'updated_at' => $created,
            ];
        }

        foreach (array_chunk($orders, 300) as $chunk) {
            DB::table('orders')->insert($chunk);
        }

        foreach (array_chunk($repairs, 300) as $chunk) {
            DB::table('repairs')->insert($chunk);
        }

        $benchOrders = DB::table('orders')
            ->select('id', 'status', 'pickup_phone')
            ->where('pickup_name', 'like', 'BENCH_ORDER_%')
            ->get();

        $benchRepairs = DB::table('repairs')
            ->select('id', 'status', 'customer_phone')
            ->where('code', 'like', 'BENCH-R-%')
            ->get();

        $orderLogs = [];
        $repairLogs = [];

        foreach ($benchOrders as $order) {
            if ($order->pickup_phone !== '' && ((int) $order->id % 3 === 0)) {
                $orderLogs[] = [
                    'order_id' => $order->id,
                    'notified_status' => $order->status,
                    'phone' => '549' . $order->pickup_phone,
                    'message' => 'BENCH WA',
                    'sent_by' => $admin->id,
                    'sent_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        foreach ($benchRepairs as $repair) {
            if ($repair->customer_phone !== '' && ((int) $repair->id % 4 === 0)) {
                $repairLogs[] = [
                    'repair_id' => $repair->id,
                    'notified_status' => $repair->status,
                    'phone' => '549' . $repair->customer_phone,
                    'message' => 'BENCH WA',
                    'sent_by' => $admin->id,
                    'sent_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        foreach (array_chunk($orderLogs, 300) as $chunk) {
            DB::table('order_whatsapp_logs')->insert($chunk);
        }
        foreach (array_chunk($repairLogs, 300) as $chunk) {
            DB::table('repair_whatsapp_logs')->insert($chunk);
        }

        return [
            'email' => $email,
            'password' => $password,
            'counts' => [
                'orders' => DB::table('orders')->where('pickup_name', 'like', 'BENCH_ORDER_%')->count(),
                'repairs' => DB::table('repairs')->where('code', 'like', 'BENCH-R-%')->count(),
                'order_logs' => DB::table('order_whatsapp_logs')->where('message', 'BENCH WA')->count(),
                'repair_logs' => DB::table('repair_whatsapp_logs')->where('message', 'BENCH WA')->count(),
            ],
        ];
    }

    private function cleanupFixture(?string $fixtureEmail = null): void
    {
        DB::table('order_whatsapp_logs')
            ->whereIn('order_id', function ($q) {
                $q->select('id')->from('orders')->where('pickup_name', 'like', 'BENCH_ORDER_%');
            })
            ->delete();

        DB::table('orders')->where('pickup_name', 'like', 'BENCH_ORDER_%')->delete();

        DB::table('repair_whatsapp_logs')
            ->whereIn('repair_id', function ($q) {
                $q->select('id')->from('repairs')->where('code', 'like', 'BENCH-R-%');
            })
            ->delete();

        DB::table('repairs')->where('code', 'like', 'BENCH-R-%')->delete();

        if ($fixtureEmail !== null) {
            DB::table('users')->where('email', $fixtureEmail)->delete();
        } else {
            DB::table('users')->where('email', 'like', 'bench_admin_%@example.com')->delete();
        }
    }
}
