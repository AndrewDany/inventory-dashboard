-- ============================================================
-- Migration: add unit_cost to sales_order_items
-- This column stores the real weighted-average cost captured at the
-- moment of sale (Fulfill / POS checkout), used by financials.php's
-- COGS_SUBQUERY for accurate margin reporting. Safe to re-run --
-- skips silently if the column already exists.
-- ============================================================

ALTER TABLE `sales_order_items`
  ADD COLUMN IF NOT EXISTS `unit_cost` DECIMAL(12, 2) NULL AFTER `unit_price`;

DESCRIBE `sales_order_items`;
