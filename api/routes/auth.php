<?php
// ============================================================
// Auth Routes: Login, Me, Change Password, Invite/Register
// ============================================================

declare(strict_types=1);

require_once __DIR__ . '/../helpers/jwt.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

function handleAuthRoutes(PDO $pdo, string $method, array $uriParts): void
{
    $subAction = $uriParts[1] ?? '';
    $config = require __DIR__ . '/../config/config.php';

    switch ($subAction) {
        case 'login':
            if ($method !== 'POST') jsonError('Method not allowed', 405);
            $input = getJsonInput();
            $email = trim($input['email'] ?? '');
            $password = (string)($input['password'] ?? '');

            if (empty($email) || empty($password)) {
                jsonError('Email and password are required', 400);
            }

            $stmt = $pdo->prepare('SELECT u.id, u.email, u.password_hash, u.role, u.status, p.full_name, p.avatar_url, p.location_id FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE u.email = ? LIMIT 1');
            $stmt->execute([$email]);
            $user = $stmt->fetch();

            if (!$user || !password_verify($password, $user['password_hash'])) {
                jsonError('Invalid email or password', 401);
            }

            if (($user['status'] ?? 'active') === 'suspended') {
                jsonError('Account suspended. Please contact your system administrator.', 403);
            }

            $tokenPayload = [
                'sub' => $user['id'],
                'email' => $user['email'],
                'role' => $user['role'],
            ];

            $token = JWT::encode($tokenPayload, $config['jwt_secret'], $config['jwt_expiry_seconds']);

            jsonSuccess([
                'token' => $token,
                'user' => [
                    'id' => $user['id'],
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'full_name' => $user['full_name'],
                    'avatar_url' => $user['avatar_url'],
                    'location_id' => $user['location_id'] ?? null,
                ]
            ], 200, 'Login successful');
            break;

        case 'me':
            if ($method !== 'GET') jsonError('Method not allowed', 405);
            $auth = requireAuth();
            $stmt = $pdo->prepare('SELECT u.id, u.email, u.role, u.status, p.full_name, p.avatar_url, p.location_id FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE u.id = ? LIMIT 1');
            $stmt->execute([$auth['sub']]);
            $user = $stmt->fetch();

            if (!$user) {
                jsonError('User not found', 404);
            }

            jsonSuccess($user);
            break;

        case 'change-password':
            if ($method !== 'POST') jsonError('Method not allowed', 405);
            $auth = requireAuth();
            $input = getJsonInput();
            $currentPassword = (string)($input['current_password'] ?? $input['old_password'] ?? '');
            $newPassword = (string)($input['new_password'] ?? $input['password'] ?? '');

            if (strlen($newPassword) < 6) {
                jsonError('New password must be at least 6 characters', 400);
            }

            if ($currentPassword !== '') {
                $stmt = $pdo->prepare('SELECT password_hash FROM users WHERE id = ?');
                $stmt->execute([$auth['sub']]);
                $hash = $stmt->fetchColumn();

                if (!$hash || !password_verify($currentPassword, $hash)) {
                    jsonError('Current password is incorrect', 400);
                }
            }

            $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
            $update = $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
            $update->execute([$newHash, $auth['sub']]);

            jsonSuccess(null, 200, 'Password updated successfully');
            break;

        case 'invite':
            if ($method !== 'POST') jsonError('Method not allowed', 405);
            $auth = requireAdmin();
            $input = getJsonInput();
            $email = trim($input['email'] ?? '');
            $role = in_array($input['role'] ?? '', ['admin', 'staff', 'demo']) ? $input['role'] : 'staff';
            $fullName = trim($input['full_name'] ?? $input['fullName'] ?? '');
            $tempPassword = $input['password'] ?? $input['temp_password'] ?? 'Welcome@123';
            $locationId = $input['location_id'] ?? $input['locationId'] ?? null;

            if (empty($email)) {
                jsonError('Email is required', 400);
            }

            // Check if exists
            $check = $pdo->prepare('SELECT id FROM users WHERE email = ?');
            $check->execute([$email]);
            if ($check->fetch()) {
                jsonError('User with this email already exists', 400);
            }

            $userId = generateUuid();
            $profileId = generateUuid();
            $passwordHash = password_hash($tempPassword, PASSWORD_BCRYPT);

            $pdo->beginTransaction();
            try {
                $stmt = $pdo->prepare('INSERT INTO users (id, email, password_hash, role, status) VALUES (?, ?, ?, ?, "active")');
                $stmt->execute([$userId, $email, $passwordHash, $role]);

                $stmt2 = $pdo->prepare('INSERT INTO profiles (id, user_id, full_name, location_id) VALUES (?, ?, ?, ?)');
                $stmt2->execute([$profileId, $userId, $fullName ?: null, $locationId ?: null]);

                $pdo->commit();
                jsonSuccess(['id' => $userId, 'email' => $email, 'role' => $role], 201, 'User invited successfully');
            } catch (Exception $e) {
                $pdo->rollBack();
                jsonError('Failed to create user: ' . $e->getMessage(), 500);
            }
            break;

        default:
            jsonError('Auth action not found', 404);
    }
}
