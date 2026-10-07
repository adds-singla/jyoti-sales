-- ==========================================================================
-- Additional demo/example products — added as a new migration rather than
-- editing V1 (already-applied migrations should never be modified).
-- ==========================================================================

-- Televisions
INSERT INTO products (name, slug, sku, category_id, brand, description, price, mrp, stock, featured, specs_json)
SELECT 'TCL 43" QLED Smart TV', 'tcl-43-qled-smart-tv-tv-tcl-43-qled', 'TV-TCL-43-QLED', id, 'TCL',
 'Quantum dot colour technology with Android TV for a huge streaming app library.', 27990, 34990, 16, FALSE,
 '{"Screen Size":"43 inch","Resolution":"4K QLED","Smart Platform":"Android TV","HDMI Ports":"3","Warranty":"1 Year"}'
FROM categories WHERE slug = 'smart-tvs';

-- Refrigerators
INSERT INTO products (name, slug, sku, category_id, brand, description, price, mrp, stock, featured, specs_json)
SELECT 'Godrej 236L 3 Star Frost Free Refrigerator', 'godrej-236l-3-star-frost-free-refrigerator-fr-god-236', 'FR-GOD-236', id, 'Godrej',
 'Turbo cooling technology and anti-bacterial gasket for a cleaner, fresher fridge.', 23990, 28990, 13, TRUE,
 '{"Capacity":"236 Litre","Type":"Double Door","Star Rating":"3 Star","Warranty":"1 Year Product + 10 Year Compressor"}'
FROM categories WHERE slug = 'refrigerators';

-- Washing Machines
INSERT INTO products (name, slug, sku, category_id, brand, description, price, mrp, stock, featured, specs_json)
SELECT 'Bosch 7Kg Fully Automatic Front Load Washing Machine', 'bosch-7kg-fully-automatic-front-load-washing-machine-wm-bosch-7fl', 'WM-BOSCH-7FL', id, 'Bosch',
 'EcoSilence Drive motor for quiet, energy-efficient washing with a 4-year motor warranty.', 29990, 36990, 9, FALSE,
 '{"Capacity":"7 Kg","Type":"Front Load","Speed":"1000 RPM","Warranty":"2 Year Product + 4 Year Motor"}'
FROM categories WHERE slug = 'washing-machines';

-- Small Kitchen Appliances
INSERT INTO products (name, slug, sku, category_id, brand, description, price, mrp, stock, featured, specs_json)
SELECT 'Morphy Richards 3L Stainless Steel Electric Kettle', 'morphy-richards-3l-stainless-steel-electric-kettle-ka-mr-3lk', 'KA-MR-3LK', id, 'Morphy Richards',
 'Rapid boil element with auto shut-off and boil-dry protection.', 1790, 2290, 50, FALSE,
 '{"Capacity":"3 Litre","Power":"2200 Watt","Warranty":"2 Year"}'
FROM categories WHERE slug = 'small-kitchen-appliances';

-- Audio
INSERT INTO products (name, slug, sku, category_id, brand, description, price, mrp, stock, featured, specs_json)
SELECT 'boAt Rockerz 450 Wireless Headphones', 'boat-rockerz-450-wireless-headphones-au-boat-rz450', 'AU-BOAT-RZ450', id, 'boAt',
 '40mm dynamic drivers with up to 15 hours of playback on a single charge.', 1499, 2999, 60, TRUE,
 '{"Battery Life":"15 Hours","Driver Size":"40mm","Connectivity":"Bluetooth 5.0","Warranty":"1 Year"}'
FROM categories WHERE slug = 'audio';

-- ---------- images for the new products ----------
INSERT INTO product_images (product_id, url, display_order, "primary")
SELECT id, 'https://placehold.co/800x800/F0E9DE/3B2E5A?text=' || REPLACE(brand, ' ', '+'), 0, TRUE
FROM products
WHERE sku IN ('TV-TCL-43-QLED', 'FR-GOD-236', 'WM-BOSCH-7FL', 'KA-MR-3LK', 'AU-BOAT-RZ450');
