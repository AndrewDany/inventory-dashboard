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

function handleReportRoutes(PDO $pdo, string $method): void
{
    $auth = requireAuth();
    if ($method !== 'GET') jsonError('Method not allowed', 405);

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
