-- ============================================================
-- Migration: Fix sales_orders missing columns for Credit Sales
-- Fixes: Unknown column 'so.customer_id' in 'where clause'
-- Run via phpMyAdmin on the production database.
-- Safe to re-run: uses IF NOT EXISTS / conditional ALTER.
-- ============================================================

-- -------------------------------------------------------
-- 1. Add missing columns to sales_orders
-- -------------------------------------------------------

-- customer_id (FK to customers table)
SET @exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales_orders' AND COLUMN_NAME = 'customer_id');
SET @sql = IF(@exists = 0,
    'ALTER TABLE `sales_orders` ADD COLUMN `customer_id` VARCHAR(36) NULL AFTER `customer_phone`',
    'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- due_date (for credit sales repayment date)
SET @exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales_orders' AND COLUMN_NAME = 'due_date');
SET @sql = IF(@exists = 0,
    'ALTER TABLE `sales_orders` ADD COLUMN `due_date` DATE NULL AFTER `amount_paid`',
    'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- is_preorder (needed by pre-order flow)
SET @exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales_orders' AND COLUMN_NAME = 'is_preorder');
SET @sql = IF(@exists = 0,
    'ALTER TABLE `sales_orders` ADD COLUMN `is_preorder` TINYINT(1) NOT NULL DEFAULT 0 AFTER `customer_id`',
    'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- fulfillment_method
SET @exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales_orders' AND COLUMN_NAME = 'fulfillment_method');
SET @sql = IF(@exists = 0,
    "ALTER TABLE `sales_orders` ADD COLUMN `fulfillment_method` ENUM('pickup','delivery') NOT NULL DEFAULT 'pickup' AFTER `is_preorder`",
    'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- delivery_address
SET @exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales_orders' AND COLUMN_NAME = 'delivery_address');
SET @sql = IF(@exists = 0,
    'ALTER TABLE `sales_orders` ADD COLUMN `delivery_address` TEXT NULL AFTER `fulfillment_method`',
    'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- deposit_amount
SET @exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales_orders' AND COLUMN_NAME = 'deposit_amount');
SET @sql = IF(@exists = 0,
    'ALTER TABLE `sales_orders` ADD COLUMN `deposit_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `delivery_address`',
    'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- amount_paid
SET @exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales_orders' AND COLUMN_NAME = 'amount_paid');
SET @sql = IF(@exists = 0,
    'ALTER TABLE `sales_orders` ADD COLUMN `amount_paid` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `deposit_amount`',
    'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- updated_at
SET @exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales_orders' AND COLUMN_NAME = 'updated_at');
SET @sql = IF(@exists = 0,
    'ALTER TABLE `sales_orders` ADD COLUMN `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- -------------------------------------------------------
-- 2. Add missing columns to sales_order_items
-- -------------------------------------------------------

-- sale_unit (yard / bundle / unit / cut)
SET @exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales_order_items' AND COLUMN_NAME = 'sale_unit');
SET @sql = IF(@exists = 0,
    'ALTER TABLE `sales_order_items` ADD COLUMN `sale_unit` VARCHAR(30) NULL AFTER `unit_price`',
    'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- unit_cost (for COGS/financials tracking)
SET @exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales_order_items' AND COLUMN_NAME = 'unit_cost');
SET @sql = IF(@exists = 0,
    'ALTER TABLE `sales_order_items` ADD COLUMN `unit_cost` DECIMAL(12,2) NULL AFTER `sale_unit`',
    'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- -------------------------------------------------------
-- 3. Create sales_order_payments table if missing
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sales_order_payments` (
  `id`             VARCHAR(36)   NOT NULL,
  `so_id`          VARCHAR(36)   NOT NULL,
  `amount`         DECIMAL(12,2) NOT NULL,
  `payment_method` VARCHAR(100)  NOT NULL DEFAULT 'Cash',
  `received_by`    VARCHAR(255)  NULL,
  `paid_at`        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sop_so_id` (`so_id`),
  KEY `idx_sop_paid_at` (`paid_at`),
  CONSTRAINT `fk_sop_so` FOREIGN KEY (`so_id`) REFERENCES `sales_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- 4. Add index on customer_id if it doesn't exist
-- -------------------------------------------------------
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales_orders' AND INDEX_NAME = 'idx_so_customer');
SET @sql = IF(@idx_exists = 0,
    'ALTER TABLE `sales_orders` ADD INDEX `idx_so_customer` (`customer_id`)',
    'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales_orders' AND INDEX_NAME = 'idx_so_due_date');
SET @sql = IF(@idx_exists = 0,
    'ALTER TABLE `sales_orders` ADD INDEX `idx_so_due_date` (`due_date`)',
    'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

