-- Merge the duplicate SEMIGLOSS product into the canonical SEMI-GLOSS SKU.
-- Back up the database before running this migration through phpMyAdmin.

START TRANSACTION;

SET @canonical_sku = 'LAM-18MM-SEMI-GLOSS-OFF-WHITE';
SET @duplicate_sku = 'LAM-18MM-SEMIGLOSS-OFF-WHITE';
SET @canonical_id = (
  SELECT `id` FROM `inventory_items` WHERE `sku` = @canonical_sku LIMIT 1
);
SET @duplicate_id = (
  SELECT `id` FROM `inventory_items` WHERE `sku` = @duplicate_sku LIMIT 1
);

UPDATE `inventory_items` AS canonical
JOIN `inventory_items` AS duplicate ON duplicate.`id` = @duplicate_id
SET canonical.`quantity` = canonical.`quantity` + duplicate.`quantity`,
    canonical.`last_updated` = NOW()
WHERE canonical.`id` = @canonical_id
  AND @duplicate_id IS NOT NULL;

UPDATE `inventory_batches`
SET `sku` = @canonical_sku,
    `inventory_item_id` = @canonical_id
WHERE @canonical_id IS NOT NULL
  AND @duplicate_id IS NOT NULL
  AND (`sku` = @duplicate_sku OR `inventory_item_id` = @duplicate_id);

UPDATE `inventory_adjustments`
SET `sku` = @canonical_sku,
    `inventory_item_id` = @canonical_id
WHERE @canonical_id IS NOT NULL
  AND @duplicate_id IS NOT NULL
  AND (`sku` = @duplicate_sku OR `inventory_item_id` = @duplicate_id);

UPDATE `purchase_order_items`
SET `sku` = @canonical_sku,
    `inventory_item_id` = @canonical_id
WHERE @canonical_id IS NOT NULL
  AND @duplicate_id IS NOT NULL
  AND (`sku` = @duplicate_sku OR `inventory_item_id` = @duplicate_id);

UPDATE `sales_order_items`
SET `sku` = @canonical_sku,
    `inventory_item_id` = @canonical_id
WHERE @canonical_id IS NOT NULL
  AND @duplicate_id IS NOT NULL
  AND (`sku` = @duplicate_sku OR `inventory_item_id` = @duplicate_id);

UPDATE `returns`
SET `sku` = @canonical_sku,
    `inventory_item_id` = @canonical_id
WHERE @canonical_id IS NOT NULL
  AND @duplicate_id IS NOT NULL
  AND (`sku` = @duplicate_sku OR `inventory_item_id` = @duplicate_id);

UPDATE `stock_movements`
SET `item_id` = @canonical_id
WHERE @canonical_id IS NOT NULL
  AND @duplicate_id IS NOT NULL
  AND `item_id` = @duplicate_id;

UPDATE `activity_logs`
SET `entity_id` = @canonical_id
WHERE @canonical_id IS NOT NULL
  AND @duplicate_id IS NOT NULL
  AND `entity_id` = @duplicate_id;

UPDATE `audit_events`
SET `sku` = @canonical_sku,
    `entity_id` = IF(`entity_id` = @duplicate_id, @canonical_id, `entity_id`)
WHERE @canonical_id IS NOT NULL
  AND @duplicate_id IS NOT NULL
  AND (`sku` = @duplicate_sku OR `entity_id` = @duplicate_id);

DELETE FROM `inventory_items`
WHERE `id` = @duplicate_id
  AND @canonical_id IS NOT NULL;

COMMIT;

SELECT `id`, `name`, `sku`, `quantity`
FROM `inventory_items`
WHERE `sku` IN (@canonical_sku, @duplicate_sku);