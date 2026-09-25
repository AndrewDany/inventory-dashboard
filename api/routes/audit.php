<?php
// ============================================================
// Audit Events & Activity Logs Routes
// ============================================================

declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

function handleAuditRoutes(PDO $pdo, string $method, array $uriParts): void
{
    $auth = requireAuth();
    $subAction = $uriParts[1] ?? '';

    // GET /api/audit/events
    if ($subAction === 'events' || $subAction === '') {
        if ($method !== 'GET') jsonError('Method not allowed', 405);
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
        $stmt = $pdo->prepare('SELECT * FROM audit_events ORDER BY created_at DESC LIMIT ?');
        $stmt->execute([$limit]);
        jsonSuccess($stmt->fetchAll());
    }

    // GET /api/audit/activity-logs
    if ($subAction === 'activity-logs') {
        if ($method !== 'GET') jsonError('Method not allowed', 405);
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
        $stmt = $pdo->prepare('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?');
        $stmt->execute([$limit]);
        jsonSuccess($stmt->fetchAll());
    }

    // POST /api/audit/activity-logs
    if ($subAction === 'activity-logs' && $method === 'POST') {
        $input = getJsonInput();
        $id = generateUuid();
        $stmt = $pdo->prepare('INSERT INTO activity_logs (id, user_id, user_email, action, item_name, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $id,
            $auth['sub'] ?? null,
            $auth['email'] ?? 'system',
            $input['action'] ?? 'system_event',
            $input['item_name'] ?? null,
            $input['entity_type'] ?? null,
            $input['entity_id'] ?? null,
            isset($input['details']) ? (is_string($input['details']) ? $input['details'] : json_encode($input['details'])) : null
        ]);
        jsonSuccess(['id' => $id], 201);
    }

    jsonError('Audit action not found', 404);
}
