<?php
// ============================================================
// Users Management Routes (Admin Only)
// ============================================================

declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

function handleUserRoutes(PDO $pdo, string $method, array $uriParts): void
{
    $auth = requireAdmin();
    $id = $uriParts[2] ?? null;

    if ($id) {
        // Reset password: POST /api/users/{id}/reset-password
        $sub = $uriParts[3] ?? null;
        if ($sub === 'reset-password' && $method === 'POST') {
            $input = getJsonInput();
            $newPassword = $input['new_password'] ?? 'Welcome@123';
            $hash = password_hash($newPassword, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
            $stmt->execute([$hash, $id]);
            jsonSuccess(null, 200, 'Password reset successfully');
        }

        // Update role: PATCH /api/users/{id}
        if (($method === 'PATCH' || $method === 'PUT')) {
            $input = getJsonInput();
            if (isset($input['role'])) {
                $role = in_array($input['role'], ['admin', 'staff', 'demo']) ? $input['role'] : 'staff';
                $stmt = $pdo->prepare('UPDATE users SET role = ? WHERE id = ?');
                $stmt->execute([$role, $id]);
            }
            if (isset($input['full_name'])) {
                $stmt = $pdo->prepare('UPDATE profiles SET full_name = ? WHERE user_id = ?');
                $stmt->execute([$input['full_name'], $id]);
            }
            jsonSuccess(null, 200, 'User updated');
        }

        // Delete user: DELETE /api/users/{id}
        if ($method === 'DELETE') {
            if ($id === $auth['sub']) jsonError('Cannot delete your own admin account', 400);
            $stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
            $stmt->execute([$id]);
            jsonSuccess(null, 200, 'User deleted');
        }
    }

    if ($method === 'GET') {
        $stmt = $pdo->query('
            SELECT u.id, u.email, u.role, u.created_at, p.full_name, p.avatar_url
            FROM users u
            LEFT JOIN profiles p ON p.user_id = u.id
            ORDER BY u.created_at ASC
        ');
        jsonSuccess($stmt->fetchAll());
    }

    jsonError('Method not allowed', 405);
}
