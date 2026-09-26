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
    $id = $uriParts[1] ?? null;
    $sub = $uriParts[2] ?? '';

    // Mark all notifications as read: POST/PATCH/PUT /api/notifications/read-all
    if ($id === 'read-all') {
        if ($method === 'POST' || $method === 'PATCH' || $method === 'PUT') {
            $pdo->query('UPDATE notifications SET is_read = 1 WHERE is_read = 0');
            jsonSuccess(null, 200, 'All notifications marked as read');
        }
        jsonError('Method not allowed', 405);
    }

    // Mark single notification as read: PATCH/PUT/POST /api/notifications/{id}/read or /api/notifications/{id}
    if ($id && ($sub === 'read' || $sub === '') && ($method === 'PATCH' || $method === 'PUT' || $method === 'POST')) {
        $stmt = $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE id = ?');
        $stmt->execute([$id]);
        jsonSuccess(null, 200, 'Marked as read');
    }

    if ($method === 'GET') {
        // Auto-generate low stock and out-of-stock alerts
        try {
            $lowStockStmt = $pdo->query('
                SELECT name, sku, quantity, reorder_level 
                FROM inventory_items 
                WHERE (quantity <= reorder_level AND reorder_level > 0) OR quantity <= 0
                LIMIT 10
            ');
            $lowItems = $lowStockStmt->fetchAll();

            foreach ($lowItems as $low) {
                $sku = $low['sku'];
                $checkNotif = $pdo->prepare('SELECT id FROM notifications WHERE title LIKE ? AND created_at >= DATE_SUB(NOW(), INTERVAL 12 HOUR) LIMIT 1');
                $checkNotif->execute(["%{$sku}%"]);
                if (!$checkNotif->fetch()) {
                    $isOut = ((int)$low['quantity']) <= 0;
                    $type = $isOut ? 'danger' : 'warning';
                    $title = $isOut 
                        ? "Out of Stock: {$low['name']} ({$sku})" 
                        : "Low Stock Alert: {$low['name']} ({$sku})";
                    $message = $isOut 
                        ? "Stock is currently exhausted (0 units available). Immediate reorder required." 
                        : "Stock level is currently {$low['quantity']} units (Reorder threshold: {$low['reorder_level']}).";

                    $ins = $pdo->prepare('INSERT INTO notifications (id, title, message, type, is_read) VALUES (?, ?, ?, ?, 0)');
                    $ins->execute([generateUuid(), $title, $message, $type]);
                }
            }
        } catch (Throwable $e) {
            error_log("Failed to auto-generate notifications: " . $e->getMessage());
        }

        $stmt = $pdo->query('SELECT id, title, message, type, is_read, created_at FROM notifications ORDER BY created_at DESC LIMIT 50');
        jsonSuccess($stmt->fetchAll());
    }

    jsonError('Method not allowed', 405);
}
