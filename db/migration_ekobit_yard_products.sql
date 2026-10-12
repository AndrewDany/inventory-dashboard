-- Add EKOBIT yard products and concrete nail small bundles.
-- Existing stock quantities are preserved when this migration is rerun.
ALTER TABLE `inventory_items`
  MODIFY COLUMN `quantity` DECIMAL(12, 6) NOT NULL DEFAULT 0,
  MODIFY COLUMN `reorder_level` DECIMAL(12, 6) NOT NULL DEFAULT 0;

ALTER TABLE `stock_movements`
  MODIFY COLUMN `change_amount` DECIMAL(12, 6) NOT NULL;

ALTER TABLE `inventory_batches`
  MODIFY COLUMN `initial_quantity` DECIMAL(12, 6) NOT NULL DEFAULT 0,
  MODIFY COLUMN `on_hand_quantity` DECIMAL(12, 6) NOT NULL DEFAULT 0;

ALTER TABLE `sales_order_items`
  MODIFY COLUMN `quantity_ordered` DECIMAL(12, 6) NOT NULL,
  MODIFY COLUMN `quantity_shipped` DECIMAL(12, 6) NOT NULL DEFAULT 0;

ALTER TABLE `inventory_adjustments`
  MODIFY COLUMN `quantity_delta` DECIMAL(12, 6) NOT NULL;

ALTER TABLE `purchase_order_items`
  MODIFY COLUMN `quantity_ordered` DECIMAL(12, 6) NOT NULL,
  MODIFY COLUMN `quantity_received` DECIMAL(12, 6) NOT NULL DEFAULT 0;

ALTER TABLE `returns`
  MODIFY COLUMN `quantity` DECIMAL(12, 6) NOT NULL;

ALTER TABLE `audit_events`
  MODIFY COLUMN `quantity_delta` DECIMAL(12, 6) NULL DEFAULT 0;

SET @yard_item_columns = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_items' AND COLUMN_NAME = 'bundle_yards'
);
SET @yard_item_ddl = IF(@yard_item_columns = 0,
  'ALTER TABLE `inventory_items` ADD COLUMN `bundle_yards` DECIMAL(12, 4) NULL DEFAULT NULL, ADD COLUMN `bundle_price` DECIMAL(12, 2) NULL DEFAULT NULL, ADD COLUMN `cut_size_mm` DECIMAL(8, 2) NULL DEFAULT NULL, ADD COLUMN `unit_cost` DECIMAL(12, 2) NULL DEFAULT NULL',
  'SELECT 1');
PREPARE yard_item_stmt FROM @yard_item_ddl;
EXECUTE yard_item_stmt;
DEALLOCATE PREPARE yard_item_stmt;

SET @sale_unit_column = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales_order_items' AND COLUMN_NAME = 'sale_unit'
);
SET @sale_unit_ddl = IF(@sale_unit_column = 0,
  'ALTER TABLE `sales_order_items` ADD COLUMN `sale_unit` VARCHAR(30) NULL',
  'SELECT 1');
PREPARE sale_unit_stmt FROM @sale_unit_ddl;
EXECUTE sale_unit_stmt;
DEALLOCATE PREPARE sale_unit_stmt;

INSERT INTO `inventory_items` (
  `id`, `name`, `sku`, `category`, `brand`, `size`, `unit_type`,
  `unit_of_measure`, `units_per_box`, `unit_cost`, `bundle_yards`, `bundle_price`, `cut_size_mm`,
  `quantity`, `reorder_level`, `unit_price`
) VALUES
  (UUID(), 'EKOBIT 2 inches', 'EKOBIT-2IN', NULL, 'EKOBIT', '2 inches', 'weight', 'yard', NULL, NULL, NULL, 100, 0, 0, 18.00),
  (UUID(), 'EKOBIT 3 inches', 'EKOBIT-3IN', NULL, 'EKOBIT', '3 inches', 'weight', 'yard', NULL, NULL, NULL, 100, 0, 0, 20.00),
  (UUID(), 'EKOBIT 4 inches', 'EKOBIT-4IN', NULL, 'EKOBIT', '4 inches', 'weight', 'yard', NULL, NULL, NULL, 100, 0, 0, 25.00),
  (UUID(), 'Concrete Nails 3 inches - Small Bundle', 'CONCRETE-NAILS-3IN', 'Nails', NULL, '3 inches', 'box', NULL, 10, NULL, NULL, NULL, NULL, 70, 0, 5.00),
  (UUID(), 'Concrete Nails 4 inches - Small Bundle', 'CONCRETE-NAILS-4IN', 'Nails', NULL, '4 inches', 'box', NULL, 10, NULL, NULL, NULL, NULL, 60, 0, 5.00),
  (UUID(), 'Concrete Nails 2.5 inches - Small Bundle', 'CONCRETE-NAILS-2.5IN', 'Nails', NULL, '2.5 inches', 'box', NULL, 15, NULL, NULL, NULL, NULL, 90, 0, 5.00),
  (UUID(), 'Concrete Nails 1 inch - Small Bundle', 'CONCRETE-NAILS-1IN', 'Nails', NULL, '1 inch', 'box', NULL, 50, NULL, NULL, NULL, NULL, 500, 0, 5.00),
  (UUID(), 'Concrete Nails 1.5 inches - Small Bundle', 'CONCRETE-NAILS-1.5IN', 'Nails', NULL, '1.5 inches', 'box', NULL, 25, NULL, NULL, NULL, NULL, 200, 0, 5.00),
  (UUID(), 'Concrete Nails 2 inches - Small Bundle', 'CONCRETE-NAILS-2IN', 'Nails', NULL, '2 inches', 'box', NULL, 20, NULL, NULL, NULL, NULL, 180, 0, 5.00)
