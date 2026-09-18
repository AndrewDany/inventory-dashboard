<?php
// ============================================================
// Response & Utility Helpers
// ============================================================

declare(strict_types=1);

/**
 * PDO always returns MySQL DECIMAL columns (and SUM/AVG aggregate results)
 * as numeric strings, e.g. "10.00" instead of 10.0, to avoid float precision
 * loss. json_encode() then serializes them as JSON strings, so every price,
 * cost, total, and margin field silently reaches the frontend as a string
 * unless corrected here. This walks every response body once, centrally,
 * and casts numeric-looking string values to real numbers -- except for
 * keys that look like identifiers, codes, or numbers-as-labels (id, sku,
 * *_number, phone, zip, etc.), which must stay exact strings even when
 * every character happens to be a digit.
 */
function castNumericStrings(mixed $value): mixed
{
    if (is_array($value)) {
        $isList = array_is_list($value);
        $result = [];
        foreach ($value as $key => $item) {
            if (!$isList && is_string($key) && preg_match('/(^id$|_id$|sku|code|number|phone|zip|postal|barcode)/i', $key)) {
                $result[$key] = $item; // identifier-like field: leave untouched
            } else {
                $result[$key] = castNumericStrings($item);
            }
        }
        return $result;
    }

    if (is_string($value) && $value !== '' && is_numeric($value)) {
        return $value + 0; // '10.00' -> 10.0, '5' -> 5 (PHP picks float or int)
    }

    return $value;
}

/**
 * Send JSON success response
 */
function jsonSuccess(mixed $data = null, int $statusCode = 200, string $message = 'Success'): void
{
    http_response_code($statusCode);
    echo json_encode([
        'success' => true,
        'message' => $message,
        'data'    => castNumericStrings($data),
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
