-- Merge the spaced and unspaced sandpaper categories.

START TRANSACTION;

UPDATE `inventory_items`
SET `category` = 'SANDPAPER'
WHERE UPPER(REPLACE(TRIM(COALESCE(`category`, '')), ' ', '')) = 'SANDPAPER';

COMMIT;
