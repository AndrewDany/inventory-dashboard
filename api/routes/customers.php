<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

function handleCustomerRoutes(PDO $pdo, string $method, array $uriParts): void
{
    requireAuth();

    if ($method === 'GET') {
        $phone = preg_replace('/\D+/', '', (string)($_GET['phone'] ?? ''));
        if (!preg_match('/^\d{10}$/', $phone)) jsonError('A valid 10-digit phone number is required', 400);
        $stmt = $pdo->prepare('SELECT id, full_name, phone, email, delivery_address, first_purchase_at, last_purchase_at FROM customers WHERE phone = ? LIMIT 1');
        $stmt->execute([$phone]);
        jsonSuccess($stmt->fetch() ?: null);
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
        $fetch = $pdo->prepare('SELECT id, full_name, phone, email, delivery_address, first_purchase_at, last_purchase_at FROM customers WHERE phone = ? LIMIT 1');
        $fetch->execute([$phone]);
        jsonSuccess($fetch->fetch(), 200, 'Customer verified');
    }

    jsonError('Method not allowed', 405);
}