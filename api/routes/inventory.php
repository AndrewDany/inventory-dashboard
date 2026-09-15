<?php
// ============================================================
// Inventory Routes: List, Get, Create, Update, Delete, Bulk
// ============================================================

declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

function handleInventoryRoutes(PDO $pdo, string $method, array $uriParts): void
{
    $auth = requireAuth();
    $id = $uriParts[1] ?? null;

    // Bulk Import endpoint: POST /api/inventory/bulk
    if ($id === 'bulk' && $method === 'POST') {
        if ($auth['role'] === 'demo') jsonError('Demo account cannot modify inventory', 403);
        $input = getJsonInput();
        $items = $input['items'] ?? [];

        if (!is_array($items) || count($items) === 0) {
            jsonError('No items provided for import', 400);
        }

        $insertedCount = 0;
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare('
                INSERT INTO inventory_items (id, name, sku, category, unit_type, unit_of_measure, units_per_box, quantity, reorder_level, unit_price, supplier, location_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    category = VALUES(category),
                    quantity = VALUES(quantity),
                    unit_price = VALUES(unit_price),
                    supplier = VALUES(supplier),
                    location_id = VALUES(location_id),
                    last_updated = NOW()
            ');

            foreach ($items as $item) {
                $itemId = generateUuid();
                $stmt->execute([
                    $itemId,
                    $item['name'] ?? 'Unnamed Product',
                    $item['sku'] ?? ('SKU-' . strtoupper(substr(uniqid(), -6))),
                    $item['category'] ?? null,
                    $item['unit_type'] ?? 'unit',
                    $item['unit_of_measure'] ?? null,
                    isset($item['units_per_box']) ? (int)$item['units_per_box'] : null,
                    (int)($item['quantity'] ?? 0),
                    (int)($item['reorder_level'] ?? 0),
                    isset($item['unit_price']) ? (float)$item['unit_price'] : 0.00,
                    $item['supplier'] ?? null,
                    $item['location_id'] ?? null,
                ]);
                $insertedCount++;
            }

            $pdo->commit();
            jsonSuccess(['imported' => $insertedCount], 200, "Successfully imported $insertedCount items");
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonError('Bulk import failed: ' . $e->getMessage(), 500);
        }
    }

    // Single item operations by ID
    if ($id) {
        switch ($method) {
            case 'GET':
                $stmt = $pdo->prepare('SELECT * FROM inventory_items WHERE id = ? LIMIT 1');
                $stmt->execute([$id]);
                $item = $stmt->fetch();
                if (!$item) jsonError('Item not found', 404);
                jsonSuccess($item);
                break;

            case 'PUT':
            case 'PATCH':
                if ($auth['role'] === 'demo') jsonError('Demo account cannot modify inventory', 403);
                $input = getJsonInput();
                
                // Fetch current item for logging delta
                $currentStmt = $pdo->prepare('SELECT * FROM inventory_items WHERE id = ?');
                $currentStmt->execute([$id]);
                $current = $currentStmt->fetch();
                if (!$current) jsonError('Item not found', 404);

                $stmt = $pdo->prepare('
                    UPDATE inventory_items SET
                        name = ?,
                        sku = ?,
                        category = ?,
                        unit_type = ?,
                        unit_of_measure = ?,
                        units_per_box = ?,
                        quantity = ?,
                        reorder_level = ?,
                        unit_price = ?,
                        supplier = ?,
                        location_id = ?,
                        last_updated = NOW()
                    WHERE id = ?
                ');

                $newQty = isset($input['quantity']) ? (int)$input['quantity'] : (int)$current['quantity'];

                $stmt->execute([
                    $input['name'] ?? $current['name'],
                    $input['sku'] ?? $current['sku'],
                    $input['category'] ?? $current['category'],
                    $input['unit_type'] ?? $current['unit_type'],
                    $input['unit_of_measure'] ?? $current['unit_of_measure'],
                    isset($input['units_per_box']) ? (int)$input['units_per_box'] : $current['units_per_box'],
                    $newQty,
                    isset($input['reorder_level']) ? (int)$input['reorder_level'] : (int)$current['reorder_level'],
                    isset($input['unit_price']) ? (float)$input['unit_price'] : (float)$current['unit_price'],
                    $input['supplier'] ?? $current['supplier'],
                    $input['location_id'] ?? $current['location_id'],
                    $id
                ]);

                // If quantity changed, record stock movement
                $delta = $newQty - (int)$current['quantity'];
                if ($delta !== 0) {
                    $movStmt = $pdo->prepare('INSERT INTO stock_movements (id, item_id, item_name, change_amount, reason, location_id, user_email) VALUES (?, ?, ?, ?, ?, ?, ?)');
                    $movStmt->execute([
                        generateUuid(),
                        $id,
                        $input['name'] ?? $current['name'],
                        $delta,
                        'Inventory Update / Manual Edit',
                        $input['location_id'] ?? $current['location_id'],
                        $auth['email'] ?? 'system'
                    ]);
                }

                // Return updated item
                $fetchUpdated = $pdo->prepare('SELECT * FROM inventory_items WHERE id = ?');
                $fetchUpdated->execute([$id]);
                jsonSuccess($fetchUpdated->fetch(), 200, 'Item updated successfully');
                break;

            case 'DELETE':
                if ($auth['role'] === 'demo') jsonError('Demo account cannot delete inventory', 403);
                $stmt = $pdo->prepare('DELETE FROM inventory_items WHERE id = ?');
                $stmt->execute([$id]);
                jsonSuccess(null, 200, 'Item deleted successfully');
                break;

            default:
                jsonError('Method not allowed', 405);
        }
    }

    // Collection operations: /api/inventory
    switch ($method) {
        case 'GET':
            $stmt = $pdo->query('SELECT * FROM inventory_items ORDER BY name ASC');
            $items = $stmt->fetchAll();
            jsonSuccess($items);
            break;

        case 'POST':
            if ($auth['role'] === 'demo') jsonError('Demo account cannot add inventory', 403);
            $input = getJsonInput();
            $name = trim($input['name'] ?? '');
            $sku = trim($input['sku'] ?? '');

            if (empty($name) || empty($sku)) {
                jsonError('Product name and SKU are required', 400);
            }

            // Check SKU uniqueness
            $check = $pdo->prepare('SELECT id FROM inventory_items WHERE sku = ?');
            $check->execute([$sku]);
            if ($check->fetch()) {
                jsonError("Item with SKU '$sku' already exists", 400);
            }

            $id = generateUuid();
            $quantity = (int)($input['quantity'] ?? 0);
            $reorderLevel = (int)($input['reorder_level'] ?? 0);
            $unitPrice = isset($input['unit_price']) ? (float)$input['unit_price'] : 0.00;

            $stmt = $pdo->prepare('
                INSERT INTO inventory_items (id, name, sku, category, unit_type, unit_of_measure, units_per_box, quantity, reorder_level, unit_price, supplier, location_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ');

            $stmt->execute([
                $id,
                $name,
                $sku,
                $input['category'] ?? null,
                $input['unit_type'] ?? 'unit',
                $input['unit_of_measure'] ?? null,
                isset($input['units_per_box']) ? (int)$input['units_per_box'] : null,
                $quantity,
                $reorderLevel,
                $unitPrice,
                $input['supplier'] ?? null,
                $input['location_id'] ?? null,
            ]);

            // If initial quantity > 0, log stock movement & create initial batch
            if ($quantity > 0) {
                $movStmt = $pdo->prepare('INSERT INTO stock_movements (id, item_id, item_name, change_amount, reason, location_id, user_email) VALUES (?, ?, ?, ?, ?, ?, ?)');
                $movStmt->execute([
                    generateUuid(),
                    $id,
                    $name,
                    $quantity,
                    'Initial Stock Setup',
                    $input['location_id'] ?? null,
                    $auth['email'] ?? 'system'
                ]);

                $batchStmt = $pdo->prepare('INSERT INTO inventory_batches (id, sku, inventory_item_id, batch_code, initial_quantity, on_hand_quantity, unit_cost) VALUES (?, ?, ?, ?, ?, ?, ?)');
                $batchStmt->execute([
                    generateUuid(),
                    $sku,
                    $id,
                    'INIT-' . strtoupper(substr(uniqid(), -6)),
                    $quantity,
                    $quantity,
                    $unitPrice
                ]);
            }

            $fetchNew = $pdo->prepare('SELECT * FROM inventory_items WHERE id = ?');
            $fetchNew->execute([$id]);
            jsonSuccess($fetchNew->fetch(), 201, 'Product created successfully');
            break;

        default:
            jsonError('Method not allowed', 405);
    }
}
