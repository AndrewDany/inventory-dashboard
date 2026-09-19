-- ============================================================
-- Migration: Add Pre-Order support to sales_orders
-- Run this once against your EXISTING database (the one you already
-- set up) via MySQL Workbench or phpMyAdmin. Do NOT re-run schema.sql
-- from scratch -- that would wipe your data. This migration only
-- adds new columns; nothing existing is touched or removed.
-- ============================================================

ALTER TABLE `sales_orders`
  ADD COLUMN `customer_phone` VARCHAR(50) NULL AFTER `customer_name`,
  ADD COLUMN `is_preorder` TINYINT(1) NOT NULL DEFAULT 0 AFTER `customer_phone`,
  ADD COLUMN `fulfillment_method` ENUM('pickup', 'delivery') NOT NULL DEFAULT 'pickup' AFTER `is_preorder`,
  ADD COLUMN `delivery_address` TEXT NULL AFTER `fulfillment_method`,
  ADD COLUMN `deposit_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER `delivery_address`,
  ADD COLUMN `amount_paid` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER `deposit_amount`,
  ADD KEY `idx_so_preorder` (`is_preorder`);
