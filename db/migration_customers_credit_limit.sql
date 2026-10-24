-- ============================================================
-- Migration: Add credit_limit column to customers table
-- Fixes: SQLSTATE[42S22] Unknown column 'c.credit_limit'
-- Run via phpMyAdmin on the production database.
-- ============================================================

-- Add credit_limit if it does not already exist
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'customers'
      AND COLUMN_NAME  = 'credit_limit'
);

SET @sql = IF(
    @col_exists = 0,
    'ALTER TABLE `customers` ADD COLUMN `credit_limit` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `delivery_address`',
    'SELECT 1 -- credit_limit already exists, nothing to do'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

