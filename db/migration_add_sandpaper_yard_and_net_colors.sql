-- Add Sand Paper Yard and mosquito net color variants.
-- Consolidate all net products under the canonical NETS category.

START TRANSACTION;

UPDATE `inventory_items`
SET `category` = 'NETS'
WHERE UPPER(TRIM(COALESCE(`category`, ''))) IN ('NET', 'NETS')
   OR LOWER(COALESCE(`name`, '')) LIKE '%net%';

INSERT INTO `inventory_items` (
  `id`, `name`, `sku`, `category`, `type`, `brand`, `color`, `size`,
  `unit_type`, `unit_of_measure`, `units_per_box`, `unit_cost`,
  `bundle_yards`, `bundle_price`, `bundle_cost`, `cut_size_mm`,
  `quantity`, `reorder_level`, `unit_price`, `supplier`, `location_id`,
  `created_at`, `last_updated`
)
SELECT
  UUID(), CONCAT('Mosquito Net - ', variants.`color`), variants.`sku`, 'NETS',
  source.`type`, source.`brand`, variants.`color`, source.`size`,
  source.`unit_type`, source.`unit_of_measure`, source.`units_per_box`, source.`unit_cost`,
  source.`bundle_yards`, source.`bundle_price`, source.`bundle_cost`, source.`cut_size_mm`,
  0, source.`reorder_level`, source.`unit_price`, source.`supplier`, NULL,
  NOW(), NOW()
FROM `inventory_items` source
CROSS JOIN (
  SELECT 'Blue' AS `color`, 'MOSQUITO-NET-BLUE' AS `sku`
  UNION ALL
  SELECT 'Green', 'MOSQUITO-NET-GREEN'
) AS variants
WHERE source.`sku` = 'MOSQUITO-NET'
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `category` = 'NETS',
  `type` = VALUES(`type`),
  `brand` = VALUES(`brand`),
  `color` = VALUES(`color`),
  `size` = VALUES(`size`),
  `unit_type` = VALUES(`unit_type`),
  `unit_of_measure` = VALUES(`unit_of_measure`),
  `unit_cost` = VALUES(`unit_cost`),
  `bundle_yards` = VALUES(`bundle_yards`),
  `bundle_price` = VALUES(`bundle_price`),
  `bundle_cost` = VALUES(`bundle_cost`),
  `unit_price` = VALUES(`unit_price`),
  `last_updated` = NOW();

INSERT INTO `inventory_items` (
  `id`, `name`, `sku`, `category`, `unit_type`, `unit_of_measure`,
  `quantity`, `reorder_level`, `unit_cost`, `unit_price`, `created_at`, `last_updated`
) VALUES (
  UUID(), 'SAND PAPER YARD', 'SAND-PAPER-YARD', 'SANDPAPER', 'weight', 'yard',
  0, 0, NULL, NULL, NOW(), NOW()
)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `category` = 'SANDPAPER',
  `unit_type` = 'weight',
  `unit_of_measure` = 'yard',
  `last_updated` = NOW();

COMMIT;