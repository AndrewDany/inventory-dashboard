<?php
// ============================================================
// Sales Orders & Point of Sale (POS) Routes
// ============================================================

declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

function handleSalesOrderRoutes(PDO $pdo, string $method, array $uriParts): void
{
    $auth = requireAuth();
    $id = $uriParts[2] ?? null;
    $subAction = $uriParts[3] ?? null;

    // Ship / Fulfill Sales Order endpoint: POST /api/sales-orders/{id}/ship
    if ($id && $subAction === 'ship' && $method === 'POST') {
        if ($auth['role'] === 'demo') jsonError('Demo account cannot ship orders', 403);
        $input = getJsonInput();
        $locationId = $input['location_id'] ?? null;

        $soStmt = $pdo->prepare('SELECT * FROM sales_orders WHERE id = ?');
        $soStmt->execute([$id]);
        $so = $soStmt->fetch();
        if (!$so) jsonError('Sales order not found', 404);
        if ($so['status'] === 'shipped') jsonError('Sales order is already shipped', 400);

        // Fetch items
        $itemsStmt = $pdo->prepare('SELECT * FROM sales_order_items WHERE so_id = ?');
        $itemsStmt->execute([$id]);
        $items = $itemsStmt->fetchAll();

        $pdo->beginTransaction();
        try {
            foreach ($items as $line) {
                $sku = $line['sku'];
                $qty = (int)$line['quantity_ordered'];

                // 1. Check availability BEFORE touching anything (was previously
                // silently allowed to oversell — floored at 0 with no error).
                $findItem = $pdo->prepare('SELECT id, name, quantity FROM inventory_items WHERE sku = ? LIMIT 1');
                $findItem->execute([$sku]);
                $inv = $findItem->fetch();

                if ($inv && (int)$inv['quantity'] < $qty) {
                    throw new Exception("Insufficient stock for {$sku}: need {$qty}, have {$inv['quantity']}");
                }

                if ($inv) {
                    $newQty = (int)$inv['quantity'] - $qty;
                    $upInv = $pdo->prepare('UPDATE inventory_items SET quantity = ?, last_updated = NOW() WHERE id = ?');
                    $upInv->execute([$newQty, $inv['id']]);

                    // 2. Decrement FIFO batches, tracking the actual weighted-average
                    // cost of whichever batches this shipment drew from.
                    $rem = $qty;
                    $costTotal = 0.0;
                    $costedUnits = 0;
                    $batchesStmt = $pdo->prepare('SELECT id, on_hand_quantity, unit_cost FROM inventory_batches WHERE sku = ? AND on_hand_quantity > 0 ORDER BY received_date ASC');
                    $batchesStmt->execute([$sku]);
                    $batches = $batchesStmt->fetchAll();

                    foreach ($batches as $b) {
                        if ($rem <= 0) break;
                        $take = min((int)$b['on_hand_quantity'], $rem);
                        $upB = $pdo->prepare('UPDATE inventory_batches SET on_hand_quantity = on_hand_quantity - ? WHERE id = ?');
                        $upB->execute([$take, $b['id']]);
                        $costTotal += $take * (float)$b['unit_cost'];
                        $costedUnits += $take;
                        $rem -= $take;
                    }
                    $weightedUnitCost = $costedUnits > 0 ? $costTotal / $costedUnits : null;

                    // 3. Log stock movement
                    $movStmt = $pdo->prepare('INSERT INTO stock_movements (id, item_id, item_name, change_amount, reason, location_id, user_email) VALUES (?, ?, ?, ?, ?, ?, ?)');
                    $movStmt->execute([
                        generateUuid(),
                        $inv['id'],
                        $inv['name'],
                        -$qty,
                        'sale',
                        $locationId,
                        $auth['email'] ?? 'system'
                    ]);
                } else {
                    $weightedUnitCost = null;
                }

                // 4. Update sales_order_items quantity_shipped AND the real cost consumed
                $upSoi = $pdo->prepare('UPDATE sales_order_items SET quantity_shipped = quantity_ordered, unit_cost = ? WHERE id = ?');
                $upSoi->execute([$weightedUnitCost, $line['id']]);
            }

            // Mark SO as shipped
            $upSo = $pdo->prepare('UPDATE sales_orders SET status = "shipped", updated_at = NOW() WHERE id = ?');
            $upSo->execute([$id]);

            $pdo->commit();
            jsonSuccess(['status' => 'shipped'], 200, 'Sales order shipped and inventory updated');
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonError('Shipping sales order failed: ' . $e->getMessage(), 500);
        }
    }

    // Single SO Details
    if ($id) {
        $stmt = $pdo->prepare('SELECT * FROM sales_orders WHERE id = ?');
        $stmt->execute([$id]);
        $so = $stmt->fetch();
        if (!$so) jsonError('Sales order not found', 404);

        $itemsStmt = $pdo->prepare('
            SELECT soi.*, i.name as item_name
            FROM sales_order_items soi
            LEFT JOIN inventory_items i ON i.sku = soi.sku
            WHERE soi.so_id = ?
        ');
        $itemsStmt->execute([$id]);
        $so['items'] = $itemsStmt->fetchAll();

        jsonSuccess($so);
    }

    // List SOs: GET /api/sales-orders
    if ($method === 'GET') {
        $stmt = $pdo->query('
            SELECT so.*,
                   (SELECT COUNT(*) FROM sales_order_items WHERE so_id = so.id) as item_count,
                   (SELECT SUM(quantity_ordered * unit_price) FROM sales_order_items WHERE so_id = so.id) as total_amount
            FROM sales_orders so
            ORDER BY so.created_at DESC
        ');
        $orders = $stmt->fetchAll();

        foreach ($orders as &$order) {
            $itemQuery = $pdo->prepare('
                SELECT soi.*, i.name as item_name
                FROM sales_order_items soi
                LEFT JOIN inventory_items i ON i.sku = soi.sku
                WHERE soi.so_id = ?
            ');
            $itemQuery->execute([$order['id']]);
            $order['items'] = $itemQuery->fetchAll();
        }

        jsonSuccess($orders);
    }

    // Create SO: POST /api/sales-orders
    if ($method === 'POST') {
        if ($auth['role'] === 'demo') jsonError('Demo account cannot create sales orders', 403);
        $input = getJsonInput();
        $soNumber = trim($input['so_number'] ?? ('SO-' . strtoupper(substr(uniqid(), -6))));
        $notes = $input['notes'] ?? null;
        $customerName = $input['customer_name'] ?? null;
        $items = $input['items'] ?? [];

        if (count($items) === 0) jsonError('At least one item is required', 400);

        $soId = generateUuid();

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare('INSERT INTO sales_orders (id, so_number, status, notes, customer_name, created_by) VALUES (?, ?, ?, ?, ?, ?)');
            $stmt->execute([$soId, $soNumber, 'confirmed', $notes, $customerName, $auth['email'] ?? 'system']);

            $itemStmt = $pdo->prepare('
                INSERT INTO sales_order_items (id, so_id, sku, inventory_item_id, quantity_ordered, quantity_shipped, unit_price, currency)
                VALUES (?, ?, ?, ?, ?, 0, ?, ?)
            ');

            foreach ($items as $line) {
                $findItem = $pdo->prepare('SELECT id FROM inventory_items WHERE sku = ? LIMIT 1');
                $findItem->execute([$line['sku']]);
                $invItemId = $findItem->fetchColumn() ?: null;

                $itemStmt->execute([
                    generateUuid(),
                    $soId,
                    $line['sku'],
                    $invItemId,
                    (int)($line['quantity_ordered'] ?? 1),
                    (float)($line['unit_price'] ?? 0.00),
                    $line['currency'] ?? 'GHS'
                ]);
            }

            $pdo->commit();
            jsonSuccess(['id' => $soId, 'so_number' => $soNumber], 201, 'Sales order created');
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonError('Failed to create sales order: ' . $e->getMessage(), 500);
        }
    }

    jsonError('Method not allowed', 405);
}

function handlePosCheckout(PDO $pdo, string $method): void
{
    $auth = requireAuth();
    if ($method !== 'POST') jsonError('Method not allowed', 405);
    if ($auth['role'] === 'demo') jsonError('Demo account cannot process POS sales', 403);

    $input = getJsonInput();
    $items = $input['items'] ?? []; // [{ id, sku, name, quantity, unit_price }]
    $customerName = $input['customer_name'] ?? 'Walk-in Customer';
    $paymentMethod = $input['payment_method'] ?? 'cash';
    $notes = $input['notes'] ?? 'POS Sale';

    if (count($items) === 0) jsonError('Cart is empty', 400);

    $soNumber = 'POS-' . strtoupper(substr(uniqid(), -6));
    $soId = generateUuid();

    $pdo->beginTransaction();
    try {
        // 1. Create completed sales order
        $stmt = $pdo->prepare('INSERT INTO sales_orders (id, so_number, status, notes, customer_name, created_by) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([$soId, $soNumber, 'shipped', "POS ($paymentMethod): $notes", $customerName, $auth['email'] ?? 'system']);

        $totalSale = 0.0;

        foreach ($items as $line) {
            $itemId = $line['id'] ?? null;
            $sku = $line['sku'];
            $qty = (int)($line['quantity'] ?? 1);
            $price = (float)($line['unit_price'] ?? 0.00);
            $totalSale += ($qty * $price);

            // Check availability before selling (POS previously allowed oversell too)
            if ($itemId) {
                $checkStmt = $pdo->prepare('SELECT quantity FROM inventory_items WHERE id = ?');
                $checkStmt->execute([$itemId]);
                $curQty = (int)$checkStmt->fetchColumn();
                if ($curQty < $qty) {
                    throw new Exception("Insufficient stock for {$sku}: need {$qty}, have {$curQty}");
                }
            }

            // Decrement FIFO batches, tracking real weighted-average cost
            $rem = $qty;
            $costTotal = 0.0;
            $costedUnits = 0;
            $batchesStmt = $pdo->prepare('SELECT id, on_hand_quantity, unit_cost FROM inventory_batches WHERE sku = ? AND on_hand_quantity > 0 ORDER BY received_date ASC');
            $batchesStmt->execute([$sku]);
            $batches = $batchesStmt->fetchAll();

            foreach ($batches as $b) {
                if ($rem <= 0) break;
                $take = min((int)$b['on_hand_quantity'], $rem);
                $upB = $pdo->prepare('UPDATE inventory_batches SET on_hand_quantity = on_hand_quantity - ? WHERE id = ?');
                $upB->execute([$take, $b['id']]);
                $costTotal += $take * (float)$b['unit_cost'];
                $costedUnits += $take;
                $rem -= $take;
            }
            $weightedUnitCost = $costedUnits > 0 ? $costTotal / $costedUnits : null;

            // Insert sales order item WITH real cost captured
            $itemStmt = $pdo->prepare('
                INSERT INTO sales_order_items (id, so_id, sku, inventory_item_id, quantity_ordered, quantity_shipped, unit_price, unit_cost)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ');
            $itemStmt->execute([generateUuid(), $soId, $sku, $itemId, $qty, $qty, $price, $weightedUnitCost]);

            // Decrement inventory item quantity
            if ($itemId) {
                $upInv = $pdo->prepare('UPDATE inventory_items SET quantity = quantity - ?, last_updated = NOW() WHERE id = ?');
                $upInv->execute([$qty, $itemId]);
            } else {
                $upInv = $pdo->prepare('UPDATE inventory_items SET quantity = GREATEST(0, quantity - ?), last_updated = NOW() WHERE sku = ?');
                $upInv->execute([$qty, $sku]);
            }

            // Stock movement audit
            $movStmt = $pdo->prepare('INSERT INTO stock_movements (id, item_id, item_name, change_amount, reason, user_email) VALUES (?, ?, ?, ?, ?, ?)');
            $movStmt->execute([
                generateUuid(),
                $itemId,
                $line['name'] ?? $sku,
                -$qty,
                'sale',
                $auth['email'] ?? 'system'
            ]);
        }

        $pdo->commit();
        jsonSuccess([
            'so_number' => $soNumber,
            'so_id' => $soId,
            'total_amount' => $totalSale,
            'customer_name' => $customerName,
            'payment_method' => $paymentMethod,
            'created_at' => date('Y-m-d H:i:s')
        ], 200, 'Sale completed successfully');
    } catch (Exception $e) {
        $pdo->rollBack();
        jsonError('POS Checkout failed: ' . $e->getMessage(), 500);
    }
}