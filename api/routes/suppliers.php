<?php
// ============================================================
// Suppliers Routes
// ============================================================

declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

function handleSupplierRoutes(PDO $pdo, string $method, array $uriParts): void
{
    $auth = requireAuth();
    $id = $uriParts[2] ?? null;

    if ($id) {
        switch ($method) {
            case 'GET':
                $stmt = $pdo->prepare('SELECT * FROM suppliers WHERE id = ?');
                $stmt->execute([$id]);
                $sup = $stmt->fetch();
                if (!$sup) jsonError('Supplier not found', 404);
                jsonSuccess($sup);
                break;

            case 'PUT':
            case 'PATCH':
                if ($auth['role'] === 'demo') jsonError('Demo account cannot modify suppliers', 403);
                $input = getJsonInput();
                $stmt = $pdo->prepare('UPDATE suppliers SET name = ?, contact_email = ?, phone = ?, address = ? WHERE id = ?');
                $stmt->execute([
                    $input['name'] ?? '',
                    $input['contact_email'] ?? null,
                    $input['phone'] ?? null,
                    $input['address'] ?? null,
                    $id
                ]);
                $fetch = $pdo->prepare('SELECT * FROM suppliers WHERE id = ?');
                $fetch->execute([$id]);
                jsonSuccess($fetch->fetch());
                break;

            case 'DELETE':
                if ($auth['role'] === 'demo') jsonError('Demo account cannot delete suppliers', 403);
                $stmt = $pdo->prepare('DELETE FROM suppliers WHERE id = ?');
                $stmt->execute([$id]);
                jsonSuccess(null, 200, 'Supplier deleted');
                break;

            default:
                jsonError('Method not allowed', 405);
        }
    }

    switch ($method) {
        case 'GET':
            $stmt = $pdo->query('SELECT * FROM suppliers ORDER BY name ASC');
            jsonSuccess($stmt->fetchAll());
            break;

        case 'POST':
            if ($auth['role'] === 'demo') jsonError('Demo account cannot add suppliers', 403);
            $input = getJsonInput();
            $name = trim($input['name'] ?? '');
            if (empty($name)) jsonError('Supplier name is required', 400);

            $id = generateUuid();
            $stmt = $pdo->prepare('INSERT INTO suppliers (id, name, contact_email, phone, address) VALUES (?, ?, ?, ?, ?)');
            $stmt->execute([
                $id,
                $name,
                $input['contact_email'] ?? null,
                $input['phone'] ?? null,
                $input['address'] ?? null,
            ]);

            $fetch = $pdo->prepare('SELECT * FROM suppliers WHERE id = ?');
            $fetch->execute([$id]);
            jsonSuccess($fetch->fetch(), 201, 'Supplier created');
            break;

        default:
            jsonError('Method not allowed', 405);
    }
}
