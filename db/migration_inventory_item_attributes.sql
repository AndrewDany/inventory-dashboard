-- ============================================================
-- Migration: Add type, brand, color, size to inventory_items
-- ============================================================

ALTER TABLE `inventory_items`
  ADD COLUMN `type` VARCHAR(100) NULL AFTER `category`,
  ADD COLUMN `brand` VARCHAR(100) NULL AFTER `type`,
  ADD COLUMN `color` VARCHAR(50) NULL AFTER `brand`,
  ADD COLUMN `size` VARCHAR(50) NULL AFTER `color`;
