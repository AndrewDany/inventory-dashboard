-- ============================================================
-- Migration: Insert Laminated & Block Board products
-- All laminated variants are stored under "LAMINATED" category
-- so searching "LAMINATED" returns every size/finish/colour.
-- Block board goes under "BLOCK BOARD" for its own search.
-- Run this via phpMyAdmin on the production database.
-- ============================================================

START TRANSACTION;

-- -------------------------------------------------------
-- 1. Normalise any existing laminated categories to the
--    canonical names (in case partial entries exist)
-- -------------------------------------------------------
UPDATE `inventory_items`
SET `category` = 'LAMINATED'
WHERE `category` IN (
  '18MM LAMINATED GL', '18MM LAMINATED MA', '18MM LAMINATED SE',
  '18MM LAMINATED GLOSSY', '18MM LAMINATED MATT', '18MM LAMINATED SEMI-GLOSS',
  '18MM LAMINATED SEMI GLOSS', '18MM LAMINATED SEMIGLOSS',
  '4MM LAMINATED', 'Laminated', 'laminated'
);

UPDATE `inventory_items`
SET `category` = 'BLOCK BOARD'
WHERE `category` IN (
  '17MM BLOCK BOARD', '17MM BLOCK BOARD', 'Block Board', 'BLOCKBOARD'
);

-- -------------------------------------------------------
-- 2. Insert / upsert all laminated items
-- -------------------------------------------------------
INSERT INTO `inventory_items` (
  `id`, `name`, `sku`, `category`, `color`, `size`, `type`, `unit_type`,
  `quantity`, `reorder_level`, `unit_cost`, `unit_price`, `created_at`, `last_updated`
) VALUES
  -- 18mm Laminated Matt
  (UUID(), '18mm Laminated Matt CP100 Chocolate Brown', 'LAM-18MM-MATT-CP100-CBROWN',   'LAMINATED', 'Chocolate Brown', '18mm', 'Matt',      'unit', 28, 5, 430.00, 450.00, NOW(), NOW()),
  (UUID(), '18mm Laminated Matt Dark Grey',              'LAM-18MM-MATT-DARK-GREY',       'LAMINATED', 'Dark Grey',       '18mm', 'Matt',      'unit', 45, 5, 430.00, 450.00, NOW(), NOW()),
  (UUID(), '18mm Laminated Matt X09 Brown',              'LAM-18MM-MATT-X09-BROWN',       'LAMINATED', 'Brown',           '18mm', 'Matt',      'unit', 11, 5, 430.00, 450.00, NOW(), NOW()),
  (UUID(), '18mm Laminated Matt Off White',              'LAM-18MM-MATT-OFF-WHITE',       'LAMINATED', 'Off White',       '18mm', 'Matt',      'unit',  1, 5, 430.00, 450.00, NOW(), NOW()),
  -- 18mm Laminated Semi-Gloss
  (UUID(), '18mm Laminated Semi-Gloss Off White',        'LAM-18MM-SEMI-GLOSS-OFF-WHITE', 'LAMINATED', 'Off White',       '18mm', 'Semi-Gloss','unit', 49, 5, 430.00, 450.00, NOW(), NOW()),
  -- 18mm Laminated Glossy
  (UUID(), '18mm Laminated Glossy Off White',            'LAM-18MM-GLOSSY-OFF-WHITE',     'LAMINATED', 'Off White',       '18mm', 'Glossy',    'unit',  4, 5, 560.00, 590.00, NOW(), NOW()),
  -- 4mm Laminated
  (UUID(), '4mm Laminated Off White',                    'LAM-4MM-OFF-WHITE',             'LAMINATED', 'Off White',       '4mm',  NULL,        'unit', 41, 5, 155.00, 170.00, NOW(), NOW()),
  (UUID(), '4mm Laminated Red',                          'LAM-4MM-RED',                   'LAMINATED', 'Red',             '4mm',  NULL,        'unit',  4, 5, 155.00, 170.00, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  `category`   = VALUES(`category`),
  `color`       = VALUES(`color`),
  `size`        = VALUES(`size`),
  `type`        = VALUES(`type`),
  `quantity`    = VALUES(`quantity`),
  `unit_cost`   = VALUES(`unit_cost`),
  `unit_price`  = VALUES(`unit_price`),
  `last_updated`= NOW();

-- -------------------------------------------------------
-- 3. Insert / upsert block board items
-- -------------------------------------------------------
INSERT INTO `inventory_items` (
  `id`, `name`, `sku`, `category`, `color`, `size`, `type`, `unit_type`,
  `quantity`, `reorder_level`, `unit_cost`, `unit_price`, `created_at`, `last_updated`
) VALUES
  (UUID(), '17mm Block Board Light Grey', 'BLOCK-17MM-LIGHT-GREY',  'BLOCK BOARD', 'Light Grey', '17mm', NULL, 'unit', 11, 5, 400.00, 430.00, NOW(), NOW()),
  (UUID(), '17mm Block Board Off White',  'BLOCK-17MM-OFF-WHITE',   'BLOCK BOARD', 'Off White',  '17mm', NULL, 'unit', 50, 5, 400.00, 430.00, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  `category`   = VALUES(`category`),
  `color`       = VALUES(`color`),
  `size`        = VALUES(`size`),
  `quantity`    = VALUES(`quantity`),
  `unit_cost`   = VALUES(`unit_cost`),
  `unit_price`  = VALUES(`unit_price`),
  `last_updated`= NOW();

-- -------------------------------------------------------
-- 4. Create initial inventory batches for FIFO tracking
-- -------------------------------------------------------
INSERT INTO `inventory_batches` (`id`, `sku`, `inventory_item_id`, `batch_code`, `initial_quantity`, `on_hand_quantity`, `unit_cost`, `received_date`)
SELECT
  UUID(), i.sku, i.id, CONCAT('BATCH-INIT-', i.sku), i.quantity, i.quantity, i.unit_cost, NOW()
FROM `inventory_items` i
WHERE i.`sku` IN (
  'LAM-18MM-MATT-CP100-CBROWN', 'LAM-18MM-MATT-DARK-GREY', 'LAM-18MM-MATT-X09-BROWN',
  'LAM-18MM-MATT-OFF-WHITE', 'LAM-18MM-SEMI-GLOSS-OFF-WHITE', 'LAM-18MM-GLOSSY-OFF-WHITE',
  'LAM-4MM-OFF-WHITE', 'LAM-4MM-RED',
  'BLOCK-17MM-LIGHT-GREY', 'BLOCK-17MM-OFF-WHITE'
)
AND NOT EXISTS (
  SELECT 1 FROM `inventory_batches` b WHERE b.`inventory_item_id` = i.`id`
);

COMMIT;

