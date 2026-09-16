-- ============================================================
-- Inventory Suite - Initial Seed Data
-- ============================================================

-- 1. Default Admin & Staff Users
-- Password for admin@inventory.local is: Admin@12345 (bcrypt hashed)
-- Password for demo@inventory.local is: Demo@12345 (bcrypt hashed)
INSERT INTO `users` (`id`, `email`, `password_hash`, `role`, `created_at`) VALUES
('u-admin-0001', 'admin@inventory.local', '$2y$10$vEV8TkwYBaTEtA2Nnc3rqu2excQwL2T.m0AzxBIMAuK9oWIgGe1la', 'admin', NOW()),
('u-demo-0002', 'demo@inventory.local', '$2y$10$YLjaydm8Be1B1wdi8EhXJOf9d9of9tE8cwAnVqdGg.51cKEBH1hpC', 'demo', NOW())
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

INSERT INTO `profiles` (`id`, `user_id`, `full_name`, `avatar_url`) VALUES
('p-admin-0001', 'u-admin-0001', 'System Administrator', NULL),
('p-demo-0002', 'u-demo-0002', 'Demo User', NULL)
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

-- 2. Default Locations
INSERT INTO `locations` (`id`, `name`, `address`, `is_active`) VALUES
('loc-main-01', 'Main Warehouse', 'Accra Central Industrial Area', 1),
('loc-branch-02', 'North Branch Store', 'Kumasi Commercial Hub', 1),
('loc-dock-03', 'Tema Port Receiving Dock', 'Tema Harbour Area', 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 3. Default Suppliers
INSERT INTO `suppliers` (`id`, `name`, `contact_email`, `phone`, `address`) VALUES
('sup-001', 'Global Tech Supplies Ltd', 'sales@globaltech.com', '+233 24 111 2222', 'Airport City, Accra'),
('sup-002', 'Industrial Tools & Hardware', 'orders@industrialtools.com', '+233 20 333 4444', 'Heavy Industrial Area, Tema')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 4. Initial Budget Setting
INSERT INTO `budget_settings` (`id`, `monthly_budget`) VALUES
(1, 50000.00)
ON DUPLICATE KEY UPDATE `monthly_budget` = VALUES(`monthly_budget`);

-- 5. System Settings
INSERT INTO `system_settings` (`key`, `value`) VALUES
('currency_symbol', 'GHS'),
('currency_name', 'Ghana Cedi'),
('low_stock_threshold', '5'),
('app_name', 'Inventory Suite')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);
