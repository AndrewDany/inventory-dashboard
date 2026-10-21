-- Import inventory items and stock levels from LIST 10.xlsx.
-- Repeated orange-pad sizes use separate SKUs per price tier.
-- Re-running this script sets quantities and prices to the spreadsheet values.

START TRANSACTION;

INSERT INTO `inventory_items` (
  `id`, `name`, `sku`, `category`, `type`, `brand`, `color`, `size`,
  `unit_type`, `quantity`, `unit_cost`, `unit_price`, `created_at`, `last_updated`
) VALUES
  (UUID(), 'HINGES 2" BRASS', 'HINGE-2IN-BRASS', 'HINGES', 'Hinge', NULL, 'Brass', '2 inch', 'unit', 10, 3.00, 5.00, NOW(), NOW()),
  (UUID(), 'HINGES 2.5" BRASS', 'HINGE-2.5IN-BRASS', 'HINGES', 'Hinge', NULL, 'Brass', '2.5 inch', 'unit', 28, 4.00, 6.00, NOW(), NOW()),
  (UUID(), 'HINGES 3" BRASS', 'HINGE-3IN-BRASS', 'HINGES', 'Hinge', NULL, 'Brass', '3 inch', 'unit', 33, 5.00, 7.00, NOW(), NOW()),
  (UUID(), 'HINGES 4" BRASS', 'HINGE-4IN-BRASS', 'HINGES', 'Hinge', NULL, 'Brass', '4 inch', 'unit', 34, 7.00, 10.00, NOW(), NOW()),
  (UUID(), 'HINGES 2" SILVER', 'HINGE-2IN-SILVER', 'HINGES', 'Hinge', NULL, 'Silver', '2 inch', 'unit', 43, 3.00, 5.00, NOW(), NOW()),
  (UUID(), 'HINGES 2.5" SILVER', 'HINGE-2.5IN-SILVER', 'HINGES', 'Hinge', NULL, 'Silver', '2.5 inch', 'unit', 34, 4.00, 6.00, NOW(), NOW()),
  (UUID(), 'HINGES 3" SILVER', 'HINGE-3IN-SILVER', 'HINGES', 'Hinge', NULL, 'Silver', '3 inch', 'unit', 1, 5.00, 7.00, NOW(), NOW()),
  (UUID(), 'HINGES 4" SILVER', 'HINGE-4IN-SILVER', 'HINGES', 'Hinge', NULL, 'Silver', '4 inch', 'unit', 34, 7.00, 10.00, NOW(), NOW()),
  (UUID(), 'SAND PAPER GREEN 5" P120', 'SAND-PAPER-GREEN-5IN-P120', 'SANDPAPER', 'Sand Paper', NULL, 'Green', '5 inch P120', 'unit', 120, 2.00, 3.00, NOW(), NOW()),
  (UUID(), 'SAND PAPER GREEN 5" P80', 'SAND-PAPER-GREEN-5IN-P80', 'SANDPAPER', 'Sand Paper', NULL, 'Green', '5 inch P80', 'unit', 436, 2.00, 3.00, NOW(), NOW()),
  (UUID(), 'SAND PAPER GREEN 5" P60', 'SAND-PAPER-GREEN-5IN-P60', 'SANDPAPER', 'Sand Paper', NULL, 'Green', '5 inch P60', 'unit', 179, 2.00, 3.00, NOW(), NOW()),
  (UUID(), 'SAND PAPER GREEN 6" P60', 'SAND-PAPER-GREEN-6IN-P60', 'SANDPAPER', 'Sand Paper', NULL, 'Green', '6 inch P60', 'unit', 210, 3.00, 4.00, NOW(), NOW()),
  (UUID(), 'SAND PAPER GREEN 6" P80', 'SAND-PAPER-GREEN-6IN-P80', 'SANDPAPER', 'Sand Paper', NULL, 'Green', '6 inch P80', 'unit', 246, 3.00, 4.00, NOW(), NOW()),
  (UUID(), 'SAND PAPER GREEN 6" P120', 'SAND-PAPER-GREEN-6IN-P120', 'SANDPAPER', 'Sand Paper', NULL, 'Green', '6 inch P120', 'unit', 162, 3.00, 4.00, NOW(), NOW()),
  (UUID(), 'SAND PAPER GREEN 7" P120', 'SAND-PAPER-GREEN-7IN-P120', 'SANDPAPER', 'Sand Paper', NULL, 'Green', '7 inch P120', 'unit', 80, 3.00, 4.00, NOW(), NOW()),
  (UUID(), 'SAND PAPER GREEN 7" P80', 'SAND-PAPER-GREEN-7IN-P80', 'SANDPAPER', 'Sand Paper', NULL, 'Green', '7 inch P80', 'unit', 275, 3.00, 4.00, NOW(), NOW()),
  (UUID(), 'SAND PAPER GREEN 7" P60', 'SAND-PAPER-GREEN-7IN-P60', 'SANDPAPER', 'Sand Paper', NULL, 'Green', '7 inch P60', 'unit', 30, 3.00, 4.00, NOW(), NOW()),
  (UUID(), 'SAND PAPER BROWN 7" P120', 'SAND-PAPER-BROWN-7IN-P120', 'SANDPAPER', 'Sand Paper', NULL, 'Brown', '7 inch P120', 'unit', 220, 1.50, 2.50, NOW(), NOW()),
  (UUID(), 'SAND PAPER BROWN 7" P240', 'SAND-PAPER-BROWN-7IN-P240', 'SANDPAPER', 'Sand Paper', NULL, 'Brown', '7 inch P240', 'unit', 220, 1.50, 2.50, NOW(), NOW()),
  (UUID(), 'SAND PAPER BROWN 7" P60', 'SAND-PAPER-BROWN-7IN-P60', 'SANDPAPER', 'Sand Paper', NULL, 'Brown', '7 inch P60', 'unit', 10, 1.50, 2.50, NOW(), NOW()),
  (UUID(), 'SAND PAPER BROWN 7" P40', 'SAND-PAPER-BROWN-7IN-P40', 'SANDPAPER', 'Sand Paper', NULL, 'Brown', '7 inch P40', 'unit', 60, 1.50, 2.50, NOW(), NOW()),
  (UUID(), 'SAND PAPER BROWN 6" P80', 'SAND-PAPER-BROWN-6IN-P80', 'SANDPAPER', 'Sand Paper', NULL, 'Brown', '6 inch P80', 'unit', 20, 1.50, 2.50, NOW(), NOW()),
  (UUID(), 'SAND PAPER BROWN 6" P120', 'SAND-PAPER-BROWN-6IN-P120', 'SANDPAPER', 'Sand Paper', NULL, 'Brown', '6 inch P120', 'unit', 40, 1.50, 2.50, NOW(), NOW()),
  (UUID(), 'SAND PAPER BROWN 5" P80', 'SAND-PAPER-BROWN-5IN-P80', 'SANDPAPER', 'Sand Paper', NULL, 'Brown', '5 inch P80', 'unit', 30, 1.50, 2.50, NOW(), NOW()),
  (UUID(), 'SAND PAPER PAD ORANGE 7" (COST 63)', 'SAND-PAPER-PAD-ORANGE-7IN-C63-S68', 'SANDPAPER', 'Sand Paper Pad', NULL, 'Orange', '7 inch', 'unit', 8, 63.00, 68.00, NOW(), NOW()),
  (UUID(), 'SAND PAPER PAD ORANGE 6" (COST 53)', 'SAND-PAPER-PAD-ORANGE-6IN-C53-S58', 'SANDPAPER', 'Sand Paper Pad', NULL, 'Orange', '6 inch', 'unit', 15, 53.00, 58.00, NOW(), NOW()),
  (UUID(), 'SAND PAPER PAD ORANGE 5" (COST 45)', 'SAND-PAPER-PAD-ORANGE-5IN-C45-S50', 'SANDPAPER', 'Sand Paper Pad', NULL, 'Orange', '5 inch', 'unit', 3, 45.00, 50.00, NOW(), NOW()),
  (UUID(), 'SAND PAPER PAD ORANGE 5" (COST 20)', 'SAND-PAPER-PAD-ORANGE-5IN-C20-S25', 'SANDPAPER', 'Sand Paper Pad', NULL, 'Orange', '5 inch', 'unit', 1, 20.00, 25.00, NOW(), NOW()),
  (UUID(), 'SAND PAPER PAD ORANGE 6" (COST 25)', 'SAND-PAPER-PAD-ORANGE-6IN-C25-S30', 'SANDPAPER', 'Sand Paper Pad', NULL, 'Orange', '6 inch', 'unit', 13, 25.00, 30.00, NOW(), NOW()),
  (UUID(), 'SAND PAPER PAD ORANGE 7" (COST 30)', 'SAND-PAPER-PAD-ORANGE-7IN-C30-S35', 'SANDPAPER', 'Sand Paper Pad', NULL, 'Orange', '7 inch', 'unit', 13, 30.00, 35.00, NOW(), NOW()),
  (UUID(), 'SCREW DRIVER 4"', 'SCREW-DRIVER-4IN', 'TOOLS', 'Screw Driver', NULL, NULL, '4 inch', 'unit', 156, 10.00, 13.00, NOW(), NOW()),
  (UUID(), 'SCREW DRIVER 6"', 'SCREW-DRIVER-6IN', 'TOOLS', 'Screw Driver', NULL, NULL, '6 inch', 'unit', 108, 12.00, 15.00, NOW(), NOW()),
  (UUID(), 'REFLECTORS VAULTEX ORANGE', 'REFLECTOR-VAULTEX-ORANGE', 'SAFETY PRODUCT', 'Reflector', 'Vaultex', 'Orange', NULL, 'unit', 9, 25.00, 30.00, NOW(), NOW()),
  (UUID(), 'REFLECTORS VAULTEX GREEN', 'REFLECTOR-VAULTEX-GREEN', 'SAFETY PRODUCT', 'Reflector', 'Vaultex', 'Green', NULL, 'unit', 5, 25.00, 30.00, NOW(), NOW()),
  (UUID(), 'REFLECTORS 3M ORANGE/GREEN', 'REFLECTOR-3M-ORANGE-GREEN', 'SAFETY PRODUCT', 'Reflector', '3M', 'Orange/Green', NULL, 'unit', 5, 65.00, 70.00, NOW(), NOW()),
  (UUID(), 'REFLECTORS GREEN/BLUE', 'REFLECTOR-GREEN-BLUE', 'SAFETY PRODUCT', 'Reflector', NULL, 'Green/Blue', NULL, 'unit', 10, 55.00, 60.00, NOW(), NOW()),
  (UUID(), 'REFLECTOR LACOSTE YELLOW LONG', 'REFLECTOR-LACOSTE-YELLOW-LONG', 'SAFETY PRODUCT', 'Reflector', 'Lacoste', 'Yellow', 'Long', 'unit', 2, 120.00, 130.00, NOW(), NOW()),
  (UUID(), 'REFLECTOR LACOSTE ORANGE LONG', 'REFLECTOR-LACOSTE-ORANGE-LONG', 'SAFETY PRODUCT', 'Reflector', 'Lacoste', 'Orange', 'Long', 'unit', 2, 120.00, 135.00, NOW(), NOW()),
  (UUID(), 'REFLECTOR LACOSTE GREEN LONG', 'REFLECTOR-LACOSTE-GREEN-LONG', 'SAFETY PRODUCT', 'Reflector', 'Lacoste', 'Green', 'Long', 'unit', 2, 120.00, 135.00, NOW(), NOW()),
  (UUID(), 'REFLECTOR LACOSTE ORANGE SHORT', 'REFLECTOR-LACOSTE-ORANGE-SHORT', 'SAFETY PRODUCT', 'Reflector', 'Lacoste', 'Orange', 'Short', 'unit', 4, 120.00, 130.00, NOW(), NOW()),
  (UUID(), 'REFLECTOR LACOSTE GREEN SHORT', 'REFLECTOR-LACOSTE-GREEN-SHORT', 'SAFETY PRODUCT', 'Reflector', 'Lacoste', 'Green', 'Short', 'unit', 7, 120.00, 130.00, NOW(), NOW()),
  (UUID(), 'HELMET ORANGE', 'HELMET-ORANGE', 'SAFETY PRODUCT', 'Helmet', NULL, 'Orange', NULL, 'unit', 5, 50.00, 55.00, NOW(), NOW()),
  (UUID(), 'HELMET GREEN', 'HELMET-GREEN', 'SAFETY PRODUCT', 'Helmet', NULL, 'Green', NULL, 'unit', 10, 50.00, 55.00, NOW(), NOW()),
  (UUID(), 'HELMET YELLOW', 'HELMET-YELLOW', 'SAFETY PRODUCT', 'Helmet', NULL, 'Yellow', NULL, 'unit', 10, 50.00, 55.00, NOW(), NOW()),
  (UUID(), 'HELMET WHITE', 'HELMET-WHITE', 'SAFETY PRODUCT', 'Helmet', NULL, 'White', NULL, 'unit', 10, 50.00, 55.00, NOW(), NOW()),
  (UUID(), 'HELMET RED', 'HELMET-RED', 'SAFETY PRODUCT', 'Helmet', NULL, 'Red', NULL, 'unit', 10, 50.00, 55.00, NOW(), NOW()),
  (UUID(), 'HELMET BLUE', 'HELMET-BLUE', 'SAFETY PRODUCT', 'Helmet', NULL, 'Blue', NULL, 'unit', 10, 50.00, 55.00, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `category` = VALUES(`category`),
  `type` = VALUES(`type`),
  `brand` = VALUES(`brand`),
  `color` = VALUES(`color`),
  `size` = VALUES(`size`),
  `unit_type` = VALUES(`unit_type`),
  `quantity` = VALUES(`quantity`),
  `unit_cost` = VALUES(`unit_cost`),
  `unit_price` = VALUES(`unit_price`),
  `last_updated` = NOW();

COMMIT;
