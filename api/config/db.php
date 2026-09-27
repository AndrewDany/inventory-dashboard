<?php
// ============================================================
// Database PDO Connection
// ============================================================

declare(strict_types=1);

$config = require __DIR__ . '/config.php';

// Allow override via a simple db_config.php file if present (useful on cPanel)
$localDbConfig = __DIR__ . '/db_config.php';
if (file_exists($localDbConfig)) {
    $custom = require $localDbConfig;
    if (is_array($custom)) {
        $config['db'] = array_merge($config['db'], $custom);
    }
}

$db = $config['db'];

$dsn = sprintf(
    'mysql:host=%s;port=%s;dbname=%s;charset=%s',
    $db['host'],
    $db['port'],
    $db['database'],
    $db['charset']
);

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $db['username'], $db['password'], $options);

    // Force this session's clock to UTC, which equals Ghana local time
    // (UTC+0, no daylight saving). Without this, NOW()/CURRENT_TIMESTAMP
    // defaults use the DB server's own system timezone, which may not
    // match Accra time and was causing login/logout timestamps (and
    // every other auto-timestamped record) to be off by several hours.
    $pdo->exec("SET time_zone = '+00:00'");
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed: ' . $e->getMessage()
    ]);
    exit;
}

return $pdo;