-- ==========================================================================
-- Jyoti Sales — initial schema + seed data
-- ==========================================================================

-- ---------- users ----------
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    full_name       VARCHAR(255) NOT NULL,
    email           VARCHAR(255) UNIQUE,
    phone           VARCHAR(20) UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(30) NOT NULL DEFAULT 'ROLE_CUSTOMER',
    blocked         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------- addresses ----------
CREATE TABLE addresses (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label           VARCHAR(50),
    recipient_name  VARCHAR(255),
    phone           VARCHAR(20),
    line1           VARCHAR(255) NOT NULL,
    line2           VARCHAR(255),
    city            VARCHAR(100) NOT NULL,
    state           VARCHAR(100) NOT NULL,
    pincode         VARCHAR(10) NOT NULL,
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------- categories ----------
CREATE TABLE categories (
    id                BIGSERIAL PRIMARY KEY,
    name              VARCHAR(150) NOT NULL UNIQUE,
    slug              VARCHAR(150) NOT NULL UNIQUE,
    banner_image_url  VARCHAR(500),
    display_order     INTEGER NOT NULL DEFAULT 0,
    parent_id         BIGINT REFERENCES categories(id),
    created_at        TIMESTAMP NOT NULL DEFAULT now(),
    updated_at        TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------- products ----------
CREATE TABLE products (
    id               BIGSERIAL PRIMARY KEY,
    name             VARCHAR(255) NOT NULL,
    slug             VARCHAR(300) NOT NULL UNIQUE,
    sku              VARCHAR(100) NOT NULL UNIQUE,
    category_id      BIGINT NOT NULL REFERENCES categories(id),
    brand            VARCHAR(100),
    description      VARCHAR(4000),
    price            NUMERIC(12,2) NOT NULL,
    mrp              NUMERIC(12,2) NOT NULL,
    stock            INTEGER NOT NULL DEFAULT 0,
    rating_average   DOUBLE PRECISION DEFAULT 0,
    rating_count     INTEGER DEFAULT 0,
    featured         BOOLEAN NOT NULL DEFAULT FALSE,
    active           BOOLEAN NOT NULL DEFAULT TRUE,
    specs_json       TEXT DEFAULT '{}',
    created_at       TIMESTAMP NOT NULL DEFAULT now(),
    updated_at       TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_active ON products(active);

-- ---------- product_images ----------
CREATE TABLE product_images (
    id             BIGSERIAL PRIMARY KEY,
    product_id     BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url            VARCHAR(500) NOT NULL,
    display_order  INTEGER NOT NULL DEFAULT 0,
    "primary"      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMP NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------- product_variants ----------
CREATE TABLE product_variants (
    id             BIGSERIAL PRIMARY KEY,
    product_id     BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_type   VARCHAR(50) NOT NULL,
    variant_value  VARCHAR(100) NOT NULL,
    price_delta    NUMERIC(12,2) NOT NULL DEFAULT 0,
    stock          INTEGER NOT NULL DEFAULT 0,
    sku            VARCHAR(100),
    created_at     TIMESTAMP NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------- reviews ----------
CREATE TABLE reviews (
    id                 BIGSERIAL PRIMARY KEY,
    product_id         BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id            BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating             INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title              VARCHAR(255),
    body               VARCHAR(2000),
    verified_purchase  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at         TIMESTAMP NOT NULL DEFAULT now(),
    updated_at         TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE review_photos (
    review_id   BIGINT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    photo_url   VARCHAR(500)
);

-- ---------- carts ----------
CREATE TABLE carts (
    id                    BIGSERIAL PRIMARY KEY,
    user_id               BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    applied_coupon_code   VARCHAR(50),
    created_at            TIMESTAMP NOT NULL DEFAULT now(),
    updated_at            TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE cart_items (
    id           BIGSERIAL PRIMARY KEY,
    cart_id      BIGINT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id   BIGINT NOT NULL REFERENCES products(id),
    variant_id   BIGINT REFERENCES product_variants(id),
    quantity     INTEGER NOT NULL DEFAULT 1,
    created_at   TIMESTAMP NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------- wishlist ----------
CREATE TABLE wishlist_items (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id   BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at   TIMESTAMP NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (user_id, product_id)
);

-- ---------- coupons ----------
CREATE TABLE coupons (
    id               BIGSERIAL PRIMARY KEY,
    code             VARCHAR(50) NOT NULL UNIQUE,
    discount_type    VARCHAR(20) NOT NULL,
    discount_value   NUMERIC(12,2) NOT NULL,
    min_order_value  NUMERIC(12,2) DEFAULT 0,
    expires_at       TIMESTAMP,
    usage_limit      INTEGER,
    usage_count      INTEGER DEFAULT 0,
    active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP NOT NULL DEFAULT now(),
    updated_at       TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------- banners ----------
CREATE TABLE banners (
    id             BIGSERIAL PRIMARY KEY,
    title          VARCHAR(255) NOT NULL,
    subtitle       VARCHAR(255),
    image_url      VARCHAR(500) NOT NULL,
    link_url       VARCHAR(500),
    display_order  INTEGER NOT NULL DEFAULT 0,
    starts_at      TIMESTAMP,
    ends_at        TIMESTAMP,
    active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------- orders ----------
CREATE TABLE orders (
    id                      BIGSERIAL PRIMARY KEY,
    order_number            VARCHAR(50) NOT NULL UNIQUE,
    user_id                 BIGINT NOT NULL REFERENCES users(id),
    status                  VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    subtotal                NUMERIC(12,2) NOT NULL,
    discount                NUMERIC(12,2) DEFAULT 0,
    shipping_fee            NUMERIC(12,2) DEFAULT 0,
    total                   NUMERIC(12,2) NOT NULL,
    coupon_code             VARCHAR(50),
    recipient_name          VARCHAR(255),
    phone                   VARCHAR(20),
    line1                   VARCHAR(255),
    line2                   VARCHAR(255),
    city                    VARCHAR(100),
    state                   VARCHAR(100),
    pincode                 VARCHAR(10),
    created_at              TIMESTAMP NOT NULL DEFAULT now(),
    updated_at              TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

CREATE TABLE order_items (
    id                     BIGSERIAL PRIMARY KEY,
    order_id               BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id             BIGINT NOT NULL REFERENCES products(id),
    variant_id             BIGINT REFERENCES product_variants(id),
    product_name_snapshot  VARCHAR(255) NOT NULL,
    quantity               INTEGER NOT NULL,
    unit_price             NUMERIC(12,2) NOT NULL,
    created_at             TIMESTAMP NOT NULL DEFAULT now(),
    updated_at             TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------- payments ----------
CREATE TABLE payments (
    id                   BIGSERIAL PRIMARY KEY,
    order_id             BIGINT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    method               VARCHAR(20) NOT NULL,
    status               VARCHAR(20) NOT NULL DEFAULT 'INITIATED',
    amount               NUMERIC(12,2) NOT NULL,
    provider             VARCHAR(30) NOT NULL,
    provider_reference   VARCHAR(100),
    failure_reason       VARCHAR(1000),
    created_at           TIMESTAMP NOT NULL DEFAULT now(),
    updated_at           TIMESTAMP NOT NULL DEFAULT now()
);

-- ==========================================================================
-- SEED DATA
-- ==========================================================================

-- Admin user: admin@jyotisales.in / Admin@123  (CHANGE THIS PASSWORD AFTER FIRST LOGIN)
INSERT INTO users (full_name, email, phone, password_hash, role) VALUES
('Jyoti Sales Admin', 'admin@jyotisales.in', '9999900000', '$2b$10$XD/4VfDH/kFGmKddGI.3t.A9ZSr814JuXUOMK/QzG3Cl1cjW7hy9i', 'ROLE_ADMIN');

-- Demo customer: customer@example.com / Customer@123
INSERT INTO users (full_name, email, phone, password_hash, role) VALUES
('Demo Customer', 'customer@example.com', '9888800000', '$2b$10$4yOefe418YhzLIC3aKGd7.tGrl4hy69UdwexKDyTrJea8CHWrqAFi', 'ROLE_CUSTOMER');

INSERT INTO carts (user_id) SELECT id FROM users WHERE email = 'admin@jyotisales.in';
INSERT INTO carts (user_id) SELECT id FROM users WHERE email = 'customer@example.com';

INSERT INTO addresses (user_id, label, recipient_name, phone, line1, line2, city, state, pincode, is_default)
SELECT id, 'Home', 'Demo Customer', '9888800000', 'House No. 123, Model Town', 'Near Bus Stand', 'Rampura Phul', 'Punjab', '151103', TRUE
FROM users WHERE email = 'customer@example.com';

-- ---------- categories ----------
INSERT INTO categories (name, slug, display_order) VALUES
('Televisions', 'televisions', 1),
('Air Conditioners', 'air-conditioners', 2),
('Refrigerators', 'refrigerators', 3),
('Washing Machines', 'washing-machines', 4),
('Microwaves', 'microwaves', 5),
('Coolers', 'coolers', 6),
('Small Kitchen Appliances', 'small-kitchen-appliances', 7),
('Audio', 'audio', 8);

-- subcategories (Televisions)
INSERT INTO categories (name, slug, display_order, parent_id)
SELECT 'LED TVs', 'led-tvs', 1, id FROM categories WHERE slug = 'televisions';
INSERT INTO categories (name, slug, display_order, parent_id)
SELECT 'Smart TVs', 'smart-tvs', 2, id FROM categories WHERE slug = 'televisions';

-- ---------- products (~28 items across all categories) ----------

-- Televisions
INSERT INTO products (name, slug, sku, category_id, brand, description, price, mrp, stock, featured, specs_json)
SELECT 'LG 55" 4K UHD Smart LED TV', 'lg-55-4k-uhd-smart-led-tv-tv-lg-55-4k', 'TV-LG-55-4K', id, 'LG',
 'Crisp 4K UHD picture quality with WebOS smart platform, ideal for movies and sports.', 46990, 62990, 12, TRUE,
 '{"Screen Size":"55 inch","Resolution":"4K UHD (3840x2160)","Smart Platform":"WebOS","HDMI Ports":"3","Warranty":"1 Year Comprehensive + 1 Year Panel"}'
FROM categories WHERE slug = 'smart-tvs';

INSERT INTO products (name, slug, sku, category_id, brand, description, price, mrp, stock, featured, specs_json)
SELECT 'Samsung 43" Crystal 4K Smart TV', 'samsung-43-crystal-4k-smart-tv-tv-sam-43-cr', 'TV-SAM-43-CR', id, 'Samsung',
 'Crystal processor 4K with vibrant colour and Tizen smart platform.', 32990, 42990, 20, TRUE,
 '{"Screen Size":"43 inch","Resolution":"4K UHD","Smart Platform":"Tizen","HDMI Ports":"3","Warranty":"1 Year"}'
FROM categories WHERE slug = 'smart-tvs';

INSERT INTO products (name, slug, sku, category_id, brand, description, price, mrp, stock, specs_json)
SELECT 'Sony Bravia 65" OLED TV', 'sony-bravia-65-oled-tv-tv-sony-65-oled', 'TV-SONY-65-OLED', id, 'Sony',
 'Studio-grade OLED contrast with Cognitive Processor XR for lifelike picture.', 149990, 189990, 5,
 '{"Screen Size":"65 inch","Resolution":"4K OLED","Smart Platform":"Google TV","HDMI Ports":"4","Warranty":"1 Year"}'
FROM categories WHERE slug = 'smart-tvs';

INSERT INTO products (name, slug, sku, category_id, brand, description, price, mrp, stock, specs_json)
SELECT 'LG 32" HD Ready LED TV', 'lg-32-hd-ready-led-tv-tv-lg-32-hd', 'TV-LG-32-HD', id, 'LG',
 'Compact and reliable HD LED TV, great for bedrooms and second rooms.', 13990, 17990, 30,
 '{"Screen Size":"32 inch","Resolution":"HD Ready","HDMI Ports":"2","Warranty":"1 Year"}'
FROM categories WHERE slug = 'led-tvs';

INSERT INTO products (name, slug, sku, category_id, brand, description, price, mrp, stock, specs_json)
SELECT 'Mi 50" 4K Smart TV X Series', 'mi-50-4k-smart-tv-x-series-tv-mi-50-4k', 'TV-MI-50-4K', id, 'Mi',
 'Google TV with Dolby Vision and 30W speakers for immersive viewing.', 34999, 44999, 15,
 '{"Screen Size":"50 inch","Resolution":"4K UHD","Smart Platform":"Google TV","Warranty":"1 Year"}'
FROM categories WHERE slug = 'smart-tvs';

-- Air Conditioners
INSERT INTO products (name, slug, sku, category_id, brand, description, price, mrp, stock, featured, specs_json)
SELECT 'Voltas 1.5 Ton 3 Star Split AC', 'voltas-1-5-ton-3-star-split-ac-ac-vol-15-3s', 'AC-VOL-15-3S', id, 'Voltas',
 'Copper condenser split AC with fast cooling and dust filter.', 33990, 41990, 18, TRUE,
 '{"Capacity":"1.5 Ton","Star Rating":"3 Star","Compressor":"Rotary","Condenser":"Copper","Warranty":"1 Year Product + 5 Year Compressor"}'
FROM categories WHERE slug = 'air-conditioners';

INSERT INTO products (name, slug, sku, category_id, brand, description, price, mrp, stock, specs_json)
SELECT 'LG 1 Ton 5 Star Inverter Split AC', 'lg-1-ton-5-star-inverter-split-ac-ac-lg-1-5s', 'AC-LG-1-5S', id, 'LG',
 'Dual inverter compressor for energy savings and ultra-quiet operation.', 38990, 47990, 14,
 '{"Capacity":"1 Ton","Star Rating":"5 Star","Compressor":"Dual Inverter","Warranty":"1 Year Product + 10 Year Compressor"}'
FROM categories WHERE slug = 'air-conditioners';

INSERT INTO products (name, slug, sku, category_id, brand, description, price, mrp, stock, specs_json)
SELECT 'Whirlpool 1.5 Ton 4 Star Split AC', 'whirlpool-1-5-ton-4-star-split-ac-ac-whp-15-4s', 'AC-WHP-15-4S', id, 'Whirlpool',
 'IntelliSense inverter technology with 6th Sense fast cooling.', 36990, 45990, 10,
 '{"Capacity":"1.5 Ton","Star Rating":"4 Star","Compressor":"Inverter","Warranty":"1 Year Product + 10 Year Compressor"}'
FROM categories WHERE slug = 'air-conditioners';

INSERT INTO products (name, slug, sku, category_id, brand, description, price, mrp, stock, specs_json)
SELECT 'Samsung 2 Ton 3 Star Windfree AC', 'samsung-2-ton-3-star-windfree-ac-ac-sam-2-3s', 'AC-SAM-2-3S', id, 'Samsung',
 'Windfree cooling technology spreads air through 21,000 micro air holes.', 47990, 58990, 8,
 '{"Capacity":"2 Ton","Star Rating":"3 Star","Compressor":"Inverter","Warranty":"1 Year Product + 10 Year Compressor"}'
FROM categories WHERE slug = 'air-conditioners';

-- Refrigerators
INSERT INTO products (name, slug, sku, category_id, brand, description, price, mrp, stock, featured, specs_json)
SELECT 'Samsung 253L 3 Star Double Door Refrigerator', 'samsung-253l-3-star-double-door-refrigerator-fr-sam-253', 'FR-SAM-253', id, 'Samsung',
 'Digital inverter compressor with convertible freezer for flexible storage.', 27990, 34990, 16, TRUE,
 '{"Capacity":"253 Litre","Type":"Double Door","Star Rating":"3 Star","Warranty":"1 Year Product + 20 Year Compressor"}'
FROM categories WHERE slug = 'refrigerators';

INSERT INTO products (name, slug, sku, category_id, brand, description, price, mrp, stock, specs_json)
SELECT 'LG 190L 4 Star Direct Cool Single Door Refrigerator', 'lg-190l-4-star-direct-cool-single-door-refrigerator-fr-lg-190', 'FR-LG-190', id, 'LG',
 'Smart inverter compressor keeps food fresher for longer with lower noise.', 16990, 20990, 22,
 '{"Capacity":"190 Litre","Type":"Single Door","Star Rating":"4 Star","Warranty":"1 Year Product + 10 Year Compressor"}'
FROM categories WHERE slug = 'refrigerators';

INSERT INTO products (name, slug, sku, category_id, brand, description, price, mrp, stock, specs_json)
SELECT 'Whirlpool 340L Frost Free Triple Door Refrigerator', 'whirlpool-340l-frost-free-triple-door-refrigerator-fr-whp-340', 'FR-WHP-340', id, 'Whirlpool',
 'IntelliSense inverter with zero-crowding flow air technology.', 34990, 42990, 9,
 '{"Capacity":"340 Litre","Type":"Triple Door","Star Rating":"3 Star","Warranty":"1 Year Product + 10 Year Compressor"}'
FROM categories WHERE slug = 'refrigerators';

INSERT INTO products (name, slug, sku, category_id, brand, description, price, mrp, stock, specs_json)
SELECT 'Haier 195L Direct Cool Refrigerator', 'haier-195l-direct-cool-refrigerator-fr-haier-195', 'FR-HAIER-195', id, 'Haier',
 'Toughened glass shelves and stabiliser-free operation.', 15990, 19990, 20,
 '{"Capacity":"195 Litre","Type":"Single Door","Star Rating":"3 Star","Warranty":"1 Year"}'
FROM categories WHERE slug = 'refrigerators';

-- Washing Machines
INSERT INTO products (name, slug, sku, category_id, brand, description, price, mrp, stock, featured, specs_json)
SELECT 'IFB 7Kg Fully Automatic Front Load Washing Machine', 'ifb-7kg-fully-automatic-front-load-washing-machine-wm-ifb-7fl', 'WM-IFB-7FL', id, 'IFB',
 'Aqua Energie technology with 2X power steam wash for tough stains.', 32990, 39990, 11, TRUE,
 '{"Capacity":"7 Kg","Type":"Front Load","Speed":"1000 RPM","Warranty":"2 Year Product + 10 Year Motor"}'
FROM categories WHERE slug = 'washing-machines';

INSERT INTO products (name, slug, sku, category_id, brand, description, price, mrp, stock, specs_json)
SELECT 'LG 7Kg Fully Automatic Top Load Washing Machine', 'lg-7kg-fully-automatic-top-load-washing-machine-wm-lg-7tl', 'WM-LG-7TL', id, 'LG',
 'Smart inverter motor with 6 motion direct drive for gentle, efficient wash.', 18990, 23990, 17,
 '{"Capacity":"7 Kg","Type":"Top Load","Warranty":"2 Year Product + 10 Year Motor"}'
FROM categories WHERE slug = 'washing-machines';

INSERT INTO products (name, slug, sku, category_id, brand, description, price, mrp, stock, specs_json)
SELECT 'Whirlpool 6.5Kg Semi Automatic Washing Machine', 'whirlpool-6-5kg-semi-automatic-washing-machine-wm-whp-65sa', 'WM-WHP-65SA', id, 'Whirlpool',
 'Scrubber ball technology for better washing performance.', 10990, 13990, 25,
 '{"Capacity":"6.5 Kg","Type":"Semi Automatic","Warranty":"2 Year"}'
FROM categories WHERE slug = 'washing-machines';

INSERT INTO products (name, slug, sku, category_id, brand, description, price, mrp, stock, specs_json)
SELECT 'Samsung 8Kg Fully Automatic Front Load Washing Machine', 'samsung-8kg-fully-automatic-front-load-washing-machine-wm-sam-8fl', 'WM-SAM-8FL', id, 'Samsung',
 'Ecobubble technology dissolves detergent quickly for a deep clean.', 35990, 43990, 7,
 '{"Capacity":"8 Kg","Type":"Front Load","Speed":"1400 RPM","Warranty":"2 Year Product + 10 Year Motor"}'
FROM categories WHERE slug = 'washing-machines';

-- Microwaves
INSERT INTO products (name, slug, sku, category_id, brand, description, price, mrp, stock, specs_json)
SELECT 'IFB 20L Convection Microwave Oven', 'ifb-20l-convection-microwave-oven-mw-ifb-20c', 'MW-IFB-20C', id, 'IFB',
 'Auto cook menus and convection baking in one compact microwave.', 10990, 13990, 19,
 '{"Capacity":"20 Litre","Type":"Convection","Warranty":"1 Year"}'
FROM categories WHERE slug = 'microwaves';

INSERT INTO products (name, slug, sku, category_id, brand, description, price, mrp, stock, specs_json)
SELECT 'Samsung 23L Convection Microwave Oven', 'samsung-23l-convection-microwave-oven-mw-sam-23c', 'MW-SAM-23C', id, 'Samsung',
 'Slim fry technology for healthier fried food with less oil.', 12990, 15990, 14,
 '{"Capacity":"23 Litre","Type":"Convection","Warranty":"1 Year"}'
FROM categories WHERE slug = 'microwaves';

INSERT INTO products (name, slug, sku, category_id, brand, description, price, mrp, stock, specs_json)
SELECT 'LG 28L Charcoal Convection Microwave Oven', 'lg-28l-charcoal-convection-microwave-oven-mw-lg-28c', 'MW-LG-28C', id, 'LG',
 'Charcoal heater for even, healthier cooking with diet fry.', 15990, 19990, 12,
 '{"Capacity":"28 Litre","Type":"Charcoal Convection","Warranty":"1 Year"}'
FROM categories WHERE slug = 'microwaves';

-- Coolers
INSERT INTO products (name, slug, sku, category_id, brand, description, price, mrp, stock, specs_json)
SELECT 'Symphony Diet 22L Air Cooler', 'symphony-diet-22l-air-cooler-cl-sym-22', 'CL-SYM-22', id, 'Symphony',
 'i-Pure technology and compact design, ideal for personal cooling.', 6990, 8990, 28,
 '{"Tank Capacity":"22 Litre","Type":"Personal Cooler","Warranty":"1 Year"}'
FROM categories WHERE slug = 'coolers';

INSERT INTO products (name, slug, sku, category_id, brand, description, price, mrp, stock, specs_json)
SELECT 'Voltas 50L Desert Air Cooler', 'voltas-50l-desert-air-cooler-cl-vol-50', 'CL-VOL-50', id, 'Voltas',
 'High-density honeycomb pads and powerful air throw for large rooms.', 11990, 14990, 15,
 '{"Tank Capacity":"50 Litre","Type":"Desert Cooler","Warranty":"1 Year"}'
FROM categories WHERE slug = 'coolers';

-- Small Kitchen Appliances
INSERT INTO products (name, slug, sku, category_id, brand, description, price, mrp, stock, specs_json)
SELECT 'Prestige 750W Mixer Grinder', 'prestige-750w-mixer-grinder-ka-pre-750mg', 'KA-PRE-750MG', id, 'Prestige',
 '3 stainless steel jars with powerful 750W motor.', 3290, 3990, 40,
 '{"Power":"750 Watt","Jars":"3","Warranty":"2 Year"}'
FROM categories WHERE slug = 'small-kitchen-appliances';

INSERT INTO products (name, slug, sku, category_id, brand, description, price, mrp, stock, specs_json)
SELECT 'Philips Air Fryer HD9200', 'philips-air-fryer-hd9200-ka-phi-af9200', 'KA-PHI-AF9200', id, 'Philips',
 'Rapid Air technology for healthier fried food with up to 90% less fat.', 7990, 9990, 20,
 '{"Capacity":"4.1 Litre","Power":"1400 Watt","Warranty":"2 Year"}'
FROM categories WHERE slug = 'small-kitchen-appliances';

INSERT INTO products (name, slug, sku, category_id, brand, description, price, mrp, stock, specs_json)
SELECT 'Bajaj 2000W Induction Cooktop', 'bajaj-2000w-induction-cooktop-ka-baj-2000ic', 'KA-BAJ-2000IC', id, 'Bajaj',
 'Auto shut-off and 8 preset menus for everyday cooking.', 2190, 2790, 35,
 '{"Power":"2000 Watt","Warranty":"2 Year"}'
FROM categories WHERE slug = 'small-kitchen-appliances';

-- Audio
INSERT INTO products (name, slug, sku, category_id, brand, description, price, mrp, stock, featured, specs_json)
SELECT 'JBL Partybox 310 Portable Speaker', 'jbl-partybox-310-portable-speaker-au-jbl-pb310', 'AU-JBL-PB310', id, 'JBL',
 'Powerful bass, dynamic light show, and long battery life for parties.', 27990, 32990, 10, TRUE,
 '{"Output Power":"240 Watt","Battery Life":"18 Hours","Connectivity":"Bluetooth, USB, AUX","Warranty":"1 Year"}'
FROM categories WHERE slug = 'audio';

INSERT INTO products (name, slug, sku, category_id, brand, description, price, mrp, stock, specs_json)
SELECT 'Sony SRS-XB13 Bluetooth Speaker', 'sony-srs-xb13-bluetooth-speaker-au-sony-xb13', 'AU-SONY-XB13', id, 'Sony',
 'Compact, waterproof speaker with Extra Bass sound.', 2490, 3290, 45,
 '{"Battery Life":"16 Hours","Water Resistance":"IP67","Warranty":"1 Year"}'
FROM categories WHERE slug = 'audio';

-- ---------- product images (placeholder image per product) ----------
INSERT INTO product_images (product_id, url, display_order, "primary")
SELECT id, 'https://placehold.co/800x800/0B0D10/F2A65A?text=' || REPLACE(brand, ' ', '+'), 0, TRUE FROM products;

-- ---------- a few variants for TVs / ACs to demonstrate variant selector ----------
INSERT INTO product_variants (product_id, variant_type, variant_value, price_delta, stock, sku)
SELECT id, 'Size', '55 inch', 0, stock, sku || '-55' FROM products WHERE sku = 'TV-LG-55-4K';
INSERT INTO product_variants (product_id, variant_type, variant_value, price_delta, stock, sku)
SELECT id, 'Size', '65 inch', 18000, 6, sku || '-65' FROM products WHERE sku = 'TV-LG-55-4K';

INSERT INTO product_variants (product_id, variant_type, variant_value, price_delta, stock, sku)
SELECT id, 'Capacity', '1.5 Ton', 0, stock, sku || '-15T' FROM products WHERE sku = 'AC-VOL-15-3S';
INSERT INTO product_variants (product_id, variant_type, variant_value, price_delta, stock, sku)
SELECT id, 'Capacity', '2 Ton', 8000, 6, sku || '-2T' FROM products WHERE sku = 'AC-VOL-15-3S';

-- ---------- coupons ----------
INSERT INTO coupons (code, discount_type, discount_value, min_order_value, expires_at, usage_limit, active) VALUES
('WELCOME500', 'FLAT', 500, 5000, now() + INTERVAL '180 days', 500, TRUE),
('DIWALI10', 'PERCENT', 10, 10000, now() + INTERVAL '90 days', 200, TRUE);

-- ---------- banners ----------
INSERT INTO banners (title, subtitle, image_url, link_url, display_order, active) VALUES
('Festive Electronics Sale', 'Up to 30% off on TVs, ACs & more', 'https://placehold.co/1600x600/0B0D10/00E5C7?text=Festive+Sale', '/products?featured=true', 1, TRUE),
('New Arrivals in Audio', 'JBL & Sony speakers now in stock', 'https://placehold.co/1600x600/0B0D10/F2A65A?text=New+Audio', '/category/audio', 2, TRUE);
