-- Customer verification registry. Run once in MySQL Workbench.
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(36) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(10) NOT NULL UNIQUE,
  email VARCHAR(255) NULL,
  delivery_address TEXT NULL,
  first_purchase_at DATETIME NULL,
  last_purchase_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_customers_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;