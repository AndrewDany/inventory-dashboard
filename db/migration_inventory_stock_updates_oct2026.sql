-- ============================================================
-- Inventory Stock Updates - October 2026
-- Updates:
-- 1. GLASS PROFILE BLACK: consolidated to 34 pcs total
-- 2. SPRAY GLUE (category: GLUE): 25 pcs, cost GHC 60, selling GHC 65
-- 3. NAIL GLUE (category: GLUE): 8 pcs, cost GHC 35, selling GHC 40
-- 4. SHELVE BRACKET BLACK 200X 200 (category: SHELF BRACKETS): 7 pcs, cost GHC 55, selling GHC 60
-- ============================================================

START TRANSACTION;

-- 1. GLASS PROFILE BLACK: ensure single consolidated item with 34 pcs
-- Delete GLASS PROFILE BLACK HANDLE if it exists
DELETE FROM `inventory_items` 
WHERE (`name` LIKE '%GLASS PROFILE BLACK HANDLE%' OR `sku` = 'GLASS-PROFILE-BLACK-HANDLE')
  AND NOT EXISTS (SELECT 1 FROM `sales_order_items` WHERE `inventory_item_id` = `inventory_items`.`id`);

-- Update GLASS PROFILE BLACK to 34 pcs
UPDATE `inventory_items`
SET `quantity` = 34
WHERE `sku` = 'GLASS-PROFILE-BLACK' OR `name` = 'GLASS PROFILE BLACK';

-- Ensure GLASS PROFILE BLACK exists if not already present
INSERT INTO `inventory_items` (
  `id`, `name`, `sku`, `category`, `type`, `color`, `unit_type`, `quantity`, `reorder_level`, `unit_cost`, `unit_price`, `created_at`, `last_updated`
) VALUES (
  UUID(), 'GLASS PROFILE BLACK', 'GLASS-PROFILE-BLACK', 'PROFILES', 'Profile', 'Black', 'unit', 34, 5, 145.00, 160.00, NOW(), NOW()
) ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `quantity` = 34;

-- 2. SPRAY GLUE under GLUE: 25 pcs, cost GHC 60, selling GHC 65
INSERT INTO `inventory_items` (
  `id`, `name`, `sku`, `category`, `type`, `unit_type`, `quantity`, `reorder_level`, `unit_cost`, `unit_price`, `created_at`, `last_updated`
) VALUES (
  UUID(), 'SPRAY GLUE', 'SPRAY-GLUE', 'GLUE', 'Glue', 'unit', 25, 5, 60.00, 65.00, NOW(), NOW()
) ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `category` = 'GLUE',
  `quantity` = 25,
  `unit_cost` = 60.00,
  `unit_price` = 65.00;

-- 3. NAIL GLUE under GLUE: 8 pcs, cost GHC 35, selling GHC 40
INSERT INTO `inventory_items` (
  `id`, `name`, `sku`, `category`, `type`, `unit_type`, `quantity`, `reorder_level`, `unit_cost`, `unit_price`, `created_at`, `last_updated`
) VALUES (
  UUID(), 'NAIL GLUE', 'NAIL-GLUE', 'GLUE', 'Glue', 'unit', 8, 5, 35.00, 40.00, NOW(), NOW()
) ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `category` = 'GLUE',
  `quantity` = 8,
  `unit_cost` = 35.00,
  `unit_price` = 40.00;

-- 4. SHELVE BRACKET BLACK 200X 200 under SHELF BRACKETS: 7 pcs, cost GHC 55, selling GHC 60
INSERT INTO `inventory_items` (
  `id`, `name`, `sku`, `category`, `type`, `color`, `size`, `unit_type`, `quantity`, `reorder_level`, `unit_cost`, `unit_price`, `created_at`, `last_updated`
) VALUES (
  UUID(), 'SHELVE BRACKET BLACK 200X 200', 'SHELVE-BRACKET-BLACK-200X200', 'SHELF BRACKETS', 'Bracket', 'Black', '200x200', 'unit', 7, 5, 55.00, 60.00, NOW(), NOW()
) ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `category` = 'SHELF BRACKETS',
  `color` = 'Black',
  `size` = '200x200',
  `quantity` = 7,
  `unit_cost` = 55.00,
  `unit_price` = 60.00;

-- 5. Sync/create initial inventory batches for FIFO valuation & COGS tracking
INSERT INTO `inventory_batches` (`id`, `sku`, `inventory_item_id`, `batch_code`, `initial_quantity`, `on_hand_quantity`, `unit_cost`, `received_date`)
SELECT 
  UUID(), sku, id, CONCAT('BATCH-INIT-', sku), quantity, quantity, unit_cost, NOW()
FROM `inventory_items`
WHERE `sku` IN ('GLASS-PROFILE-BLACK', 'SPRAY-GLUE', 'NAIL-GLUE', 'SHELVE-BRACKET-BLACK-200X200')
  AND NOT EXISTS (
    SELECT 1 FROM `inventory_batches` b WHERE b.`inventory_item_id` = `inventory_items`.`id`
  );

COMMIT;
