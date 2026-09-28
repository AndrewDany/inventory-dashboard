<?php
// ============================================================
// Notification helper
// Call createNotification() from any route when something worth
// telling people about happens (returns, adjustments, PO received...).
// Failures are logged, never thrown, so a notification problem can
// never break the sale/return/adjustment that triggered it.
// ============================================================

declare(strict_types=1);

require_once __DIR__ . '/response.php';

/**
 * @param string $type     One of: info, warning, danger, success
 * @param string $audience 'all' = everyone, 'admin' = admins only
 */
function createNotification(
    PDO $pdo,
    string $title,
    string $message,
    string $type = 'info',
    string $audience = 'admin'
): void {
    try {
        $stmt = $pdo->prepare(
            'INSERT INTO notifications (id, title, message, type, audience, is_read) VALUES (?, ?, ?, ?, ?, 0)'
        );
        $stmt->execute([generateUuid(), $title, $message, $type, $audience]);
    } catch (Throwable $e) {
        error_log('Failed to create notification: ' . $e->getMessage());
    }
}