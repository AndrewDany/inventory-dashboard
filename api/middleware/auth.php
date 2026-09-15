<?php
// ============================================================
// Authentication & Role Middleware
// ============================================================

declare(strict_types=1);

require_once __DIR__ . '/../helpers/jwt.php';
require_once __DIR__ . '/../helpers/response.php';

function requireAuth(): array
{
    $config = require __DIR__ . '/../config/config.php';
    
    $authHeader = '';
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    } elseif (function_exists('getallheaders')) {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }

    if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        jsonError('Unauthorized: Missing or invalid token', 401);
    }

    $token = $matches[1];
    $payload = JWT::decode($token, $config['jwt_secret']);

    if (!$payload || empty($payload['sub'])) {
        jsonError('Unauthorized: Token expired or invalid signature', 401);
    }

    return $payload;
}

function requireAdmin(): array
{
    $user = requireAuth();
    if (($user['role'] ?? '') !== 'admin') {
        jsonError('Forbidden: Admin access required', 403);
    }
    return $user;
}
