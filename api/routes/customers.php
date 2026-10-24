<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

function handleCustomerRoutes(PDO $pdo, string $method, array $uriParts): void
{
    $auth = requireAuth();
    $id = $uriParts[1] ?? null;

    if ($method === 'GET') {
        if ($id === null && !isset($_GET['phone'])) {
            if (($auth['role'] ?? '') !== 'admin') jsonError('Admin access required', 403);
            $stmt = $pdo->query('
                SELECT c.*, COALESCE(t.outstanding_balance, 0) AS outstanding_balance
                FROM customers c
                LEFT JOIN (
                    SELECT order_totals.customer_id,
                           SUM(GREATEST(order_totals.total_amount - order_totals.amount_paid, 0)) AS outstanding_balance
                    FROM (
                        SELECT so.id, so.customer_id, so.amount_paid,
                               COALESCE(SUM(soi.quantity_ordered * soi.unit_price), 0) AS total_amount
                        FROM sales_orders so
                        LEFT JOIN sales_order_items soi ON soi.so_id = so.id
                        GROUP BY so.id, so.customer_id, so.amount_paid
                    ) order_totals
                    GROUP BY order_totals.customer_id
                ) t ON t.customer_id = c.id
                ORDER BY c.full_name
            ');
            jsonSuccess($stmt->fetchAll());
        }

        $phone = preg_replace('/\D+/', '', (string)($_GET['phone'] ?? ''));
        if (!preg_match('/^\d{10}$/', $phone)) jsonError('A valid 10-digit phone number is required', 400);
        $stmt = $pdo->prepare('
            SELECT c.id, c.full_name, c.phone, c.email, c.delivery_address,
                   c.credit_limit, c.first_purchase_at, c.last_purchase_at,
                   COALESCE((
                       SELECT SUM(GREATEST(COALESCE(order_totals.total_amount, 0) - so.amount_paid, 0))
                       FROM sales_orders so
                       LEFT JOIN (
                           SELECT so_id, SUM(quantity_ordered * unit_price) AS total_amount
                           FROM sales_order_items
                           GROUP BY so_id
                       ) order_totals ON order_totals.so_id = so.id
                       WHERE so.customer_id = c.id
                   ), 0) AS outstanding_balance
            FROM customers c WHERE c.phone = ? LIMIT 1
        ');
        $stmt->execute([$phone]);
        jsonSuccess($stmt->fetch() ?: null);
    }

    if ($method === 'PUT' && $id && ($uriParts[2] ?? '') === 'credit-limit') {
        if (($auth['role'] ?? '') !== 'admin') jsonError('Admin access required', 403);
        $input = getJsonInput();
        if (!isset($input['credit_limit']) || !is_numeric($input['credit_limit']) || (float)$input['credit_limit'] < 0) {
            jsonError('Credit limit must be a non-negative amount', 400);
        }
        $stmt = $pdo->prepare('UPDATE customers SET credit_limit = ? WHERE id = ?');
        $stmt->execute([round((float)$input['credit_limit'], 2), $id]);
        if ($stmt->rowCount() === 0) {
            $check = $pdo->prepare('SELECT id FROM customers WHERE id = ?');
            $check->execute([$id]);
            if (!$check->fetch()) jsonError('Customer not found', 404);
        }
        jsonSuccess(['credit_limit' => round((float)$input['credit_limit'], 2)], 200, 'Credit limit updated');
    }

    if ($method === 'POST') {
        $input = getJsonInput();
        $phone = preg_replace('/\D+/', '', (string)($input['phone'] ?? ''));
        $name = trim((string)($input['full_name'] ?? ''));
        $email = trim((string)($input['email'] ?? '')) ?: null;
        $address = trim((string)($input['delivery_address'] ?? '')) ?: null;
        if (!preg_match('/^\d{10}$/', $phone)) jsonError('Phone number must contain exactly 10 digits', 400);
        if ($name === '') jsonError('Customer name is required', 400);
        if ($email !== null && !filter_var($email, FILTER_VALIDATE_EMAIL)) jsonError('A valid email address is required', 400);
        $stmt = $pdo->prepare('INSERT INTO customers (id, full_name, phone, email, delivery_address) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), email = VALUES(email), delivery_address = VALUES(delivery_address)');
        $stmt->execute([generateUuid(), $name, $phone, $email, $address]);
        $fetch = $pdo->prepare('SELECT id, full_name, phone, email, delivery_address, credit_limit, first_purchase_at, last_purchase_at FROM customers WHERE phone = ? LIMIT 1');
        $fetch->execute([$phone]);
        jsonSuccess($fetch->fetch(), 200, 'Customer verified');
    }

    jsonError('Method not allowed', 405);
}