<?php

namespace App\Support;

use App\Models\Supplier;
use Illuminate\Support\Facades\Http;

class SupplierPartSearch
{
    /**
     * @return array<int, array{
     *   supplier_id:int,
     *   supplier_name:string,
     *   part_name:string,
     *   price:int,
     *   stock:string,
     *   url:string
     * }>
     */
    public function probeSupplier(Supplier $supplier, string $query, int $limit = 5): array
    {
        $q = trim($query);
        if ($q === '') {
            return [];
        }

        return $this->searchSupplier($supplier, $q, $limit);
    }

    /**
     * @return array<int, array{
     *   supplier_id:int,
     *   supplier_name:string,
     *   part_name:string,
     *   price:int,
     *   stock:string,
     *   url:string
     * }>
     */
    public function search(string $query, int $limitPerSupplier = 5): array
    {
        $q = trim($query);
        if ($q === '') {
            return [];
        }

        $suppliers = Supplier::query()
            ->where('active', true)
            ->where('search_enabled', true)
            ->whereNotNull('search_endpoint')
            ->orderBy('search_priority')
            ->orderBy('name')
            ->get();

        $results = [];
        foreach ($suppliers as $supplier) {
            try {
                $supplierResults = $this->searchSupplier($supplier, $q, $limitPerSupplier);
                foreach ($supplierResults as $row) {
                    $row['relevance_score'] = $this->relevanceScore($q, (string) ($row['part_name'] ?? ''));
                    $results[] = $row;
                }
            } catch (\Throwable) {
                continue;
            }
        }

        usort($results, static function (array $a, array $b): int {
            $scoreDiff = ((int) ($b['relevance_score'] ?? 0)) <=> ((int) ($a['relevance_score'] ?? 0));
            if ($scoreDiff !== 0) {
                return $scoreDiff;
            }

            return ((int) ($a['price'] ?? 0)) <=> ((int) ($b['price'] ?? 0));
        });

        return $results;
    }

    /**
     * @return array<int, array{
     *   supplier_id:int,
     *   supplier_name:string,
     *   part_name:string,
     *   price:int,
     *   stock:string,
     *   url:string
     * }>
     */
    private function searchSupplier(Supplier $supplier, string $query, int $limit): array
    {
        $mode = trim((string) ($supplier->search_mode ?? 'json'));
        $config = is_array($supplier->search_config) ? $supplier->search_config : [];
        $seen = [];

        foreach ($this->queryVariants($query) as $variant) {
            $url = str_replace('{query}', urlencode($variant), (string) $supplier->search_endpoint);

            $response = Http::timeout(8)
                ->retry(1, 150)
                ->acceptJson()
                ->get($url);

            if (!$response->ok()) {
                continue;
            }

            $rows = $mode === 'html'
                ? $this->parseHtml($supplier, (string) $response->body(), $url, $config, $limit)
                : $this->parseJson($supplier, $response->json(), $config, $limit);

            if (count($rows) === 0) {
                continue;
            }

            $unique = [];
            foreach ($rows as $row) {
                $key = mb_strtolower(trim((string) ($row['url'] ?? ''))) . '|' .
                    mb_strtolower(trim((string) ($row['part_name'] ?? ''))) . '|' .
                    (string) ((int) ($row['price'] ?? 0));
                if (isset($seen[$key])) {
                    continue;
                }
                $seen[$key] = true;
                $unique[] = $row;
                if (count($unique) >= $limit) {
                    break;
                }
            }

            if (count($unique) > 0) {
                return $unique;
            }
        }

        return [];
    }

    /**
     * @param mixed $payload
     * @param array<string,mixed> $config
     * @return array<int, array{
     *   supplier_id:int,
     *   supplier_name:string,
     *   part_name:string,
     *   price:int,
     *   stock:string,
     *   url:string
     * }>
     */
    private function parseJson(Supplier $supplier, mixed $payload, array $config, int $limit): array
    {
        $itemsPath = (string) ($config['items_path'] ?? '');
        $items = $this->extractByPath($payload, $itemsPath);
        if (!is_array($items)) {
            $items = is_array($payload) ? $payload : [];
        }

        $fieldName = (string) ($config['name_field'] ?? 'name');
        $fieldPrice = (string) ($config['price_field'] ?? 'price');
        $fieldStock = (string) ($config['stock_field'] ?? 'stock');
        $fieldUrl = (string) ($config['url_field'] ?? 'url');

        $out = [];
        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }

