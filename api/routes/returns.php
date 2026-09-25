<?php
// ============================================================
// Returns & Replacements Routes
// ============================================================

declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

function handleReturnRoutes(PDO $pdo, string $method, array $uriParts): void
{
    $auth = requireAuth();
    $id = $uriParts[1] ?? null;
    $subAction = $uriParts[2] ?? null;

    // Process Return: POST /api/returns/{id}/process
    if ($id && $subAction === 'process' && $method === 'POST') {
        if ($auth['role'] === 'demo') jsonError('Demo account cannot process returns', 403);

        $stmt = $pdo->prepare('SELECT * FROM returns WHERE id = ?');
        $stmt->execute([$id]);
        $ret = $stmt->fetch();
        if (!$ret) jsonError('Return record not found', 404);
        if ($ret['status'] !== 'pending') jsonError('Return is already resolved or cancelled', 400);

        $pdo->beginTransaction();
        try {
            $sku = $ret['sku'];
            $qty = (int)$ret['quantity'];
            $locationId = $ret['location_id'];
            $resolution = $ret['resolution'];
            $returnUnitCost = (float)($ret['unit_cost'] ?? 0);

            // Find matching item
            $findItem = $pdo->prepare('SELECT id, name, quantity, unit_price FROM inventory_items WHERE sku = ? LIMIT 1');
            $findItem->execute([$sku]);
            $item = $findItem->fetch();

            switch ($resolution) {
                case 'restock':
                case 'refund':
                    // A refund puts money back in the customer's hands, but that's
                    // a financial fact, not a statement about the physical item.
                    // By default the item comes back into sellable stock here --
                    // same treatment as an explicit "restock" resolution. If a
                    // returned item is actually damaged/unsellable, resolve it as
                    // write_off/supplier_credit instead, not refund.
                    if ($item) {
                        $upInv = $pdo->prepare('UPDATE inventory_items SET quantity = quantity + ?, last_updated = NOW() WHERE id = ?');
                        $upInv->execute([$qty, $item['id']]);

                        // Keep inventory_batches in sync -- previously only
                        // inventory_items.quantity moved here, so a subsequent
                        // sale (which decrements batches, not inventory_items,
                        // for costing) had nothing to draw from, making the
                        // restocked units invisible to FIFO costing.
                        $costForBatch = $returnUnitCost > 0 ? $returnUnitCost : (float)($item['unit_price'] ?? 0);
                        $batchStmt = $pdo->prepare('
                            INSERT INTO inventory_batches (id, sku, inventory_item_id, batch_code, initial_quantity, on_hand_quantity, unit_cost)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        ');
                        $batchStmt->execute([
                            generateUuid(),
                            $sku,
                            $item['id'],
                            'RET-' . strtoupper(substr(uniqid(), -6)),
                            $qty,
                            $qty,
                            $costForBatch,
                        ]);

                        $mov = $pdo->prepare('INSERT INTO stock_movements (id, item_id, item_name, change_amount, reason, location_id, user_email) VALUES (?, ?, ?, ?, ?, ?, ?)');
                        $mov->execute([generateUuid(), $item['id'], $item['name'], $qty, "Return Restocked: {$ret['return_number']}", $locationId, $auth['email'] ?? 'system']);
                    }
                    break;

                case 'write_off':
                case 'supplier_credit':
                    // If returning damaged stock or sending to supplier, write down if not already adjusted
                    if ($ret['return_type'] === 'damaged_stock' || $ret['return_type'] === 'supplier_return') {
                        if ($item) {
                            $upInv = $pdo->prepare('UPDATE inventory_items SET quantity = GREATEST(0, quantity - ?), last_updated = NOW() WHERE id = ?');
                            $upInv->execute([$qty, $item['id']]);

                            // FIFO-decrement batches too, same reasoning as above --
                            // a write-off previously only moved inventory_items,
                            // leaving the batch ledger overstated indefinitely.
                            $rem = $qty;
                            $batchesStmt = $pdo->prepare('SELECT id, on_hand_quantity FROM inventory_batches WHERE sku = ? AND on_hand_quantity > 0 ORDER BY received_date ASC');
                            $batchesStmt->execute([$sku]);
                            $batches = $batchesStmt->fetchAll();
                            foreach ($batches as $b) {
                                if ($rem <= 0) break;
                                $take = min((int)$b['on_hand_quantity'], $rem);
                                $upB = $pdo->prepare('UPDATE inventory_batches SET on_hand_quantity = on_hand_quantity - ? WHERE id = ?');
                                $upB->execute([$take, $b['id']]);
                                $rem -= $take;
                            }

                            $mov = $pdo->prepare('INSERT INTO stock_movements (id, item_id, item_name, change_amount, reason, location_id, user_email) VALUES (?, ?, ?, ?, ?, ?, ?)');
                            $mov->execute([generateUuid(), $item['id'], $item['name'], -$qty, "Return Written Off ($resolution): {$ret['return_number']}", $locationId, $auth['email'] ?? 'system']);
                        }
                    }
                    break;

                case 'replace':
                    // Replacement is net-zero stock: restock returned unit then ship replacement unit
                    $mov = $pdo->prepare('INSERT INTO stock_movements (id, item_id, item_name, change_amount, reason, location_id, user_email) VALUES (?, ?, ?, ?, ?, ?, ?)');
                    $mov->execute([generateUuid(), $item['id'] ?? null, $item['name'] ?? $sku, 0, "Item Replaced (Net-zero stock): {$ret['return_number']}", $locationId, $auth['email'] ?? 'system']);
                    break;
            }

            // Mark Return as completed
            $upRet = $pdo->prepare('UPDATE returns SET status = "completed", resolved_at = NOW() WHERE id = ?');
            $upRet->execute([$id]);

            // Log audit event
            $audit = $pdo->prepare('INSERT INTO audit_events (id, event_type, entity_type, entity_id, sku, quantity_delta, unit_cost, actor_user_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
            $audit->execute([
                generateUuid(),
                'return_processed',
                'return',
                $id,
                $sku,
                (in_array($resolution, ['restock', 'refund'], true) ? $qty : ($resolution === 'write_off' ? -$qty : 0)),
                $ret['unit_cost'],
                $auth['email'] ?? 'system'
            ]);

            $pdo->commit();
            jsonSuccess(['status' => 'completed'], 200, 'Return processed successfully');
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonError('Failed to process return: ' . $e->getMessage(), 500);
        }
    }

    // Cancel Return: POST /api/returns/{id}/cancel
    if ($id && $subAction === 'cancel' && $method === 'POST') {
        if ($auth['role'] === 'demo') jsonError('Demo account cannot cancel returns', 403);
        $stmt = $pdo->prepare('UPDATE returns SET status = "cancelled", resolved_at = NOW() WHERE id = ? AND status = "pending"');
        $stmt->execute([$id]);
        jsonSuccess(null, 200, 'Return cancelled');
    }

    // List Returns: GET /api/returns
    if ($method === 'GET') {
        $stmt = $pdo->query('
            SELECT r.*, l.name as location_name, s.name as supplier_name, i.name as item_name
            FROM returns r
            LEFT JOIN locations l ON l.id = r.location_id
            LEFT JOIN suppliers s ON s.id = r.supplier_id
            LEFT JOIN inventory_items i ON i.sku = r.sku
            ORDER BY r.created_at DESC
        ');
        jsonSuccess($stmt->fetchAll());
    }

    // Create Return: POST /api/returns
    if ($method === 'POST') {
        if ($auth['role'] === 'demo') jsonError('Demo account cannot record returns', 403);
        $input = getJsonInput();
        $returnNumber = trim($input['return_number'] ?? ('RET-' . strtoupper(substr(uniqid(), -6))));
        $sku = trim($input['sku'] ?? '');
        $locationId = trim($input['location_id'] ?? '');
        $quantity = (int)($input['quantity'] ?? 1);
        $returnType = $input['return_type'] ?? 'customer_return';
        $reason = $input['reason'] ?? 'damaged';
        $resolution = $input['resolution'] ?? 'refund';
        $unitCost = isset($input['unit_cost']) ? (float)$input['unit_cost'] : 0.00;
        $refundAmount = isset($input['refund_amount']) ? (float)$input['refund_amount'] : 0.00;
        $customerName = $input['customer_name'] ?? null;
        $supplierId = $input['supplier_id'] ?? null;
        $notes = $input['notes'] ?? null;

        if (empty($sku) || empty($locationId) || $quantity <= 0) {
            jsonError('SKU, location, and valid quantity are required', 400);
        }

        // Find item
        $findItem = $pdo->prepare('SELECT id, unit_price FROM inventory_items WHERE sku = ? LIMIT 1');
        $findItem->execute([$sku]);
        $item = $findItem->fetch();
        $invItemId = $item['id'] ?? null;

        if ($refundAmount <= 0 && $item && $resolution === 'refund') {
            $refundAmount = (float)$item['unit_price'] * $quantity;
        }

        $id = generateUuid();
        $stmt = $pdo->prepare('
            INSERT INTO returns (id, return_number, return_type, inventory_item_id, sku, location_id, quantity, unit_cost, refund_amount, refund_amount_estimated, reason, resolution, status, supplier_id, customer_name, notes, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "pending", ?, ?, ?, ?)
        ');

        $stmt->execute([
            $id,
            $returnNumber,
            $returnType,
            $invItemId,
            $sku,
            $locationId,
            $quantity,
            $unitCost,
            $refundAmount,
            (int)($input['refund_amount_estimated'] ?? 0),
            $reason,
            $resolution,
            $supplierId,
            $customerName,
            $notes,
            $auth['email'] ?? 'system'
        ]);

        $fetch = $pdo->prepare('SELECT * FROM returns WHERE id = ?');
        $fetch->execute([$id]);
        jsonSuccess($fetch->fetch(), 201, 'Return recorded');
    }

    jsonError('Method not allowed', 405);
}