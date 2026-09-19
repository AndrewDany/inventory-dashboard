<?php
// ============================================================
// Purchase Orders & Receiving Flow Routes
// ============================================================

declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

function handlePurchaseOrderRoutes(PDO $pdo, string $method, array $uriParts): void
{
    $auth = requireAuth();
    $id = $uriParts[1] ?? null;
    $subAction = $uriParts[2] ?? null;

    // Receive PO endpoint: POST /api/purchase-orders/{id}/receive
    if ($id && $subAction === 'receive' && $method === 'POST') {
        if ($auth['role'] === 'demo') jsonError('Demo account cannot receive orders', 403);
        $input = getJsonInput();
        $receivedItems = $input['items'] ?? []; // [{ sku, quantity_received, unit_cost, location_id }]

        $poStmt = $pdo->prepare('SELECT * FROM purchase_orders WHERE id = ?');
        $poStmt->execute([$id]);
        $po = $poStmt->fetch();
        if (!$po) jsonError('Purchase order not found', 404);

        $pdo->beginTransaction();
        try {
            foreach ($receivedItems as $recv) {
                $sku = $recv['sku'];
                $qtyRecv = (int)($recv['quantity_received'] ?? 0);
                $unitCost = (float)($recv['unit_cost'] ?? 0.00);
                $locationId = $recv['location_id'] ?? null;

                if ($qtyRecv <= 0) continue;

                // Guard against over-receiving: cap at what's actually still
                // outstanding on this line, regardless of what the client
                // sends. Without this, a stale UI, a double-click, or a
                // repeated request silently duplicates real inventory every
                // time it's accepted.
                $lineStmt = $pdo->prepare('SELECT quantity_ordered, quantity_received FROM purchase_order_items WHERE po_id = ? AND sku = ?');
                $lineStmt->execute([$id, $sku]);
                $line = $lineStmt->fetch();
                if (!$line) {
                    throw new Exception("No purchase order line found for {$sku} on this order");
                }
                $remaining = (int)$line['quantity_ordered'] - (int)$line['quantity_received'];
                if ($remaining <= 0) {
                    throw new Exception("{$sku} has already been fully received on this order");
                }
                if ($qtyRecv > $remaining) {
                    throw new Exception("Cannot receive {$qtyRecv} of {$sku}: only {$remaining} remaining on this order");
                }

                // 1. Update purchase_order_items
                $upPoi = $pdo->prepare('UPDATE purchase_order_items SET quantity_received = quantity_received + ? WHERE po_id = ? AND sku = ?');
                $upPoi->execute([$qtyRecv, $id, $sku]);

                // 2. Find/Update inventory item
                $findItem = $pdo->prepare('SELECT id, name, quantity FROM inventory_items WHERE sku = ? LIMIT 1');
                $findItem->execute([$sku]);
                $item = $findItem->fetch();

                if ($item) {
                    $upInv = $pdo->prepare('UPDATE inventory_items SET quantity = quantity + ?, last_updated = NOW() WHERE id = ?');
                    $upInv->execute([$qtyRecv, $item['id']]);

                    // 3. Create FIFO batch
                    $batchCode = 'PO-' . $po['po_number'] . '-' . strtoupper(substr(uniqid(), -4));
                    $batchStmt = $pdo->prepare('
                        INSERT INTO inventory_batches (id, sku, inventory_item_id, batch_code, initial_quantity, on_hand_quantity, unit_cost, received_date)
                        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                    ');
                    $batchStmt->execute([
                        generateUuid(),
                        $sku,
                        $item['id'],
                        $batchCode,
                        $qtyRecv,
                        $qtyRecv,
                        $unitCost
                    ]);

                                        // 4. Log stock movement
                    $movStmt = $pdo->prepare('
                        INSERT INTO stock_movements (id, item_id, item_name, change_amount, reason, location_id, user_email)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ');
                    $movStmt->execute([
                        generateUuid(),
                        $item['id'],
                        $item['name'],
                        $qtyRecv,
                        'purchase',
                        $locationId,
                        $auth['email'] ?? 'system'
                    ]);

                    // 5. Audit event
                    $auditStmt = $pdo->prepare('
                        INSERT INTO audit_events (id, event_type, entity_type, entity_id, sku, quantity_delta, unit_cost, actor_user_email)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ');
                    $auditStmt->execute([
                        generateUuid(),
                        'po_received',
                        'purchase_order',
                        $id,
                        $sku,
                        $qtyRecv,
                        $unitCost,
                        $auth['email'] ?? 'system'
                    ]);
                }
            }

            // Check if all lines received to mark PO status
            $checkLines = $pdo->prepare('SELECT SUM(quantity_ordered) as total_ord, SUM(quantity_received) as total_rec FROM purchase_order_items WHERE po_id = ?');
            $checkLines->execute([$id]);
            $totals = $checkLines->fetch();

            $newStatus = ($totals['total_rec'] >= $totals['total_ord']) ? 'received' : 'ordered';
            $upPo = $pdo->prepare('UPDATE purchase_orders SET status = ?, updated_at = NOW() WHERE id = ?');
            $upPo->execute([$newStatus, $id]);

            $pdo->commit();
            jsonSuccess(['status' => $newStatus], 200, 'Items received successfully');
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonError('Receiving PO failed: ' . $e->getMessage(), 500);
        }
    }

    // Single PO Details: GET /api/purchase-orders/{id}
    if ($id) {
        $poStmt = $pdo->prepare('
            SELECT po.*, s.name as supplier_name
            FROM purchase_orders po
            LEFT JOIN suppliers s ON s.id = po.supplier_id
            WHERE po.id = ?
        ');
        $poStmt->execute([$id]);
        $po = $poStmt->fetch();
        if (!$po) jsonError('PO not found', 404);

        $itemsStmt = $pdo->prepare('
            SELECT poi.*, i.name as item_name
            FROM purchase_order_items poi
            LEFT JOIN inventory_items i ON i.sku = poi.sku
            WHERE poi.po_id = ?
        ');
        $itemsStmt->execute([$id]);
        $po['items'] = $itemsStmt->fetchAll();

        jsonSuccess($po);
    }

    // List POs: GET /api/purchase-orders
    if ($method === 'GET') {
        $stmt = $pdo->query('
            SELECT po.*, s.name as supplier_name,
                   (SELECT COUNT(*) FROM purchase_order_items WHERE po_id = po.id) as item_count,
                   (SELECT SUM(quantity_ordered * unit_cost) FROM purchase_order_items WHERE po_id = po.id) as total_amount
            FROM purchase_orders po
            LEFT JOIN suppliers s ON s.id = po.supplier_id
            ORDER BY po.created_at DESC
        ');
        $orders = $stmt->fetchAll();

        // Attach line items
        foreach ($orders as &$order) {
            $itemQuery = $pdo->prepare('
                SELECT poi.*, i.name as item_name
                FROM purchase_order_items poi
                LEFT JOIN inventory_items i ON i.sku = poi.sku
                WHERE poi.po_id = ?
            ');
            $itemQuery->execute([$order['id']]);
            $order['items'] = $itemQuery->fetchAll();
        }

        jsonSuccess($orders);
    }

    // Create PO: POST /api/purchase-orders
    if ($method === 'POST') {
        if ($auth['role'] === 'demo') jsonError('Demo account cannot create purchase orders', 403);
        $input = getJsonInput();
        $poNumber = trim($input['po_number'] ?? ('PO-' . strtoupper(substr(uniqid(), -6))));
        $supplierId = $input['supplier_id'] ?? null;
        $notes = $input['notes'] ?? null;
        $items = $input['items'] ?? [];

        if (count($items) === 0) jsonError('At least one item is required', 400);

        $poId = generateUuid();

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare('INSERT INTO purchase_orders (id, po_number, supplier_id, status, notes, created_by) VALUES (?, ?, ?, ?, ?, ?)');
            $stmt->execute([$poId, $poNumber, $supplierId, 'ordered', $notes, $auth['email'] ?? 'system']);

            $itemStmt = $pdo->prepare('
                INSERT INTO purchase_order_items (id, po_id, sku, inventory_item_id, quantity_ordered, quantity_received, unit_cost, currency)
                VALUES (?, ?, ?, ?, ?, 0, ?, ?)
            ');

            foreach ($items as $line) {
                // Find matching item id if exists
                $findItem = $pdo->prepare('SELECT id FROM inventory_items WHERE sku = ? LIMIT 1');
                $findItem->execute([$line['sku']]);
                $invItemId = $findItem->fetchColumn() ?: null;

                $itemStmt->execute([
                    generateUuid(),
                    $poId,
                    $line['sku'],
                    $invItemId,
                    (int)($line['quantity_ordered'] ?? 1),
                    (float)($line['unit_cost'] ?? 0.00),
                    $line['currency'] ?? 'GHS'
                ]);
            }

            $pdo->commit();
            jsonSuccess(['id' => $poId, 'po_number' => $poNumber], 201, 'Purchase order created');
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonError('Failed to create PO: ' . $e->getMessage(), 500);
        }
    }

    jsonError('Method not allowed', 405);
}
