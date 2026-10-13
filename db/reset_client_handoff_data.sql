-- Destructive client handoff reset.
-- Preserves users/profiles, locations, suppliers, budgets, and settings.
-- Clears the inventory catalog and operational history for a fresh product/stock import.

START TRANSACTION;

DELETE FROM `sales_order_items`;
DELETE FROM `sales_orders`;
DELETE FROM `purchase_order_items`;
DELETE FROM `purchase_orders`;
DELETE FROM `returns`;
DELETE FROM `expenses`;
DELETE FROM `inventory_adjustments`;
DELETE FROM `inventory_batches`;
DELETE FROM `stock_movements`;
DELETE FROM `audit_events`;
DELETE FROM `activity_logs`;
DELETE FROM `notifications`;
DELETE FROM `customers`;
DELETE FROM `inventory_items`;

COMMIT;
