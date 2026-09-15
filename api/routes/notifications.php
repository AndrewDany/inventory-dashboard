<?php
// ============================================================
// Notifications Routes
// ============================================================

declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

function handleNotificationRoutes(PDO $pdo, string $method, array $uriParts): void
{
    $auth = requireAuth();
    $id = $uriParts[2] ?? null;

    // Mark single notification as read: PATCH /api/notifications/{id}/read
    if ($id && ($uriParts[3] ?? '') === 'read' && $method === 'PATCH') {
        $stmt = $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE id = ?');
        $stmt->execute([$id]);
        jsonSuccess(null, 200, 'Marked as read');
    }

    // Mark all as read: POST /api/notifications/read-all
    if ($id === 'read-all' && $method === 'POST') {
        $pdo->query('UPDATE notifications SET is_read = 1');
        jsonSuccess(null, 200, 'All marked as read');
    }

    if ($method === 'GET') {
        // Also auto-generate low stock notifications if any item is below reorder level
        $lowStockStmt = $pdo->query('SELECT name, sku, quantity, reorder_level FROM inventory_items WHERE quantity <= reorder_level AND reorder_level > 0 LIMIT 5');
        $lowItems = $lowStockStmt->fetchAll();

        foreach ($lowItems as $low) {
            $checkNotif = $pdo->prepare('SELECT id FROM notifications WHERE title LIKE ? AND created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)');
            $checkNotif->execute(["%{$low['sku']}%"]);
            if (!$checkNotif->fetch()) {
                $ins = $pdo->prepare('INSERT INTO notifications (id, title, message, type, is_read) VALUES (?, ?, ?, "warning", 0)');
                $ins->execute([
                    generateUuid(),
                    "Low Stock Alert: {$low['name']} ({$low['sku']})",
                    "Stock level is currently {$low['quantity']} units (Reorder point: {$low['reorder_level']})."
                ]);
            }
        }

        $stmt = $pdo->query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 30');
        jsonSuccess($stmt->fetchAll());
    }

    jsonError('Method not allowed', 405);
}
