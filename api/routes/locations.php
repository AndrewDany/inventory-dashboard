<?php
// ============================================================
// Locations Routes
// ============================================================

declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

function handleLocationRoutes(PDO $pdo, string $method, array $uriParts): void
{
    $auth = requireAuth();
    $id = $uriParts[1] ?? null;

    if ($id) {
        switch ($method) {
            case 'GET':
                $stmt = $pdo->prepare('SELECT * FROM locations WHERE id = ?');
                $stmt->execute([$id]);
                $loc = $stmt->fetch();
                if (!$loc) jsonError('Location not found', 404);
                jsonSuccess($loc);
                break;

            case 'PUT':
            case 'PATCH':
                if ($auth['role'] === 'demo') jsonError('Demo account cannot modify locations', 403);
                $input = getJsonInput();
                $stmt = $pdo->prepare('UPDATE locations SET name = ?, address = ?, is_active = ? WHERE id = ?');
                $stmt->execute([
                    $input['name'] ?? '',
                    $input['address'] ?? null,
                    isset($input['is_active']) ? (int)$input['is_active'] : 1,
                    $id
                ]);
                $fetch = $pdo->prepare('SELECT * FROM locations WHERE id = ?');
                $fetch->execute([$id]);
                jsonSuccess($fetch->fetch());
                break;

            case 'DELETE':
                if ($auth['role'] === 'demo') jsonError('Demo account cannot delete locations', 403);
                $stmt = $pdo->prepare('DELETE FROM locations WHERE id = ?');
                $stmt->execute([$id]);
                jsonSuccess(null, 200, 'Location deleted');
                break;

            default:
                jsonError('Method not allowed', 405);
        }
    }

    switch ($method) {
        case 'GET':
            $stmt = $pdo->query('SELECT * FROM locations ORDER BY name ASC');
            jsonSuccess($stmt->fetchAll());
            break;

        case 'POST':
            if ($auth['role'] === 'demo') jsonError('Demo account cannot add locations', 403);
            $input = getJsonInput();
            $name = trim($input['name'] ?? '');
            if (empty($name)) jsonError('Location name is required', 400);

            $id = generateUuid();
            $stmt = $pdo->prepare('INSERT INTO locations (id, name, address, is_active) VALUES (?, ?, ?, ?)');
            $stmt->execute([
                $id,
                $name,
                $input['address'] ?? null,
                isset($input['is_active']) ? (int)$input['is_active'] : 1,
            ]);

            $fetch = $pdo->prepare('SELECT * FROM locations WHERE id = ?');
            $fetch->execute([$id]);
            jsonSuccess($fetch->fetch(), 201, 'Location created');
            break;

        default:
            jsonError('Method not allowed', 405);
    }
}
