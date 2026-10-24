-- Enable customer credit accounts, payment history, and due-date tracking.
-- Run once after migration_customers.sql and migration_preorders.sql.

ALTER TABLE `customers`
  ADD COLUMN `credit_limit` DECIMAL(12, 2) NOT NULL DEFAULT 0.00;

ALTER TABLE `sales_orders`
  ADD COLUMN `customer_id` VARCHAR(36) NULL AFTER `customer_phone`,
  ADD COLUMN `due_date` DATE NULL AFTER `amount_paid`,
  ADD KEY `idx_so_customer` (`customer_id`),
  ADD KEY `idx_so_due_date` (`due_date`);

CREATE TABLE IF NOT EXISTS `sales_order_payments` (
  `id` VARCHAR(36) NOT NULL,
  `so_id` VARCHAR(36) NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `payment_method` VARCHAR(100) NOT NULL DEFAULT 'Cash',
  `received_by` VARCHAR(255) NULL,
  `paid_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sop_so_id` (`so_id`),
  KEY `idx_sop_paid_at` (`paid_at`),
  CONSTRAINT `fk_sop_so` FOREIGN KEY (`so_id`) REFERENCES `sales_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Link sales made after customer verification to their customer record.
UPDATE `sales_orders` so
JOIN `customers` c
  ON REPLACE(REPLACE(REPLACE(REPLACE(so.customer_phone, '+', ''), ' ', ''), '-', ''), '(', '') = c.phone
SET so.customer_id = c.id
WHERE so.customer_id IS NULL AND so.customer_phone IS NOT NULL;