            $price = $this->normalizePrice((string) ($item[$fieldPrice] ?? ''));
            if ($price <= 0) {
                continue;
            }

            $name = trim((string) ($item[$fieldName] ?? ''));
            $link = trim((string) ($item[$fieldUrl] ?? ''));
            $stock = trim((string) ($item[$fieldStock] ?? ''));

            $out[] = [
                'supplier_id' => (int) $supplier->id,
                'supplier_name' => (string) $supplier->name,
                'part_name' => $name !== '' ? $name : 'Repuesto',
                'price' => $price,
                'stock' => $stock !== '' ? $stock : '-',
                'url' => $link,
            ];

            if (count($out) >= $limit) {
                break;
            }
        }

        return $out;
    }

    /**
     * @param array<string,mixed> $config
     * @return array<int, array{
     *   supplier_id:int,
     *   supplier_name:string,
     *   part_name:string,
     *   price:int,
     *   stock:string,
     *   url:string
     * }>
     */
    private function parseHtml(Supplier $supplier, string $html, string $url, array $config, int $limit): array
    {
        $itemsRegex = (string) ($config['item_regex'] ?? '');
        if ($itemsRegex !== '') {
            return $this->parseHtmlByConfiguredRegex($supplier, $html, $url, $config, $limit);
        }

        return $this->parseHtmlByLinks($supplier, $html, $url, $config, $limit);
    }

    /**
     * @param array<string,mixed> $config
     * @return array<int, array{
     *   supplier_id:int,
     *   supplier_name:string,
     *   part_name:string,
     *   price:int,
     *   stock:string,
     *   url:string
     * }>
     */
    private function parseHtmlByConfiguredRegex(Supplier $supplier, string $html, string $requestUrl, array $config, int $limit): array
    {
        $itemRegex = (string) ($config['item_regex'] ?? '');
        $nameRegex = (string) ($config['name_regex'] ?? '');
        $priceRegex = (string) ($config['price_regex'] ?? '');
        $urlRegex = (string) ($config['url_regex'] ?? '');
        $stockRegex = (string) ($config['stock_regex'] ?? '');

        if ($itemRegex === '' || @preg_match_all($itemRegex, $html, $matches) === false) {
            return [];
        }

        $blocks = $matches[0] ?? [];
        if (!is_array($blocks)) {
            return [];
        }

        $out = [];
        foreach ($blocks as $block) {
            if (!is_string($block) || trim($block) === '') {
                continue;
            }

            $name = $this->extractByRegex($block, $nameRegex) ?? 'Repuesto';
            $rawPrice = $this->extractByRegex($block, $priceRegex) ?? '';
            $price = $this->normalizePrice($rawPrice);
            if ($price <= 0) {
                continue;
            }

            $rawUrl = $this->extractByRegex($block, $urlRegex) ?? '';
            $resolvedUrl = $this->resolveRelativeUrl($requestUrl, $rawUrl);

            $stock = $this->extractByRegex($block, $stockRegex) ?? '-';
            if ($stock === '') {
                $stock = $this->detectStockHint($block);
            }

            $out[] = [
                'supplier_id' => (int) $supplier->id,
                'supplier_name' => (string) $supplier->name,
                'part_name' => trim($name) !== '' ? trim($name) : 'Repuesto',
                'price' => $price,
                'stock' => $stock !== '' ? $stock : '-',
                'url' => $resolvedUrl,
            ];

            if (count($out) >= $limit) {
                break;
            }
        }

        return $out;
    }

    /**
     * @param array<string,mixed> $config
     * @return array<int, array{
     *   supplier_id:int,
     *   supplier_name:string,
     *   part_name:string,
     *   price:int,
     *   stock:string,
     *   url:string
     * }>
     */
    private function parseHtmlByLinks(Supplier $supplier, string $html, string $requestUrl, array $config, int $limit): array
    {
        $candidatePaths = $config['candidate_paths'] ?? ['/producto/', '/product/', '/shop/'];
        if (!is_array($candidatePaths) || count($candidatePaths) === 0) {
            $candidatePaths = ['/producto/', '/product/', '/shop/'];
        }

        $excludePaths = $config['exclude_paths'] ?? [
            '/categoria-producto/',
            '/shop/category/',
            '/cart',
            '/carrito',
            '/mi-cuenta',
            '/my-account',
            'add-to-cart=',
            '#',
        ];
        if (!is_array($excludePaths)) {
            $excludePaths = [];
        }
        $candidateUrlRegex = trim((string) ($config['candidate_url_regex'] ?? ''));

        $out = [];
        $seenUrls = [];
        $maxContext = (int) ($config['context_window'] ?? 6000);
        if ($maxContext < 800) {
            $maxContext = 6000;
        }

        if (@preg_match_all('/href=["\']([^"\']+)["\']/i', $html, $hrefMatches, PREG_OFFSET_CAPTURE) !== false) {
            foreach (($hrefMatches[1] ?? []) as $match) {
                if (!is_array($match) || count($match) < 2) {
                    continue;
                }

                $rawHref = (string) $match[0];
                $offset = (int) $match[1];
                $resolvedUrl = $this->resolveRelativeUrl($requestUrl, $rawHref);
                if ($resolvedUrl === '') {
                    continue;
                }

                $urlLower = mb_strtolower($resolvedUrl);
                $isCandidate = false;
                foreach ($candidatePaths as $path) {
                    $pathLower = mb_strtolower(trim((string) $path));
                    if ($pathLower !== '' && str_contains($urlLower, $pathLower)) {
                        $isCandidate = true;
                        break;
                    }
                }
                if (!$isCandidate) {
                    continue;
                }
                if ($candidateUrlRegex !== '' && @preg_match($candidateUrlRegex, $resolvedUrl) !== 1) {
                    continue;
                }

                $skip = false;
                foreach ($excludePaths as $path) {
                    $pathLower = mb_strtolower(trim((string) $path));
                    if ($pathLower !== '' && str_contains($urlLower, $pathLower)) {
                        $skip = true;
                        break;
                    }
                }
                if ($skip || isset($seenUrls[$resolvedUrl])) {
                    continue;
                }

                $seenUrls[$resolvedUrl] = true;
                $contextStart = max(0, $offset - (int) floor($maxContext / 3));
                $context = substr($html, $contextStart, $maxContext);
                if (!is_string($context) || $context === '') {
                    continue;
                }

                $focus = $this->focusContextAroundLink($context, $rawHref, $resolvedUrl);
                $name = $this->extractNameFromContext($focus, $resolvedUrl);
                $price = $this->extractPriceFromContext($focus);
                if ($price <= 0) {
                    continue;
                }

                $stock = $this->detectStockHint($focus);

                $out[] = [
                    'supplier_id' => (int) $supplier->id,
                    'supplier_name' => (string) $supplier->name,
                    'part_name' => $name !== '' ? $name : 'Repuesto',
                    'price' => $price,
                    'stock' => $stock,
                    'url' => $resolvedUrl,
                ];

                if (count($out) >= $limit) {
                    break;
                }
            }
        }

        return $out;
    }

    private function extractByRegex(string $subject, string $regex): ?string
    {
        if ($regex === '') {
            return null;
        }

        if (@preg_match($regex, $subject, $matches) !== 1) {
            return null;
        }

        $value = (string) ($matches[1] ?? $matches[0] ?? '');
        $value = html_entity_decode($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $value = trim(strip_tags($value));

        return $value !== '' ? $value : null;
    }

    private function extractNameFromContext(string $context, string $resolvedUrl): string
    {
        $targets = [$resolvedUrl];
        $path = (string) (parse_url($resolvedUrl, PHP_URL_PATH) ?? '');
        if ($path !== '') {
            $targets[] = $path;
        }

        $patterns = [];
        foreach ($targets as $target) {
            $quoted = preg_quote($target, '/');
            $patterns[] = '/<h[1-6][^>]*>\s*<a[^>]*href=["\']' . $quoted . '["\'][^>]*>(.*?)<\/a>\s*<\/h[1-6]>/is';
            $patterns[] = '/<a[^>]*href=["\']' . $quoted . '["\'][^>]*>\s*<img[^>]*alt=["\']([^"\']+)["\']/is';
            $patterns[] = '/<a[^>]*href=["\']' . $quoted . '["\'][^>]*>([^<]{4,180})<\/a>/is';
        }
        $patterns[] = '/aria-label=["\']([^"\']{4,180})["\']/i';

        foreach ($patterns as $pattern) {
            if (@preg_match($pattern, $context, $matches) === 1) {
                $name = html_entity_decode((string) ($matches[1] ?? ''), ENT_QUOTES | ENT_HTML5, 'UTF-8');
                $name = trim(strip_tags($name));
                if ($name !== '') {
                    return $name;
                }
            }
        }

        return '';
    }

    private function extractPriceFromContext(string $context): int
    {
        $plain = html_entity_decode(strip_tags($context), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        if (is_string($plain) && $plain !== '') {
            if (@preg_match('/(?:\$|ARS)\s*([0-9\.\,]+)/i', $plain, $m) === 1) {
                $price = $this->normalizePrice((string) ($m[1] ?? ''));
                if ($price > 0) {
                    return $price;
                }
            }
        }

        $patterns = [
            '/woocommerce-Price-amount[^>]*>[\s\S]*?(?:\$|&#36;|ARS)[^0-9]{0,120}([0-9\.\,]+)/i',
            '/class=["\']price["\'][^>]*>[\s\S]*?(?:\$|&#36;|ARS)[^0-9]{0,120}([0-9\.\,]+)/i',
            '/(?:\$|&#36;|ARS)[^0-9]{0,120}([0-9\.\,]+)/i',
        ];

        foreach ($patterns as $pattern) {
            if (@preg_match($pattern, $context, $matches) === 1) {
                $price = $this->normalizePrice((string) ($matches[1] ?? ''));
                if ($price > 0) {
                    return $price;
                }
            }
        }

        return 0;
    }

    private function detectStockHint(string $context): string
    {
        $low = mb_strtolower($context);
        if (str_contains($low, 'sin stock') || str_contains($low, 'agotado') || str_contains($low, 'out of stock')) {
            return 'Sin stock';
        }
        if (str_contains($low, 'instock') || str_contains($low, 'en stock') || str_contains($low, 'hay stock')) {
            return 'En stock';
        }

        return '-';
    }

    private function resolveRelativeUrl(string $requestUrl, string $rawHref): string
    {
        $href = trim(html_entity_decode($rawHref, ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        if ($href === '' || str_starts_with($href, 'javascript:') || str_starts_with($href, 'mailto:') || str_starts_with($href, 'tel:')) {
            return '';
        }

        if (str_starts_with($href, 'http://') || str_starts_with($href, 'https://')) {
            return $href;
        }

        $parts = parse_url($requestUrl);
        $scheme = (string) ($parts['scheme'] ?? 'https');
        $host = (string) ($parts['host'] ?? '');
        if ($host === '') {
            return '';
        }

        $base = $scheme . '://' . $host;
        if (str_starts_with($href, '//')) {
            return $scheme . ':' . $href;
        }
        if (str_starts_with($href, '/')) {
            return $base . $href;
        }

        return $base . '/' . ltrim($href, '/');
    }

    private function focusContextAroundLink(string $context, string $rawHref, string $resolvedUrl): string
    {
        $needles = array_values(array_filter([
            trim($rawHref),
            trim($resolvedUrl),
        ], static fn (string $v): bool => $v !== ''));

        foreach ($needles as $needle) {
            $pos = strpos($context, $needle);
            if ($pos === false) {
                continue;
            }

            $slice = substr($context, $pos, 12000);
            if (is_string($slice) && $slice !== '') {
                return $slice;
            }
        }

        return $context;
    }

    private function normalizePrice(string $value): int
    {
        $clean = preg_replace('/[^\d,\.]/', '', $value) ?? '';
        if ($clean === '') {
            return 0;
        }

        if (str_contains($clean, ',') && str_contains($clean, '.')) {
            $clean = str_replace('.', '', $clean);
            $clean = str_replace(',', '.', $clean);
        } elseif (str_contains($clean, '.')) {
            // "17.490" => 17490, "17.490.000" => 17490000
            if (preg_match('/^\d{1,3}(\.\d{3})+$/', $clean) === 1) {
                $clean = str_replace('.', '', $clean);
            }
        } elseif (str_contains($clean, ',')) {
            // "17,490" or "17,490,000" as thousands-style separators
            if (preg_match('/^\d{1,3}(,\d{3})+$/', $clean) === 1) {
                $clean = str_replace(',', '', $clean);
            } else {
                $clean = str_replace(',', '.', $clean);
            }
        }

        $number = (float) $clean;
        if ($number <= 0) {
            return 0;
        }

        return (int) round($number);
    }

    private function relevanceScore(string $query, string $partName): int
    {
        $q = $this->normalizeForSearch($query);
        $name = $this->normalizeForSearch($partName);
        if ($q === '' || $name === '') {
            return 0;
        }

        $score = 0;
        if ($name === $q) {
            $score += 120;
        } elseif (str_starts_with($name, $q)) {
            $score += 90;
        } elseif (str_contains($name, $q)) {
            $score += 70;
        }

        $tokens = array_values(array_filter(explode(' ', $q), static fn (string $t): bool => mb_strlen($t) >= 2));
        $matched = 0;
        foreach ($tokens as $token) {
            if (str_contains($name, $token)) {
                $matched++;
                $score += 18;
            }
        }

        if ($matched > 0 && $matched === count($tokens)) {
            $score += 35;
        }

        return $score;
    }

    private function normalizeForSearch(string $value): string
    {
        $value = mb_strtolower(trim($value));
        if ($value === '') {
            return '';
        }

        $latin = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
        if (is_string($latin) && $latin !== '') {
            $value = mb_strtolower($latin);
        }

        $value = preg_replace('/[^a-z0-9\s\-]/', ' ', $value) ?? '';
        $value = preg_replace('/\s+/', ' ', $value) ?? '';

        return trim($value);
    }

    /**
     * @return array<int,string>
     */
    private function queryVariants(string $query): array
    {
        $clean = trim($query);
        if ($clean === '') {
            return [];
        }

        $normalized = $this->normalizeForSearch($clean);
        $tokens = array_values(array_filter(explode(' ', $normalized), static fn (string $t): bool => mb_strlen($t) >= 2));

        $variants = [$clean];
        if (count($tokens) >= 2) {
            $variants[] = implode(' ', array_slice($tokens, 0, 2));
            $variants[] = implode(' ', array_slice($tokens, -2));
        }
        if (count($tokens) >= 1) {
            $variants[] = $tokens[0];
            $variants[] = $tokens[count($tokens) - 1];
        }
        if (count($tokens) >= 3) {
            $variants[] = implode(' ', [$tokens[0], $tokens[count($tokens) - 1]]);
        }

        $out = [];
        $seen = [];
        foreach ($variants as $variant) {
            $v = trim((string) $variant);
            if ($v === '') {
                continue;
            }
            $k = mb_strtolower($v);
            if (isset($seen[$k])) {
                continue;
            }
            $seen[$k] = true;
            $out[] = $v;
        }

        return $out;
    }

    /**
     * @param mixed $payload
     */
    private function extractByPath(mixed $payload, string $path): mixed
    {
        if ($path === '' || !is_array($payload)) {
            return $payload;
        }

        $segments = array_values(array_filter(explode('.', $path), static fn (string $seg): bool => $seg !== ''));
        $current = $payload;
        foreach ($segments as $segment) {
            if (!is_array($current) || !array_key_exists($segment, $current)) {
                return null;
            }
            $current = $current[$segment];
        }

        return $current;
    }
}