ON DUPLICATE KEY UPDATE
  `quantity` = IF(`unit_type` = 'unit' AND `units_per_box` IS NULL, `quantity` * VALUES(`units_per_box`), `quantity`),
  `unit_type` = VALUES(`unit_type`),
  `units_per_box` = VALUES(`units_per_box`),
  `unit_cost` = VALUES(`unit_cost`),
  `bundle_yards` = VALUES(`bundle_yards`),
  `bundle_price` = VALUES(`bundle_price`),
  `cut_size_mm` = VALUES(`cut_size_mm`),
  `name` = VALUES(`name`),
  `brand` = VALUES(`brand`),
  `size` = VALUES(`size`),
  `unit_type` = VALUES(`unit_type`),
  `unit_of_measure` = VALUES(`unit_of_measure`),
  `unit_price` = VALUES(`unit_price`);

INSERT INTO `inventory_items` (
  `id`, `name`, `sku`, `category`, `brand`, `color`, `size`, `unit_type`,
  `unit_of_measure`, `units_per_box`, `unit_cost`, `bundle_yards`, `bundle_price`,
  `cut_size_mm`, `quantity`, `reorder_level`, `unit_price`
) VALUES
  (UUID(), 'Mosquito Net', 'MOSQUITO-NET', 'Nets', NULL, NULL, NULL, 'weight', 'yard', NULL, 0.60, 100, 65.00, NULL, 0, 0, 6.00),
  (UUID(), 'Filter Net - Ash', 'FILTER-NET-ASH', 'Nets', NULL, 'Ash', NULL, 'weight', 'yard', NULL, 1.50, 100, 160.00, NULL, 0, 0, 12.00),
  (UUID(), 'Filter Net - Black', 'FILTER-NET-BLACK', 'Nets', NULL, 'Black', NULL, 'weight', 'yard', NULL, 1.50, 100, 160.00, NULL, 0, 0, 12.00),
  (UUID(), 'Edge Glossy 3/4 inch', 'EDGE-GLOSSY-075IN', 'Edge', NULL, NULL, '3/4 inch', 'weight', 'yard', NULL, NULL, 100, 220.00, NULL, 0, 0, 5.00),
  (UUID(), 'Edge Glossy 1.5 inches', 'EDGE-GLOSSY-15IN', 'Edge', NULL, NULL, '1.5 inches', 'weight', 'yard', NULL, NULL, 100, 320.00, NULL, 0, 0, 6.00),
  (UUID(), 'Edge Matt 3/4 inch', 'EDGE-MATT-075IN', 'Edge', NULL, NULL, '3/4 inch', 'weight', 'yard', NULL, NULL, 100, 180.00, NULL, 0, 0, 3.00),
  (UUID(), 'Edge Matt 1.5 inches', 'EDGE-MATT-15IN', 'Edge', NULL, NULL, '1.5 inches', 'weight', 'yard', NULL, NULL, 100, 300.00, NULL, 0, 0, 4.00),
  (UUID(), 'Edge Gold (Plaster) 3/4 inch', 'EDGE-GOLD-075IN', 'Edge', 'Gold (Plaster)', NULL, '3/4 inch', 'weight', 'yard', NULL, NULL, 50, 350.00, NULL, 0, 0, 9.00),
  (UUID(), 'Edge Gold (Plaster) 1 inch', 'EDGE-GOLD-1IN', 'Edge', 'Gold (Plaster)', NULL, '1 inch', 'weight', 'yard', NULL, NULL, 50, 400.00, NULL, 0, 0, 13.00),
  (UUID(), 'Edge Gold (Plaster) 1.5 inches', 'EDGE-GOLD-15IN', 'Edge', 'Gold (Plaster)', NULL, '1.5 inches', 'weight', 'yard', NULL, NULL, 50, 500.00, NULL, 0, 0, 15.00),
  (UUID(), 'Edge Gold (Plaster) 2 inches', 'EDGE-GOLD-2IN', 'Edge', 'Gold (Plaster)', NULL, '2 inches', 'weight', 'yard', NULL, NULL, 50, 630.00, NULL, 0, 0, 18.00),
  (UUID(), 'Edge Gold (Plaster) 2.5 inches', 'EDGE-GOLD-25IN', 'Edge', 'Gold (Plaster)', NULL, '2.5 inches', 'weight', 'yard', NULL, NULL, 50, 670.00, NULL, 0, 0, 19.00),
  (UUID(), 'PVC Veneer', 'PVC-VENEER', 'Veneer', NULL, NULL, NULL, 'weight', 'yard', NULL, NULL, 50, 600.00, NULL, 0, 0, 13.00)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `category` = VALUES(`category`),
  `brand` = VALUES(`brand`),
  `color` = VALUES(`color`),
  `size` = VALUES(`size`),
  `unit_type` = VALUES(`unit_type`),
  `unit_of_measure` = VALUES(`unit_of_measure`),
  `unit_cost` = VALUES(`unit_cost`),
  `bundle_yards` = VALUES(`bundle_yards`),
  `bundle_price` = VALUES(`bundle_price`),
  `cut_size_mm` = VALUES(`cut_size_mm`),
  `unit_price` = VALUES(`unit_price`);