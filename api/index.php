<?php
// ============================================================
// Main API Router & Request Dispatcher
// ============================================================

declare(strict_types=1);

// Load global configuration & CORS
require_once __DIR__ . '/config/config.php';
$pdo = require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/helpers/response.php';

// Load route modules
require_once __DIR__ . '/routes/auth.php';
require_once __DIR__ . '/routes/inventory.php';
require_once __DIR__ . '/routes/locations.php';
require_once __DIR__ . '/routes/suppliers.php';
require_once __DIR__ . '/routes/adjustments.php';
require_once __DIR__ . '/routes/purchase_orders.php';
require_once __DIR__ . '/routes/sales_orders.php';
require_once __DIR__ . '/routes/returns.php';
require_once __DIR__ . '/routes/financials.php';
require_once __DIR__ . '/routes/users.php';
require_once __DIR__ . '/routes/audit.php';
require_once __DIR__ . '/routes/notifications.php';
require_once __DIR__ . '/routes/reports.php';
require_once __DIR__ . '/routes/customers.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

// Normalize path: strip leading /api if present
$path = preg_replace('#^.*?/api/?#', '', $requestUri);
$path = trim($path, '/');
$uriParts = explode('/', $path);

$resource = $uriParts[0] ?? '';

try {
    switch ($resource) {
        case 'auth':
            handleAuthRoutes($pdo, $method, $uriParts);
            break;

        case 'inventory':
            handleInventoryRoutes($pdo, $method, $uriParts);
            break;

        case 'locations':
            handleLocationRoutes($pdo, $method, $uriParts);
            break;

        case 'suppliers':
            handleSupplierRoutes($pdo, $method, $uriParts);
            break;

        case 'movements':
            handleMovementRoutes($pdo, $method);
            break;

        case 'batches':
            handleBatchRoutes($pdo, $method, $uriParts);
            break;

        case 'adjustments':
            handleAdjustmentRoutes($pdo, $method);
            break;

        case 'purchase-orders':
            handlePurchaseOrderRoutes($pdo, $method, $uriParts);
            break;

        case 'sales-orders':
            handleSalesOrderRoutes($pdo, $method, $uriParts);
            break;

        case 'pos':
            if (($uriParts[1] ?? '') === 'checkout') {
                handlePosCheckout($pdo, $method);
            }
            jsonError('POS endpoint not found', 404);
            break;

        case 'returns':
            handleReturnRoutes($pdo, $method, $uriParts);
            break;

        case 'expenses':
            handleExpenseRoutes($pdo, $method, $uriParts);
            break;

        case 'financials':
            handleFinancialRoutes($pdo, $method, $uriParts);
            break;

        case 'reports':
            handleReportRoutes($pdo, $method, $uriParts);
            break;

        case 'users':
            handleUserRoutes($pdo, $method, $uriParts);
            break;

        case 'audit':
            handleAuditRoutes($pdo, $method, $uriParts);
            break;

        case 'notifications':
            handleNotificationRoutes($pdo, $method, $uriParts);
            break;

        case 'customers':
            handleCustomerRoutes($pdo, $method, $uriParts);
            break;

        case 'settings':
            handleSettingsRoutes($pdo, $method);
            break;

        case 'health':
        case '':
            jsonSuccess([
                'status' => 'online',
                'service' => 'Inventory Suite REST API',
                'timestamp' => date('c'),
                'php_version' => PHP_VERSION,
            ], 200, 'API service active');
            break;

        default:
            jsonError("Resource '$resource' not found", 404);
    }
} catch (Throwable $e) {
    jsonError('Internal server error: ' . $e->getMessage(), 500);
}
