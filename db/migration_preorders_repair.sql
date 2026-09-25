-- ============================================================
-- Repair migration for Pre-Orders columns
-- Safe to run even if some or all of these columns already exist --
-- each ADD COLUMN IF NOT EXISTS silently skips anything already there,
-- so this won't error out partway through like a plain ALTER TABLE
-- might have if the earlier migration only partially applied.
-- ============================================================

ALTER TABLE `sales_orders`
  ADD COLUMN IF NOT EXISTS `customer_phone` VARCHAR(50) NULL AFTER `customer_name`,
  ADD COLUMN IF NOT EXISTS `is_preorder` TINYINT(1) NOT NULL DEFAULT 0 AFTER `customer_phone`,
  ADD COLUMN IF NOT EXISTS `fulfillment_method` ENUM('pickup', 'delivery') NOT NULL DEFAULT 'pickup' AFTER `is_preorder`,
  ADD COLUMN IF NOT EXISTS `delivery_address` TEXT NULL AFTER `fulfillment_method`,
  ADD COLUMN IF NOT EXISTS `deposit_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER `delivery_address`,
  ADD COLUMN IF NOT EXISTS `amount_paid` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER `deposit_amount`;

-- Verify afterwards -- you should see all six of these listed:
DESCRIBE `sales_orders`;
