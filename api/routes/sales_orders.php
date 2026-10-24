<?php
// ============================================================
// Sales Orders & Point of Sale (POS) Routes
// ============================================================

declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../config/notify.php';

function handleSalesOrderRoutes(PDO $pdo, string $method, array $uriParts): void
{
    $auth = requireAuth();
    $id = $uriParts[1] ?? null;
    $subAction = $uriParts[2] ?? null;

    // Record a payment against a pre-order: POST /api/sales-orders/{id}/payment
    if ($id && $subAction === 'payment' && $method === 'POST') {
        if ($auth['role'] === 'demo') jsonError('Demo account cannot record payments', 403);
        $input = getJsonInput();
        $amount = (float)($input['amount'] ?? 0);
        if (round($amount, 2) < 0.01) jsonError('Payment amount must be at least GHC 0.01', 400);

        $pdo->beginTransaction();
        $soStmt = $pdo->prepare('SELECT id, amount_paid FROM sales_orders WHERE id = ? FOR UPDATE');
        $soStmt->execute([$id]);
        $so = $soStmt->fetch();
        if (!$so) {
            $pdo->rollBack();
            jsonError('Sales order not found', 404);
        }

        $totalStmt = $pdo->prepare('SELECT COALESCE(SUM(quantity_ordered * unit_price), 0) FROM sales_order_items WHERE so_id = ?');
        $totalStmt->execute([$id]);
        $total = (float)$totalStmt->fetchColumn();
        $balance = round($total - (float)$so['amount_paid'], 2);
        if (round($amount, 2) > $balance) {
            $pdo->rollBack();
            jsonError("Payment exceeds the outstanding balance of GHC {$balance}", 400);
        }

        $paymentMethod = trim((string)($input['payment_method'] ?? 'Cash')) ?: 'Cash';
        if (!in_array($paymentMethod, ['Cash', 'Mobile Money', 'Bank Transfer'], true)) {
            $pdo->rollBack();
            jsonError('Invalid payment method', 400);
        }
        try {
            $upStmt = $pdo->prepare('UPDATE sales_orders SET amount_paid = amount_paid + ? WHERE id = ?');
            $upStmt->execute([round($amount, 2), $id]);
            $paymentStmt = $pdo->prepare('INSERT INTO sales_order_payments (id, so_id, amount, payment_method, received_by) VALUES (?, ?, ?, ?, ?)');
            $paymentStmt->execute([generateUuid(), $id, round($amount, 2), $paymentMethod, $auth['email'] ?? 'system']);
            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
        jsonSuccess(['amount_paid' => round((float)$so['amount_paid'] + $amount, 2)], 200, 'Payment recorded');
    }

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

        // Pre-orders must be fully paid before fulfillment -- this was previously
        // only enforced by disabling the button in the browser, which anyone
        // calling the API directly (or a future bug in the UI) could bypass.
        if ((int)($so['is_preorder'] ?? 0) === 1) {
            $totalStmt = $pdo->prepare('SELECT COALESCE(SUM(quantity_ordered * unit_price), 0) FROM sales_order_items WHERE so_id = ?');
            $totalStmt->execute([$id]);
            $orderTotal = (float)$totalStmt->fetchColumn();

            if ((float)$so['amount_paid'] < $orderTotal - 0.01) {
                $balance = round($orderTotal - (float)$so['amount_paid'], 2);
                jsonError("This pre-order still has a balance of GHC {$balance} outstanding. Record the remaining payment before fulfilling.", 400);
            }
        }

        // Fetch items
        $itemsStmt = $pdo->prepare('SELECT * FROM sales_order_items WHERE so_id = ?');
        $itemsStmt->execute([$id]);
        $items = $itemsStmt->fetchAll();

        $pdo->beginTransaction();
        try {
            foreach ($items as $line) {
                $sku = $line['sku'];
                $qty = (float)$line['quantity_ordered'];

                // 1. Check availability BEFORE touching anything (was previously
                // silently allowed to oversell — floored at 0 with no error).
                $findItem = $pdo->prepare('SELECT id, name, quantity FROM inventory_items WHERE sku = ? LIMIT 1');
                $findItem->execute([$sku]);
                $inv = $findItem->fetch();

                if ($inv && (float)$inv['quantity'] < $qty) {
                    throw new Exception("Insufficient stock for {$sku}: need {$qty}, have {$inv['quantity']}");
                }

                if ($inv) {
                    $newQty = (float)$inv['quantity'] - $qty;
                    $upInv = $pdo->prepare('UPDATE inventory_items SET quantity = ?, last_updated = NOW() WHERE id = ?');
                    $upInv->execute([$newQty, $inv['id']]);

                    // 2. Decrement FIFO batches, tracking the actual weighted-average
                    // cost of whichever batches this shipment drew from.
                    $rem = $qty;
                    $costTotal = 0.0;
                    $costedUnits = 0.0;
                    $batchesStmt = $pdo->prepare('SELECT id, on_hand_quantity, unit_cost FROM inventory_batches WHERE sku = ? AND on_hand_quantity > 0 ORDER BY received_date ASC');
                    $batchesStmt->execute([$sku]);
                    $batches = $batchesStmt->fetchAll();

                    foreach ($batches as $b) {
                        if ($rem <= 0) break;
                        $take = min((float)$b['on_hand_quantity'], $rem);
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

                    // Audit Trail + Activity Log: previously never logged at all
                    // for a sale/fulfillment -- Stock Movements captured it, but
                    // neither of these two pages ever showed a fulfillment happened.
                    $auditStmt = $pdo->prepare('INSERT INTO audit_events (id, event_type, entity_type, entity_id, sku, quantity_delta, unit_cost, actor_user_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
                    $auditStmt->execute([
                        generateUuid(),
                        'sale_fulfilled',
                        'sales_order_item',
                        $line['id'],
                        $sku,
                        -$qty,
                        $weightedUnitCost,
                        $auth['email'] ?? 'system'
                    ]);

                    $actStmt = $pdo->prepare('INSERT INTO activity_logs (id, user_id, user_email, action, item_name, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
                    $actStmt->execute([
                        generateUuid(),
                        $auth['sub'] ?? null,
                        $auth['email'] ?? 'system',
                        'fulfilled',
                        $inv['name'],
                        'sales_order',
                        $id,
                        json_encode(['sku' => $sku, 'quantity' => $qty, 'so_id' => $id])
                    ]);
                } else {
                    $weightedUnitCost = null;
                }

                // 4. Update sales_order_items quantity_shipped AND the real per-sale cost.
                // This column exists on the schema (see db/schema.sql) — writing to it here
                // is required for financials.php's COGS_SUBQUERY to use real per-sale cost
                // instead of falling back to its batch-lookup-by-date approximation.
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

            $paymentQuery = $pdo->prepare('SELECT id, amount, payment_method, received_by, paid_at FROM sales_order_payments WHERE so_id = ? ORDER BY paid_at DESC');
            $paymentQuery->execute([$order['id']]);
            $order['payments'] = $paymentQuery->fetchAll();
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
        $customerPhone = $input['customer_phone'] ?? null;
        $isPreorder = !empty($input['is_preorder']) ? 1 : 0;
        $fulfillmentMethod = $input['fulfillment_method'] ?? 'pickup';
        if (!in_array($fulfillmentMethod, ['pickup', 'delivery'], true)) {
            $fulfillmentMethod = 'pickup';
        }
        $deliveryAddress = $input['delivery_address'] ?? null;
        $depositAmount = (float)($input['deposit_amount'] ?? 0);
        $items = $input['items'] ?? [];

        if (count($items) === 0) jsonError('At least one item is required', 400);

        $soId = generateUuid();

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare('
                INSERT INTO sales_orders
                    (id, so_number, status, notes, customer_name, customer_phone, is_preorder,
                     fulfillment_method, delivery_address, deposit_amount, amount_paid, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ');
            $stmt->execute([
                $soId, $soNumber, 'confirmed', $notes, $customerName, $customerPhone, $isPreorder,
                $fulfillmentMethod, $deliveryAddress, $depositAmount, $depositAmount,
                $auth['email'] ?? 'system'
            ]);

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
                    (float)($line['quantity_ordered'] ?? 1),
                    (float)($line['unit_price'] ?? 0.00),
                    $line['currency'] ?? 'GHC'
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
    $customerPhone = preg_replace('/\D+/', '', (string)($input['customer_phone'] ?? ''));
    $customerEmail = trim((string)($input['customer_email'] ?? '')) ?: null;
    $shippingAddress = trim((string)($input['shipping_address'] ?? '')) ?: null;
    $paymentMethod = trim((string)($input['payment_method'] ?? 'Cash'));
    $dueDate = trim((string)($input['due_date'] ?? '')) ?: null;
    $notes = $input['notes'] ?? 'POS Sale';

    if (count($items) === 0) jsonError('Cart is empty', 400);
    if (!in_array($paymentMethod, ['Cash', 'Mobile Money', 'Credit'], true)) jsonError('Invalid payment method', 400);
    if ($customerPhone !== '' && !preg_match('/^\d{10}$/', $customerPhone)) jsonError('Phone number must contain exactly 10 digits', 400);
    if ($customerEmail !== null && !filter_var($customerEmail, FILTER_VALIDATE_EMAIL)) jsonError('A valid email address is required', 400);
    if ($customerPhone !== '' && trim($customerName) === '') jsonError('Customer name is required when a phone number is provided', 400);
    if ($paymentMethod === 'Credit' && ($customerPhone === '' || trim($customerName) === '')) {
        jsonError('Credit sales require a registered customer with a name and phone number', 400);
    }
    $dueDateValue = $dueDate ? DateTime::createFromFormat('!Y-m-d', $dueDate) : false;
    if ($paymentMethod === 'Credit' && (!$dueDateValue || $dueDateValue->format('Y-m-d') !== $dueDate)) {
        jsonError('A valid due date is required for credit sales', 400);
    }
    if ($paymentMethod === 'Credit' && $dueDateValue < new DateTime('today')) {
        jsonError('The credit sale due date cannot be in the past', 400);
    }

    $soNumber = 'POS-' . strtoupper(substr(uniqid(), -6));
    $soId = generateUuid();

    $totalSale = 0.0;
    $customerId = null;
    $customerCreditLimit = 0.0;
    $existingCustomerBalance = 0.0;

    $pdo->beginTransaction();
    try {
        if ($customerPhone !== '') {
            $customerStmt = $pdo->prepare('INSERT INTO customers (id, full_name, phone, email, delivery_address, first_purchase_at, last_purchase_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), email = VALUES(email), delivery_address = VALUES(delivery_address), last_purchase_at = NOW()');
            $customerStmt->execute([generateUuid(), $customerName, $customerPhone, $customerEmail, $shippingAddress]);
            $findCustomer = $pdo->prepare('SELECT id, credit_limit FROM customers WHERE phone = ? FOR UPDATE');
            $findCustomer->execute([$customerPhone]);
            $customer = $findCustomer->fetch();
            $customerId = $customer['id'] ?? null;
            $customerCreditLimit = (float)($customer['credit_limit'] ?? 0);
            if ($paymentMethod === 'Credit') {
                $balanceStmt = $pdo->prepare('
                    SELECT COALESCE(SUM(GREATEST(order_totals.total_amount - order_totals.amount_paid, 0)), 0)
                    FROM (
                        SELECT so.id, so.amount_paid, COALESCE(SUM(soi.quantity_ordered * soi.unit_price), 0) AS total_amount
                        FROM sales_orders so
                        LEFT JOIN sales_order_items soi ON soi.so_id = so.id
                        WHERE so.customer_id = ?
                        GROUP BY so.id, so.amount_paid
                    ) order_totals
                ');
                $balanceStmt->execute([$customerId]);
                $existingCustomerBalance = (float)$balanceStmt->fetchColumn();
            }
        }
        if ($paymentMethod === 'Credit' && !$customerId) {
            throw new Exception('Customer registration is required before making a credit sale');
        }

        // 1. Create completed sales order
        $initialPaid = 0;
        $stmt = $pdo->prepare('INSERT INTO sales_orders (id, so_number, status, notes, customer_name, customer_phone, customer_id, due_date, amount_paid, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([$soId, $soNumber, 'shipped', "POS ($paymentMethod): $notes", $customerName, $customerPhone ?: null, $customerId, $paymentMethod === 'Credit' ? $dueDate : null, $initialPaid, $auth['email'] ?? 'system']);

        foreach ($items as $line) {
            $itemId = $line['id'] ?? null;
            $sku = $line['sku'];
            $saleQty = (float)($line['quantity'] ?? 1);
            $qty = $saleQty;
            $price = (float)($line['unit_price'] ?? 0.00);
            $saleUnit = (string)($line['sale_unit'] ?? 'unit');
            if ($saleQty <= 0) {
                throw new Exception("Invalid quantity for {$sku}");
            }

            // Check availability before selling (POS previously allowed oversell too)
            $checkStmt = $pdo->prepare('SELECT id, quantity, unit_of_measure, unit_price, unit_cost, bundle_yards, bundle_price, cut_size_mm FROM inventory_items WHERE id = ? OR sku = ? LIMIT 1');
            $checkStmt->execute([$itemId, $sku]);
            $stockItem = $checkStmt->fetch();
            if ($stockItem) {
                $itemId = $stockItem['id'];
                if ($stockItem['unit_of_measure'] === 'yard') {
                    if ($saleUnit === 'bundle') {
                        if ((float)$stockItem['bundle_yards'] <= 0 || $stockItem['bundle_price'] === null) {
                            throw new Exception("{$sku} is missing its bundle size or price");
                        }
                        if (abs($saleQty - round($saleQty)) > 0.000001) {
                            throw new Exception("{$sku} bundles must be sold in whole numbers");
                        }
                        $qty = round($saleQty * (float)$stockItem['bundle_yards'], 6);
                        $price = (float)$stockItem['bundle_price'];
                    } elseif ($saleUnit === 'cut') {
                        if ((float)$stockItem['cut_size_mm'] <= 0) {
                            throw new Exception("{$sku} has no configured cut length");
                        }
                        if (abs($saleQty - round($saleQty)) > 0.000001) {
                            throw new Exception("{$sku} cuts must be sold in whole numbers");
                        }
                        $cutLength = (float)$stockItem['cut_size_mm'];
                        $qty = round($saleQty * $cutLength / 914.4, 6);
                        $price = round((float)$stockItem['unit_price'] * $cutLength / 914.4, 2);
                    } elseif ($saleUnit === 'yard') {
                        $qty = $saleQty;
                        $price = (float)$stockItem['unit_price'];
                    } else {
                        throw new Exception("Invalid sale unit for yard product {$sku}");
                    }
                } elseif ($saleUnit === 'unit') {
                    $qty = $saleQty;
                }
                $curQty = (float)$stockItem['quantity'];
                if ($curQty < $qty) {
                    throw new Exception("Insufficient stock for {$sku}: need {$qty}, have {$curQty}");
                }
            }
            if ($qty <= 0) {
                throw new Exception("Invalid stock quantity for {$sku}");
            }
            $totalSale += $saleQty * $price;

            // Decrement FIFO batches, tracking real weighted-average cost
            $rem = $qty;
            $costTotal = 0.0;
            $costedUnits = 0.0;
            $batchesStmt = $pdo->prepare('SELECT id, on_hand_quantity, unit_cost FROM inventory_batches WHERE sku = ? AND on_hand_quantity > 0 ORDER BY received_date ASC');
            $batchesStmt->execute([$sku]);
            $batches = $batchesStmt->fetchAll();

            foreach ($batches as $b) {
                if ($rem <= 0) break;
                $take = min((float)$b['on_hand_quantity'], $rem);
                $upB = $pdo->prepare('UPDATE inventory_batches SET on_hand_quantity = on_hand_quantity - ? WHERE id = ?');
                $upB->execute([$take, $b['id']]);
                $costTotal += $take * (float)$b['unit_cost'];
                $costedUnits += $take;
                $rem -= $take;
            }
            $weightedUnitCost = $costedUnits > 0
                ? ($costTotal / $costedUnits) * ($qty / $saleQty)
                : ($stockItem && $stockItem['unit_cost'] !== null
                    ? (float)$stockItem['unit_cost'] * ($qty / $saleQty)
                    : null);

            // Insert sales order item WITH real per-sale cost captured
            $itemStmt = $pdo->prepare('
                INSERT INTO sales_order_items (id, so_id, sku, inventory_item_id, quantity_ordered, quantity_shipped, unit_price, sale_unit, unit_cost)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ');
            $itemStmt->execute([generateUuid(), $soId, $sku, $itemId, $saleQty, $saleQty, $price, $saleUnit, $weightedUnitCost]);

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

            // Audit Trail + Activity Log for POS sales -- same gap as ship.
            $auditStmt = $pdo->prepare('INSERT INTO audit_events (id, event_type, entity_type, entity_id, sku, quantity_delta, unit_cost, actor_user_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
            $auditStmt->execute([
                generateUuid(),
                'pos_sale',
                'sales_order',
                $soId,
                $sku,
                -$qty,
                $weightedUnitCost,
                $auth['email'] ?? 'system'
            ]);

            $actStmt = $pdo->prepare('INSERT INTO activity_logs (id, user_id, user_email, action, item_name, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
            $actStmt->execute([
                generateUuid(),
                $auth['sub'] ?? null,
                $auth['email'] ?? 'system',
                'POS sale',
                $line['name'] ?? $sku,
                'sales_order',
                $soId,
                json_encode(['sku' => $sku, 'quantity' => $qty, 'so_id' => $soId])
            ]);
        }

        if ($paymentMethod === 'Credit') {
            if ($customerCreditLimit <= 0) {
                throw new Exception('Set a positive credit limit for this customer before making a credit sale');
            }
            if (round($existingCustomerBalance + $totalSale, 2) > round($customerCreditLimit, 2)) {
                $available = max(0, round($customerCreditLimit - $existingCustomerBalance, 2));
                throw new Exception("Credit limit exceeded. Available credit: GHC {$available}");
            }
        } else {
            $updateTotal = $pdo->prepare('UPDATE sales_orders SET amount_paid = ? WHERE id = ?');
            $updateTotal->execute([$totalSale, $soId]);
            $paymentStmt = $pdo->prepare('INSERT INTO sales_order_payments (id, so_id, amount, payment_method, received_by) VALUES (?, ?, ?, ?, ?)');
            $paymentStmt->execute([generateUuid(), $soId, round($totalSale, 2), $paymentMethod, $auth['email'] ?? 'system']);
        }
        $pdo->commit();

        // Notify admins of large sales only after the sale is safely committed
        $largeSaleThreshold = 1000.00; // GHC - change to whatever counts as "large" for the shop
        if ($totalSale >= $largeSaleThreshold) {
            createNotification(
                $pdo,
                "Large sale: {$soNumber}",
                'GHC ' . number_format($totalSale, 2) . " to {$customerName} ({$paymentMethod}). Sold by " . ($auth['email'] ?? 'system') . '.',
                'info',
                'admin'
            );
        }

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