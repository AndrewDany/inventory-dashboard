<?php
// ============================================================
// Stock Movements, Batches & Adjustments Routes
// ============================================================

declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

function handleMovementRoutes(PDO $pdo, string $method): void
{
    $auth = requireAuth();
    if ($method !== 'GET') jsonError('Method not allowed', 405);

    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
    $stmt = $pdo->prepare('SELECT * FROM stock_movements ORDER BY created_at DESC LIMIT ?');
    $stmt->execute([$limit]);
    jsonSuccess($stmt->fetchAll());
}

function handleBatchRoutes(PDO $pdo, string $method, array $uriParts): void
{
    $auth = requireAuth();
    $id = $uriParts[1] ?? null;

    if ($id) {
        if ($method === 'PATCH' || $method === 'PUT') {
            if ($auth['role'] === 'demo') jsonError('Demo account cannot modify batches', 403);
            $input = getJsonInput();
            $stmt = $pdo->prepare('UPDATE inventory_batches SET on_hand_quantity = ?, unit_cost = ?, expiry_date = ?, updated_at = NOW() WHERE id = ?');
            $stmt->execute([
                (int)($input['on_hand_quantity'] ?? 0),
                (float)($input['unit_cost'] ?? 0.00),
                $input['expiry_date'] ?? null,
                $id
            ]);
            $fetch = $pdo->prepare('SELECT * FROM inventory_batches WHERE id = ?');
            $fetch->execute([$id]);
            jsonSuccess($fetch->fetch());
        }
    }

    if ($method === 'GET') {
        $stmt = $pdo->query('
            SELECT b.*, i.name as item_name
            FROM inventory_batches b
            LEFT JOIN inventory_items i ON i.sku = b.sku
            ORDER BY b.received_date DESC
        ');
        jsonSuccess($stmt->fetchAll());
    }

    jsonError('Method not allowed', 405);
}

function handleAdjustmentRoutes(PDO $pdo, string $method): void
{
    $auth = requireAuth();

    if ($method === 'GET') {
        $stmt = $pdo->query('
            SELECT a.*, l.name as location_name, i.name as item_name
            FROM inventory_adjustments a
            LEFT JOIN locations l ON l.id = a.location_id
            LEFT JOIN inventory_items i ON i.sku = a.sku
            ORDER BY a.created_at DESC
        ');
        jsonSuccess($stmt->fetchAll());
    }

    if ($method === 'POST') {
        if ($auth['role'] === 'demo') jsonError('Demo account cannot record adjustments', 403);
        $input = getJsonInput();
        $sku = trim($input['sku'] ?? '');
        $locationId = trim($input['location_id'] ?? '');
        $quantityDelta = (int)($input['quantity_delta'] ?? 0);
        $reason = $input['reason'] ?? 'other';
        $notes = $input['notes'] ?? null;

        if (empty($sku) || empty($locationId) || $quantityDelta === 0) {
            jsonError('SKU, location, and non-zero quantity delta are required', 400);
        }

        // Find matching item
        $itemStmt = $pdo->prepare('SELECT id, name, quantity FROM inventory_items WHERE sku = ? LIMIT 1');
        $itemStmt->execute([$sku]);
        $item = $itemStmt->fetch();

        if (!$item) {
            jsonError("No inventory item found with SKU '$sku'", 404);
        }

        $adjId = generateUuid();
        $adjNumber = 'ADJ-' . strtoupper(substr(uniqid(), -6));

        $pdo->beginTransaction();
        try {
            // 1. Insert adjustment record
            $stmt = $pdo->prepare('
                INSERT INTO inventory_adjustments (id, adjustment_number, inventory_item_id, sku, location_id, quantity_delta, reason, notes, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ');
            $stmt->execute([
                $adjId,
                $adjNumber,
                $item['id'],
                $sku,
                $locationId,
                $quantityDelta,
                $reason,
                $notes,
                $auth['email'] ?? 'system'
            ]);

            // 2. Update inventory_items on_hand quantity
            $newQty = max(0, (int)$item['quantity'] + $quantityDelta);
            $updateItem = $pdo->prepare('UPDATE inventory_items SET quantity = ?, last_updated = NOW() WHERE id = ?');
            $updateItem->execute([$newQty, $item['id']]);

            // 3. Log stock movement
            $movStmt = $pdo->prepare('INSERT INTO stock_movements (id, item_id, item_name, change_amount, reason, location_id, user_email) VALUES (?, ?, ?, ?, ?, ?, ?)');
            $movStmt->execute([
                generateUuid(),
                $item['id'],
                $item['name'],
                $quantityDelta,
                "Adjustment ($reason)" . ($notes ? ": $notes" : ''),
                $locationId,
                $auth['email'] ?? 'system'
            ]);

            // 4. Record audit event
            $auditStmt = $pdo->prepare('INSERT INTO audit_events (id, event_type, entity_type, entity_id, sku, quantity_delta, actor_user_email) VALUES (?, ?, ?, ?, ?, ?, ?)');
            $auditStmt->execute([
                generateUuid(),
                'stock_adjustment',
                'inventory_item',
                $item['id'],
                $sku,
                $quantityDelta,
                $auth['email'] ?? 'system'
            ]);

            $pdo->commit();
            jsonSuccess(['id' => $adjId, 'adjustment_number' => $adjNumber, 'new_quantity' => $newQty], 201, 'Adjustment recorded');
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonError('Adjustment failed: ' . $e->getMessage(), 500);
        }
    }

    jsonError('Method not allowed', 405);
}
