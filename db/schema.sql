-- ============================================================
-- Inventory Suite - Complete MySQL Database Schema (InnoDB)
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+ (cPanel / phpMyAdmin)
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- ------------------------------------------------------------
-- 1. Users & Authentication
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'staff', 'demo') NOT NULL DEFAULT 'staff',
  `status` ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `profiles` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL UNIQUE,
  `full_name` VARCHAR(255) NULL,
  `avatar_url` TEXT NULL,
  `location_id` VARCHAR(36) NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. Locations & Suppliers
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `locations` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `address` TEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `suppliers` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `contact_email` VARCHAR(255) NULL,
  `phone` VARCHAR(100) NULL,
  `address` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. Inventory Items Catalog
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventory_items` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `sku` VARCHAR(100) NOT NULL UNIQUE,
  `category` VARCHAR(100) NULL,
  `unit_type` ENUM('unit', 'box', 'weight') NOT NULL DEFAULT 'unit',
  `unit_of_measure` VARCHAR(50) NULL,
  `units_per_box` INT NULL DEFAULT NULL,
  `quantity` INT NOT NULL DEFAULT 0,
  `reorder_level` INT NOT NULL DEFAULT 0,
  `unit_price` DECIMAL(12, 2) NULL DEFAULT 0.00,
  `supplier` VARCHAR(255) NULL,
  `location_id` VARCHAR(36) NULL,
  `last_updated` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_inventory_sku` (`sku`),
  KEY `idx_inventory_category` (`category`),
  KEY `idx_inventory_location` (`location_id`),
  CONSTRAINT `fk_inventory_location` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 4. Stock Movements Audit
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stock_movements` (
  `id` VARCHAR(36) NOT NULL,
  `item_id` VARCHAR(36) NULL,
  `item_name` VARCHAR(255) NOT NULL,
  `change_amount` INT NOT NULL,
  `reason` VARCHAR(255) NULL,
  `location_id` VARCHAR(36) NULL,
  `user_email` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_movements_item` (`item_id`),
  KEY `idx_movements_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 5. FIFO Batches
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventory_batches` (
  `id` VARCHAR(36) NOT NULL,
  `sku` VARCHAR(100) NOT NULL,
  `inventory_item_id` VARCHAR(36) NULL,
  `batch_code` VARCHAR(100) NOT NULL,
  `initial_quantity` INT NOT NULL DEFAULT 0,
  `on_hand_quantity` INT NOT NULL DEFAULT 0,
  `unit_cost` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `expiry_date` DATE NULL,
  `received_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_batches_sku` (`sku`),
  KEY `idx_batches_on_hand` (`on_hand_quantity`),
  KEY `idx_batches_received` (`received_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 6. Inventory Adjustments
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventory_adjustments` (
  `id` VARCHAR(36) NOT NULL,
  `adjustment_number` VARCHAR(100) NOT NULL UNIQUE,
  `status` VARCHAR(50) NOT NULL DEFAULT 'completed',
  `inventory_item_id` VARCHAR(36) NULL,
  `sku` VARCHAR(100) NOT NULL,
  `location_id` VARCHAR(36) NOT NULL,
  `quantity_delta` INT NOT NULL,
  `reason` ENUM('manual_add', 'manual_remove', 'cycle_count', 'write_off', 'other') NOT NULL,
  `notes` TEXT NULL,
  `created_by` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_adjustments_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 7. Purchase Orders (Procurement)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `purchase_orders` (
  `id` VARCHAR(36) NOT NULL,
  `po_number` VARCHAR(100) NOT NULL UNIQUE,
  `supplier_id` VARCHAR(36) NULL,
  `status` ENUM('draft', 'ordered', 'received', 'cancelled') NOT NULL DEFAULT 'ordered',
  `notes` TEXT NULL,
  `created_by` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_po_supplier` (`supplier_id`),
  KEY `idx_po_status` (`status`),
  CONSTRAINT `fk_po_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `purchase_order_items` (
  `id` VARCHAR(36) NOT NULL,
  `po_id` VARCHAR(36) NOT NULL,
  `sku` VARCHAR(100) NOT NULL,
  `inventory_item_id` VARCHAR(36) NULL,
  `quantity_ordered` INT NOT NULL,
  `quantity_received` INT NOT NULL DEFAULT 0,
  `unit_cost` DECIMAL(12, 2) NULL DEFAULT 0.00,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'GHC',
  PRIMARY KEY (`id`),
  KEY `idx_poi_po_id` (`po_id`),
  CONSTRAINT `fk_poi_po` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 8. Sales Orders & Point of Sale
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sales_orders` (
  `id` VARCHAR(36) NOT NULL,
  `so_number` VARCHAR(100) NOT NULL UNIQUE,
  `status` ENUM('draft', 'confirmed', 'shipped', 'cancelled') NOT NULL DEFAULT 'confirmed',
  `notes` TEXT NULL,
  `customer_name` VARCHAR(255) NULL,
  `customer_phone` VARCHAR(50) NULL,
  `is_preorder` TINYINT(1) NOT NULL DEFAULT 0,
  `fulfillment_method` ENUM('pickup', 'delivery') NOT NULL DEFAULT 'pickup',
  `delivery_address` TEXT NULL,
  `deposit_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `amount_paid` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `created_by` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_so_status` (`status`),
  KEY `idx_so_preorder` (`is_preorder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sales_order_items` (
  `id` VARCHAR(36) NOT NULL,
  `so_id` VARCHAR(36) NOT NULL,
  `sku` VARCHAR(100) NOT NULL,
  `inventory_item_id` VARCHAR(36) NULL,
  `quantity_ordered` INT NOT NULL,
  `quantity_shipped` INT NOT NULL DEFAULT 0,
  `unit_price` DECIMAL(12, 2) NULL DEFAULT 0.00,
  `unit_cost` DECIMAL(12, 2) NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'GHC',
  PRIMARY KEY (`id`),
  KEY `idx_soi_so_id` (`so_id`),
  CONSTRAINT `fk_soi_so` FOREIGN KEY (`so_id`) REFERENCES `sales_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 9. Returns & Replacements
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `returns` (
  `id` VARCHAR(36) NOT NULL,
  `return_number` VARCHAR(100) NOT NULL UNIQUE,
  `return_type` ENUM('customer_return', 'damaged_stock', 'supplier_return') NOT NULL,
  `inventory_item_id` VARCHAR(36) NULL,
  `sku` VARCHAR(100) NOT NULL,
  `location_id` VARCHAR(36) NOT NULL,
  `quantity` INT NOT NULL,
  `unit_cost` DECIMAL(12, 2) NULL DEFAULT 0.00,
  `refund_amount` DECIMAL(12, 2) NULL DEFAULT 0.00,
  `refund_amount_estimated` TINYINT(1) NOT NULL DEFAULT 0,
  `reason` ENUM('damaged', 'defective', 'wrong_item', 'expired', 'other') NOT NULL,
  `resolution` ENUM('replace', 'refund', 'restock', 'write_off', 'supplier_credit') NOT NULL,
  `status` ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  `reference_so_id` VARCHAR(36) NULL,
  `supplier_id` VARCHAR(36) NULL,
  `customer_name` VARCHAR(255) NULL,
  `notes` TEXT NULL,
  `created_by` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  KEY `idx_returns_status` (`status`),
  KEY `idx_returns_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 10. Expenses & Financial Controls
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` VARCHAR(36) NOT NULL,
  `date` DATE NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `payment_method` VARCHAR(100) NULL,
  `vendor` VARCHAR(255) NULL,
  `receipt_url` TEXT NULL,
  `created_by` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_expenses_date` (`date`),
  KEY `idx_expenses_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `budget_settings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `monthly_budget` DECIMAL(12, 2) NOT NULL DEFAULT 50000.00,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 11. Activity Logs, Audit Trail & System Settings
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NULL,
  `user_email` VARCHAR(255) NULL,
  `action` VARCHAR(255) NOT NULL,
  `item_name` VARCHAR(255) NULL,
  `entity_type` VARCHAR(100) NULL,
  `entity_id` VARCHAR(100) NULL,
  `details` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_activity_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `audit_events` (
  `id` VARCHAR(36) NOT NULL,
  `event_type` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(100) NULL,
  `entity_id` VARCHAR(100) NULL,
  `sku` VARCHAR(100) NULL,
  `quantity_delta` INT NULL DEFAULT 0,
  `unit_cost` DECIMAL(12, 2) NULL DEFAULT 0.00,
  `actor_user_email` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_created` (`created_at`),
  KEY `idx_audit_sku` (`sku`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('info', 'warning', 'danger', 'success') NOT NULL DEFAULT 'info',
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `system_settings` (
  `key` VARCHAR(100) NOT NULL,
  `value` TEXT NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
