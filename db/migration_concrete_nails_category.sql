-- ============================================================
-- Migration: Insert Concrete Nails under "CONCRETE NAILS" category
-- All nails are placed under "CONCRETE NAILS" (uppercase) so that
-- searching "CONCRETE NAILS" or "concrete nails" returns every variant.
-- ============================================================

START TRANSACTION;

-- Rename any existing items under old category names to the canonical uppercase
UPDATE `inventory_items`
SET    `category` = 'CONCRETE NAILS'
WHERE  `category` IN ('Nails', 'Concrete Nails', 'concrete nails');

-- Insert concrete nail bundles (ON DUPLICATE KEY updates category & price)
INSERT INTO `inventory_items` (
  `id`, `name`, `sku`, `category`, `brand`, `size`, `unit_type`,
  `unit_of_measure`, `units_per_box`, `unit_cost`, `bundle_yards`,
  `bundle_price`, `cut_size_mm`, `quantity`, `reorder_level`, `unit_price`
) VALUES
  (UUID(), 'Concrete Nails 1 inch - Small Bundle',    'CONCRETE-NAILS-1IN',   'CONCRETE NAILS', NULL, '1 inch',     'box', NULL, 50, NULL, NULL, NULL, NULL, 500, 0, 5.00),
  (UUID(), 'Concrete Nails 1.5 inches - Small Bundle','CONCRETE-NAILS-1.5IN', 'CONCRETE NAILS', NULL, '1.5 inches', 'box', NULL, 25, NULL, NULL, NULL, NULL, 200, 0, 5.00),
  (UUID(), 'Concrete Nails 2 inches - Small Bundle',  'CONCRETE-NAILS-2IN',   'CONCRETE NAILS', NULL, '2 inches',   'box', NULL, 20, NULL, NULL, NULL, NULL, 180, 0, 5.00),
  (UUID(), 'Concrete Nails 2.5 inches - Small Bundle','CONCRETE-NAILS-2.5IN', 'CONCRETE NAILS', NULL, '2.5 inches', 'box', NULL, 15, NULL, NULL, NULL, NULL,  90, 0, 5.00),
  (UUID(), 'Concrete Nails 3 inches - Small Bundle',  'CONCRETE-NAILS-3IN',   'CONCRETE NAILS', NULL, '3 inches',   'box', NULL, 10, NULL, NULL, NULL, NULL,  70, 0, 5.00),
  (UUID(), 'Concrete Nails 4 inches - Small Bundle',  'CONCRETE-NAILS-4IN',   'CONCRETE NAILS', NULL, '4 inches',   'box', NULL, 10, NULL, NULL, NULL, NULL,  60, 0, 5.00)
ON DUPLICATE KEY UPDATE
  `category`      = 'CONCRETE NAILS',
  `units_per_box` = VALUES(`units_per_box`),
  `unit_price`    = VALUES(`unit_price`),
  `name`          = VALUES(`name`),
  `size`          = VALUES(`size`);

COMMIT;
