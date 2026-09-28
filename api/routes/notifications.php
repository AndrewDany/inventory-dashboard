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
    $isAdmin = ($auth['role'] ?? '') === 'admin';
    $id = $uriParts[1] ?? null;
    $sub = $uriParts[2] ?? '';

    // Mark all notifications as read: POST/PATCH/PUT /api/notifications/read-all
    // Admins clear everything; staff only clear the notifications they can see.
    if ($id === 'read-all') {
        if ($method === 'POST' || $method === 'PATCH' || $method === 'PUT') {
            if ($isAdmin) {
                $pdo->query('UPDATE notifications SET is_read = 1 WHERE is_read = 0');
            } else {
                $pdo->query("UPDATE notifications SET is_read = 1 WHERE is_read = 0 AND audience = 'all'");
            }
            jsonSuccess(null, 200, 'All notifications marked as read');
        }
        jsonError('Method not allowed', 405);
    }

    // Mark single notification as read: PATCH/PUT/POST /api/notifications/{id}/read or /api/notifications/{id}
    if ($id && ($sub === 'read' || $sub === '') && ($method === 'PATCH' || $method === 'PUT' || $method === 'POST')) {
        if ($isAdmin) {
            $stmt = $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE id = ?');
        } else {
            $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND audience = 'all'");
        }
        $stmt->execute([$id]);
        jsonSuccess(null, 200, 'Marked as read');
    }

    if ($method === 'GET') {
        // Auto-generate low stock and out-of-stock alerts (visible to everyone)
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

                    $ins = $pdo->prepare("INSERT INTO notifications (id, title, message, type, audience, is_read) VALUES (?, ?, ?, ?, 'all', 0)");
                    $ins->execute([generateUuid(), $title, $message, $type]);
                }
            }
        } catch (Throwable $e) {
            error_log("Failed to auto-generate notifications: " . $e->getMessage());
        }

        // Staff only see 'all' notifications; admins see everything.
        if ($isAdmin) {
            $stmt = $pdo->query('SELECT id, title, message, type, audience, is_read, created_at FROM notifications ORDER BY created_at DESC LIMIT 50');
        } else {
            $stmt = $pdo->query("SELECT id, title, message, type, audience, is_read, created_at FROM notifications WHERE audience = 'all' ORDER BY created_at DESC LIMIT 50");
        }
        jsonSuccess($stmt->fetchAll());
    }

    jsonError('Method not allowed', 405);
}