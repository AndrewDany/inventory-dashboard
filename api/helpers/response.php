<?php
// ============================================================
// Response & Utility Helpers
// ============================================================

declare(strict_types=1);

/**
 * Send JSON success response
 */
function jsonSuccess(mixed $data = null, int $statusCode = 200, string $message = 'Success'): void
{
    http_response_code($statusCode);
    echo json_encode([
        'success' => true,
        'message' => $message,
        'data'    => $data,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Send JSON error response
 */
function jsonError(string $message, int $statusCode = 400, mixed $details = null): void
{
    http_response_code($statusCode);
    echo json_encode([
        'success' => false,
        'error'   => $message,
        'details' => $details,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Get JSON request payload
 */
function getJsonInput(): array
{
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

/**
 * Generate standard UUID v4 string
 */
function generateUuid(): string
{
    $data = random_bytes(16);
    $data[6] = chr((ord($data[6]) & 0x0f) | 0x40); // version 4
    $data[8] = chr((ord($data[8]) & 0x3f) | 0x80); // variant
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}
