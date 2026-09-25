<?php
// ============================================================
// System Settings & Advanced Reports Routes
// ============================================================

declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

function handleSettingsRoutes(PDO $pdo, string $method): void
{
    $auth = requireAuth();

    if ($method === 'GET') {
        $stmt = $pdo->query('SELECT `key`, `value` FROM system_settings');
        $rows = $stmt->fetchAll();
        $settings = [];
        foreach ($rows as $r) {
            $settings[$r['key']] = $r['value'];
        }
        jsonSuccess($settings);
    }

    if ($method === 'POST' || $method === 'PUT') {
        if ($auth['role'] !== 'admin') jsonError('Only administrators can modify settings', 403);
        $input = getJsonInput();

        $stmt = $pdo->prepare('INSERT INTO system_settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)');
        foreach ($input as $k => $v) {
            $stmt->execute([$k, (string)$v]);
        }
        jsonSuccess(null, 200, 'Settings saved');
    }

    jsonError('Method not allowed', 405);
}

function handleReportRoutes(PDO $pdo, string $method, array $uriParts = []): void
{
    $auth = requireAuth();
    if ($method !== 'GET') jsonError('Method not allowed', 405);

    $subAction = $uriParts[1] ?? '';

    // GET /api/reports/valuation-trends
    if ($subAction === 'valuation-trends') {
        $trends = [];
        for ($i = 11; $i >= 0; $i--) {
            $month = date('Y-m', strtotime("-$i months"));
            // Estimate month valuation from inventory and historical movements/batches
            $stmt = $pdo->query('
                SELECT
                    COALESCE(SUM(quantity), 0) as totalUnits,
                    COALESCE(SUM(quantity * unit_price), 0) as totalValue
                FROM inventory_items
            ');
            $row = $stmt->fetch();
            $trends[] = [
                'month' => $month,
                'totalValue' => (float)($row['totalValue'] ?? 0),
                'totalUnits' => (int)($row['totalUnits'] ?? 0),
            ];
        }
        jsonSuccess($trends);
    }

    // GET /api/reports/top-movers
    if ($subAction === 'top-movers') {
        $stmt = $pdo->query('
            SELECT
                soi.sku,
                COALESCE(i.name, soi.sku) as name,
                i.category,
                SUM(soi.quantity_shipped) as totalSold,
                SUM(soi.quantity_shipped * soi.unit_price) as totalRevenue
            FROM sales_order_items soi
            JOIN sales_orders so ON so.id = soi.so_id
            LEFT JOIN inventory_items i ON i.sku = soi.sku
            WHERE so.status = "shipped"
              AND so.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
            GROUP BY soi.sku, i.name, i.category
            ORDER BY totalSold DESC
            LIMIT 20
        ');
        $rows = $stmt->fetchAll();
        $movers = array_map(function ($r) {
            return [
                'sku' => (string)$r['sku'],
                'name' => (string)$r['name'],
                'category' => $r['category'] ?? null,
                'totalSold' => (int)$r['totalSold'],
                'totalRevenue' => (float)$r['totalRevenue'],
            ];
        }, $rows);
        jsonSuccess($movers);
    }

    // GET /api/reports/supplier-performance
    if ($subAction === 'supplier-performance') {
        $stmt = $pdo->query('
            SELECT
                s.name as supplierName,
                COUNT(po.id) as totalPOs,
                SUM(CASE WHEN po.status = "received" THEN 1 ELSE 0 END) as completedPOs,
                COALESCE(SUM(CASE WHEN po.status = "received" THEN (
                    SELECT COALESCE(SUM(poi.quantity_ordered * poi.unit_cost), 0)
                    FROM purchase_order_items poi
                    WHERE poi.po_id = po.id
                ) ELSE 0 END), 0) as totalSpent
            FROM suppliers s
            JOIN purchase_orders po ON po.supplier_id = s.id
            GROUP BY s.id, s.name
            HAVING totalPOs > 0
            ORDER BY totalPOs DESC
        ');
        $rows = $stmt->fetchAll();
        $performance = array_map(function ($r) {
            $total = (int)$r['totalPOs'];
            $completed = (int)$r['completedPOs'];
            return [
                'supplierName' => (string)$r['supplierName'],
                'totalPOs' => $total,
                'completedPOs' => $completed,
                'onTimeRate' => $total > 0 ? round(($completed / $total) * 100, 2) : 0,
                'totalSpent' => (float)$r['totalSpent'],
            ];
        }, $rows);
        jsonSuccess($performance);
    }

    // 1. Category performance breakdown
    $catStmt = $pdo->query('
        SELECT
            category,
            COUNT(*) as product_count,
            COALESCE(SUM(quantity), 0) as total_units,
            COALESCE(SUM(quantity * unit_price), 0) as total_valuation
        FROM inventory_items
        GROUP BY category
        ORDER BY total_valuation DESC
    ');
    $categories = $catStmt->fetchAll();

    // 2. Top selling products
    $topSellingStmt = $pdo->query('
        SELECT
            soi.sku,
            COALESCE(i.name, soi.sku) as name,
            SUM(soi.quantity_shipped) as units_sold,
            SUM(soi.quantity_shipped * soi.unit_price) as total_revenue
        FROM sales_order_items soi
        JOIN sales_orders so ON so.id = soi.so_id
        LEFT JOIN inventory_items i ON i.sku = soi.sku
        WHERE so.status = "shipped"
        GROUP BY soi.sku, i.name
        ORDER BY total_revenue DESC
        LIMIT 10
    ');
    $topSelling = $topSellingStmt->fetchAll();

    // 3. Fast-depleting low stock items
    $lowStockStmt = $pdo->query('
        SELECT id, name, sku, category, quantity, reorder_level, unit_price
        FROM inventory_items
        WHERE quantity <= reorder_level
        ORDER BY quantity ASC
        LIMIT 10
    ');
    $lowStock = $lowStockStmt->fetchAll();

    jsonSuccess([
        'categories' => $categories,
        'topSelling' => $topSelling,
        'lowStock' => $lowStock,
        'generatedAt' => date('Y-m-d H:i:s')
    ]);
}
