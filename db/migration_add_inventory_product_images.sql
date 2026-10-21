-- Add optional image URLs to inventory products.

SET @image_url_column_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'inventory_items'
    AND COLUMN_NAME = 'image_url'
);

SET @image_url_ddl = IF(
  @image_url_column_exists = 0,
  'ALTER TABLE `inventory_items` ADD COLUMN `image_url` VARCHAR(500) NULL AFTER `size`',
  'SELECT 1'
);

PREPARE image_url_stmt FROM @image_url_ddl;
EXECUTE image_url_stmt;
DEALLOCATE PREPARE image_url_stmt;