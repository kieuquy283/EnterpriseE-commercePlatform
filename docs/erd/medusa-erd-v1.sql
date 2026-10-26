-- ============================================================================
-- MEDUSA ERD v1: CUSTOMER, CATALOG, INVENTORY, CART
-- ============================================================================
-- Nguồn cấu trúc: medusa-schema-actual.sql, snapshot ngày 17/10/2026.
-- PostgreSQL trong dump: 16.15. Phiên bản Medusa trong repository: 2.21.2.
-- Hình đầy đủ liên kết nghiệp vụ: medusa-erd-v1-business.svg / .png / .drawio.
-- Cardinality, source of truth: medusa-erd-v1-business.md.
-- Kế hoạch sample và bằng chứng: medusa-erd-v1-sample-checklist.md.
-- Xem README.md cùng thư mục để phân biệt hình nghiệp vụ với DDL vật lý.
--
-- PHẠM VI
-- 1. Chín bảng được sao chép đủ cột, kiểu, nullable và default từ dump thực tế.
-- 2. Giữ 9 PK, 37 index, 2 CHECK và 3 FK giữa các bảng trong phạm vi.
-- 3. Tạo bản sao cấu trúc trong schema riêng medusa_erd_v1.
--    File tài liệu này không phải migration của ứng dụng Medusa.
-- 4. Không sao chép dữ liệu, role, thông tin xác thực hoặc quyền từ global dump.
-- 5. Các cột tham chiếu bảng ngoài phạm vi được giữ; 5 FK tương ứng được lược:
--    cart.billing_address_id -> cart_address.id
--    cart.shipping_address_id -> cart_address.id
--    product.collection_id -> product_collection.id
--    product.type_id -> product_type.id
--    stock_location.address_id -> stock_location_address.id
--    Vì vậy đây là snapshot có chọn phạm vi, không phải schema commerce đầy đủ.
--
-- CÁCH DÙNG TRONG PGADMIN
-- 1. Chọn database dùng cho tài liệu/demo, mở Query Tool rồi mở file này.
-- 2. Chạy toàn bộ file. Refresh Schemas -> medusa_erd_v1 -> ERD For Schema.
-- 3. Lưu sơ đồ chỉnh sửa được và xuất ảnh bằng Download image.
-- 4. pgAdmin chỉ tự vẽ 3 cạnh FK thật trong phạm vi này. Đây là kết quả đúng.
--    Đọc COMMENT của bảng/cột để bổ sung chú giải module link trong báo cáo.
--    COMMENT không tự tạo thêm cạnh quan hệ trên hình.
-- 5. CREATE SCHEMA cố ý báo lỗi nếu tên đã tồn tại. Khi lỗi, chạy ROLLBACK;
--    muốn một bản mới thì đổi toàn bộ tên schema sang tên chưa tồn tại.
--    Script không xóa hoặc thay thế cấu trúc đã có.
--
-- CHÚ GIẢI QUAN HỆ
-- FK thật:
--   product_variant.product_id -> product.id
--   cart_line_item.cart_id -> cart.id
--   inventory_level.inventory_item_id -> inventory_item.id
-- Read-only reference, không có FK vật lý trong dump:
--   cart.customer_id -> customer.id
--   cart_line_item.variant_id -> product_variant.id
--   cart_line_item.product_id -> product.id
--   inventory_level.location_id -> stock_location.id
-- Stored module link, không có FK vật lý ở hai phía trong dump:
--   product_variant_inventory_item nối ProductVariant N:N InventoryItem.
--   required_quantity là số đơn vị inventory item cần cho một đơn vị variant.
-- Không bổ sung FK/UNIQUE giả để nối các vùng rời nhau trên hình.
--
-- SOURCE OF TRUTH
-- Schema vật lý: dump DB tại thời điểm chụp; đối chiếu migration và package
-- đã khóa khi cần kiểm tra chênh lệch. Dump không chứng minh mọi migration đã chạy.
-- Customer Module: hồ sơ khách. Auth Module: dữ liệu xác thực, ngoài phạm vi.
-- Product Module: catalog/variant. Pricing Module: giá catalog, ngoài phạm vi.
-- Inventory Module: hàng lưu kho, tồn theo kho và reservation.
-- Stock Location Module: kho. Cart Module: giỏ và snapshot của dòng hàng.
-- Storefront/cookie/cache không phải nguồn chuẩn của giá, stock hoặc totals.
--
-- DỮ LIỆU MẪU
-- File này chỉ tạo cấu trúc. Không INSERT hoặc seed vào các bảng sao chép.
-- Seed ứng dụng hiện có: apps/backend/src/scripts/seed-commerce.ts.
-- Seed nền tạo Vietnam/VND, sales channel, kho, shipping và 3 sản phẩm/variants.
-- Bộ sample cần chuẩn bị riêng: customer, guest cart, cart rỗng, cart nhiều
-- items, product nhiều variants và tình huống đủ/hết hàng.
-- Tạo sample trong DB ứng dụng local/test qua Medusa API/workflow.
-- Không tự ghi raw_unit_price, totals hoặc reservation bằng SQL trong backend.
-- ============================================================================

BEGIN;

CREATE SCHEMA medusa_erd_v1;

COMMENT ON SCHEMA medusa_erd_v1 IS
  'ERD v1 gồm 9 bảng chọn từ commerce/public, snapshot 17/10/2026. Giữ cấu trúc vật lý trong phạm vi; liên kết module được ghi chú riêng. Không phải migration Medusa.';

-- A. CÁC BẢNG: GIỮ NGUYÊN CỘT TỪ DUMP, CHỈ ĐỔI SCHEMA

-- customer
CREATE TABLE medusa_erd_v1.customer (
    id text NOT NULL,
    company_name text,
    first_name text,
    last_name text,
    email text,
    phone text,
    has_account boolean DEFAULT false NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by text
);

-- product
CREATE TABLE medusa_erd_v1.product (
    id text NOT NULL,
    title text NOT NULL,
    handle text NOT NULL,
    subtitle text,
    description text,
    is_giftcard boolean DEFAULT false NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    thumbnail text,
    weight real,
    length real,
    height real,
    width real,
    origin_country text,
    hs_code text,
    mid_code text,
    material text,
    collection_id text,
    type_id text,
    discountable boolean DEFAULT true NOT NULL,
    external_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    metadata jsonb,
    CONSTRAINT product_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'proposed'::text, 'published'::text, 'rejected'::text])))
);

-- product_variant
CREATE TABLE medusa_erd_v1.product_variant (
    id text NOT NULL,
    title text NOT NULL,
    sku text,
    barcode text,
    ean text,
    upc text,
    allow_backorder boolean DEFAULT false NOT NULL,
    manage_inventory boolean DEFAULT true NOT NULL,
    hs_code text,
    origin_country text,
    mid_code text,
    material text,
    weight real,
    length real,
    height real,
    width real,
    metadata jsonb,
    variant_rank integer DEFAULT 0,
    product_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    thumbnail text
);

-- inventory_item
CREATE TABLE medusa_erd_v1.inventory_item (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    sku text,
    origin_country text,
    hs_code text,
    mid_code text,
    material text,
    weight integer,
    length integer,
    height integer,
    width integer,
    requires_shipping boolean DEFAULT true NOT NULL,
    description text,
    title text,
    thumbnail text,
    metadata jsonb,
    unit_of_measure text
);

-- inventory_level
CREATE TABLE medusa_erd_v1.inventory_level (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    inventory_item_id text NOT NULL,
    location_id text NOT NULL,
    stocked_quantity numeric DEFAULT 0 NOT NULL,
    reserved_quantity numeric DEFAULT 0 NOT NULL,
    incoming_quantity numeric DEFAULT 0 NOT NULL,
    metadata jsonb,
    raw_stocked_quantity jsonb,
    raw_reserved_quantity jsonb,
    raw_incoming_quantity jsonb
);

-- stock_location
CREATE TABLE medusa_erd_v1.stock_location (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    name text NOT NULL,
    address_id text,
    metadata jsonb
);

-- product_variant_inventory_item
CREATE TABLE medusa_erd_v1.product_variant_inventory_item (
    variant_id character varying(255) NOT NULL,
    inventory_item_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    required_quantity numeric DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);

-- cart
CREATE TABLE medusa_erd_v1.cart (
    id text NOT NULL,
    region_id text,
    customer_id text,
    sales_channel_id text,
    email text,
    currency_code text NOT NULL,
    shipping_address_id text,
    billing_address_id text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    completed_at timestamp with time zone,
    locale text
);

-- cart_line_item
CREATE TABLE medusa_erd_v1.cart_line_item (
    id text NOT NULL,
    cart_id text NOT NULL,
    title text NOT NULL,
    subtitle text,
    thumbnail text,
    quantity integer NOT NULL,
    variant_id text,
    product_id text,
    product_title text,
    product_description text,
    product_subtitle text,
    product_type text,
    product_collection text,
    product_handle text,
    variant_sku text,
    variant_barcode text,
    variant_title text,
    variant_option_values jsonb,
    requires_shipping boolean DEFAULT true NOT NULL,
    is_discountable boolean DEFAULT true NOT NULL,
    is_tax_inclusive boolean DEFAULT false NOT NULL,
    compare_at_unit_price numeric,
    raw_compare_at_unit_price jsonb,
    unit_price numeric NOT NULL,
    raw_unit_price jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    product_type_id text,
    is_custom_price boolean DEFAULT false NOT NULL,
    is_giftcard boolean DEFAULT false NOT NULL,
    CONSTRAINT cart_line_item_unit_price_check CHECK ((unit_price >= (0)::numeric))
);

-- B. PRIMARY KEY VÀ FOREIGN KEY TRONG PHẠM VI

ALTER TABLE ONLY medusa_erd_v1.cart_line_item
    ADD CONSTRAINT cart_line_item_pkey PRIMARY KEY (id);

ALTER TABLE ONLY medusa_erd_v1.cart
    ADD CONSTRAINT cart_pkey PRIMARY KEY (id);

ALTER TABLE ONLY medusa_erd_v1.customer
    ADD CONSTRAINT customer_pkey PRIMARY KEY (id);

ALTER TABLE ONLY medusa_erd_v1.inventory_item
    ADD CONSTRAINT inventory_item_pkey PRIMARY KEY (id);

ALTER TABLE ONLY medusa_erd_v1.inventory_level
    ADD CONSTRAINT inventory_level_pkey PRIMARY KEY (id);

ALTER TABLE ONLY medusa_erd_v1.product
    ADD CONSTRAINT product_pkey PRIMARY KEY (id);

ALTER TABLE ONLY medusa_erd_v1.product_variant_inventory_item
    ADD CONSTRAINT product_variant_inventory_item_pkey PRIMARY KEY (variant_id, inventory_item_id);

ALTER TABLE ONLY medusa_erd_v1.product_variant
    ADD CONSTRAINT product_variant_pkey PRIMARY KEY (id);

ALTER TABLE ONLY medusa_erd_v1.stock_location
    ADD CONSTRAINT stock_location_pkey PRIMARY KEY (id);

ALTER TABLE ONLY medusa_erd_v1.cart_line_item
    ADD CONSTRAINT cart_line_item_cart_id_foreign FOREIGN KEY (cart_id) REFERENCES medusa_erd_v1.cart(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY medusa_erd_v1.inventory_level
    ADD CONSTRAINT inventory_level_inventory_item_id_foreign FOREIGN KEY (inventory_item_id) REFERENCES medusa_erd_v1.inventory_item(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY medusa_erd_v1.product_variant
    ADD CONSTRAINT product_variant_product_id_foreign FOREIGN KEY (product_id) REFERENCES medusa_erd_v1.product(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- C. INDEX: GIỮ NGUYÊN ĐIỀU KIỆN PARTIAL UNIQUE TỪ DUMP

CREATE INDEX "IDX_cart_billing_address_id" ON medusa_erd_v1.cart USING btree (billing_address_id) WHERE ((deleted_at IS NULL) AND (billing_address_id IS NOT NULL));

CREATE INDEX "IDX_cart_currency_code" ON medusa_erd_v1.cart USING btree (currency_code);

CREATE INDEX "IDX_cart_customer_id" ON medusa_erd_v1.cart USING btree (customer_id) WHERE ((deleted_at IS NULL) AND (customer_id IS NOT NULL));

CREATE INDEX "IDX_cart_deleted_at" ON medusa_erd_v1.cart USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);

CREATE INDEX "IDX_cart_line_item_cart_id" ON medusa_erd_v1.cart_line_item USING btree (cart_id) WHERE (deleted_at IS NULL);

CREATE INDEX "IDX_cart_line_item_deleted_at" ON medusa_erd_v1.cart_line_item USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);

CREATE INDEX "IDX_cart_region_id" ON medusa_erd_v1.cart USING btree (region_id) WHERE ((deleted_at IS NULL) AND (region_id IS NOT NULL));

CREATE INDEX "IDX_cart_sales_channel_id" ON medusa_erd_v1.cart USING btree (sales_channel_id) WHERE ((deleted_at IS NULL) AND (sales_channel_id IS NOT NULL));

CREATE INDEX "IDX_cart_shipping_address_id" ON medusa_erd_v1.cart USING btree (shipping_address_id) WHERE ((deleted_at IS NULL) AND (shipping_address_id IS NOT NULL));

CREATE INDEX "IDX_customer_deleted_at" ON medusa_erd_v1.customer USING btree (deleted_at) WHERE (deleted_at IS NULL);

CREATE UNIQUE INDEX "IDX_customer_email_has_account_unique" ON medusa_erd_v1.customer USING btree (email, has_account) WHERE (deleted_at IS NULL);

CREATE INDEX "IDX_deleted_at_17b4c4e35" ON medusa_erd_v1.product_variant_inventory_item USING btree (deleted_at);

CREATE INDEX "IDX_id_17b4c4e35" ON medusa_erd_v1.product_variant_inventory_item USING btree (id);

CREATE INDEX "IDX_inventory_item_deleted_at" ON medusa_erd_v1.inventory_item USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);

CREATE INDEX "IDX_inventory_item_id_17b4c4e35" ON medusa_erd_v1.product_variant_inventory_item USING btree (inventory_item_id) WHERE (deleted_at IS NULL);

CREATE UNIQUE INDEX "IDX_inventory_item_sku" ON medusa_erd_v1.inventory_item USING btree (sku) WHERE (deleted_at IS NULL);

CREATE INDEX "IDX_inventory_level_deleted_at" ON medusa_erd_v1.inventory_level USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);

CREATE INDEX "IDX_inventory_level_inventory_item_id" ON medusa_erd_v1.inventory_level USING btree (inventory_item_id) WHERE (deleted_at IS NULL);

CREATE INDEX "IDX_inventory_level_location_id" ON medusa_erd_v1.inventory_level USING btree (location_id) WHERE (deleted_at IS NULL);

CREATE UNIQUE INDEX "IDX_inventory_level_location_id_inventory_item_id" ON medusa_erd_v1.inventory_level USING btree (inventory_item_id, location_id) WHERE (deleted_at IS NULL);

CREATE INDEX "IDX_line_item_product_id" ON medusa_erd_v1.cart_line_item USING btree (product_id) WHERE ((deleted_at IS NULL) AND (product_id IS NOT NULL));

CREATE INDEX "IDX_line_item_variant_id" ON medusa_erd_v1.cart_line_item USING btree (variant_id) WHERE ((deleted_at IS NULL) AND (variant_id IS NOT NULL));

CREATE INDEX "IDX_product_collection_id" ON medusa_erd_v1.product USING btree (collection_id) WHERE (deleted_at IS NULL);

CREATE INDEX "IDX_product_deleted_at" ON medusa_erd_v1.product USING btree (deleted_at);

CREATE UNIQUE INDEX "IDX_product_handle_unique" ON medusa_erd_v1.product USING btree (handle) WHERE (deleted_at IS NULL);

CREATE INDEX "IDX_product_status" ON medusa_erd_v1.product USING btree (status) WHERE (deleted_at IS NULL);

CREATE INDEX "IDX_product_type_id" ON medusa_erd_v1.product USING btree (type_id) WHERE (deleted_at IS NULL);

CREATE UNIQUE INDEX "IDX_product_variant_barcode_unique" ON medusa_erd_v1.product_variant USING btree (barcode) WHERE (deleted_at IS NULL);

CREATE INDEX "IDX_product_variant_deleted_at" ON medusa_erd_v1.product_variant USING btree (deleted_at);

CREATE UNIQUE INDEX "IDX_product_variant_ean_unique" ON medusa_erd_v1.product_variant USING btree (ean) WHERE (deleted_at IS NULL);

CREATE INDEX "IDX_product_variant_id_product_id" ON medusa_erd_v1.product_variant USING btree (id, product_id) WHERE (deleted_at IS NULL);

CREATE INDEX "IDX_product_variant_product_id" ON medusa_erd_v1.product_variant USING btree (product_id) WHERE (deleted_at IS NULL);

CREATE UNIQUE INDEX "IDX_product_variant_sku_unique" ON medusa_erd_v1.product_variant USING btree (sku) WHERE (deleted_at IS NULL);

CREATE UNIQUE INDEX "IDX_product_variant_upc_unique" ON medusa_erd_v1.product_variant USING btree (upc) WHERE (deleted_at IS NULL);

CREATE UNIQUE INDEX "IDX_stock_location_address_id_unique" ON medusa_erd_v1.stock_location USING btree (address_id) WHERE (deleted_at IS NULL);

CREATE INDEX "IDX_stock_location_deleted_at" ON medusa_erd_v1.stock_location USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);

CREATE INDEX "IDX_variant_id_17b4c4e35" ON medusa_erd_v1.product_variant_inventory_item USING btree (variant_id) WHERE (deleted_at IS NULL);

-- D. MÔ TẢ BẢNG, CARDINALITY VÀ CÁC LIÊN KẾT KHÔNG CÓ FK

COMMENT ON TABLE medusa_erd_v1.customer IS
  'Customer Module: hồ sơ khách hàng. Auth identity và mật khẩu thuộc Auth Module ngoài phạm vi. Một customer có thể có 0..N carts qua cart.customer_id, không có FK vật lý.';
COMMENT ON COLUMN medusa_erd_v1.customer.email IS
  'Nullable. Unique theo cặp (email, has_account) với WHERE deleted_at IS NULL; không phải email unique toàn cục.';
COMMENT ON COLUMN medusa_erd_v1.customer.has_account IS
  'Cờ cho biết khách có tài khoản; default false. Không chứa dữ liệu xác thực.';

COMMENT ON TABLE medusa_erd_v1.product IS
  'Product Module: thông tin catalog. Một product có 0..N variants; product_variant.product_id nullable nên một variant tham chiếu 0..1 product.';
COMMENT ON COLUMN medusa_erd_v1.product.handle IS
  'Định danh URL; unique trên các bản ghi chưa soft-delete.';
COMMENT ON COLUMN medusa_erd_v1.product.status IS
  'Text + CHECK: draft, proposed, published, rejected; default draft.';
COMMENT ON COLUMN medusa_erd_v1.product.thumbnail IS
  'URL ảnh. Nơi lưu media tùy file provider hoặc URL bên ngoài; S3 chỉ bật khi có cấu hình.';
COMMENT ON COLUMN medusa_erd_v1.product.collection_id IS
  'Tham chiếu product_collection.id ngoài phạm vi. FK thật trong dump được lược khỏi bản 9 bảng.';
COMMENT ON COLUMN medusa_erd_v1.product.type_id IS
  'Tham chiếu product_type.id ngoài phạm vi. FK thật trong dump được lược khỏi bản 9 bảng.';

COMMENT ON TABLE medusa_erd_v1.product_variant IS
  'Variant = product_variant. Product Module quản lý biến thể; giá catalog thuộc Pricing Module ngoài phạm vi. Liên kết N:N InventoryItem qua product_variant_inventory_item.';
COMMENT ON COLUMN medusa_erd_v1.product_variant.product_id IS
  'FK vật lý tới product.id, nullable; ON UPDATE CASCADE, ON DELETE CASCADE.';
COMMENT ON COLUMN medusa_erd_v1.product_variant.sku IS
  'Nullable; unique với WHERE deleted_at IS NULL.';
COMMENT ON COLUMN medusa_erd_v1.product_variant.manage_inventory IS
  'Cờ quản lý tồn kho, default true; số lượng tồn thực nằm tại inventory_level.';
COMMENT ON COLUMN medusa_erd_v1.product_variant.allow_backorder IS
  'Cờ cho phép backorder, default false; phải được xét khi kiểm tra khả dụng.';

COMMENT ON TABLE medusa_erd_v1.inventory_item IS
  'Inventory Module: hàng được quản lý tồn kho. Một item có 0..N inventory levels và có thể dùng chung cho nhiều variants qua stored module link. ReservationItem ngoài phạm vi.';
COMMENT ON COLUMN medusa_erd_v1.inventory_item.sku IS
  'Nullable; unique với WHERE deleted_at IS NULL. Quan hệ với variant được lưu bằng ID trong link table, không phải FK theo SKU.';

COMMENT ON TABLE medusa_erd_v1.inventory_level IS
  'Inventory Module: tồn của một inventory item tại một kho. FK thật tới inventory_item; location_id là read-only reference tới StockLocation. Unique active theo (inventory_item_id, location_id). available_quantity là computed, không phải cột trong dump.';
COMMENT ON COLUMN medusa_erd_v1.inventory_level.inventory_item_id IS
  'FK vật lý tới inventory_item.id, NOT NULL; ON UPDATE CASCADE, ON DELETE CASCADE.';
COMMENT ON COLUMN medusa_erd_v1.inventory_level.location_id IS
  'NOT NULL. Read-only reference tới stock_location.id, không có FK vật lý trong dump. Một kho có thể có 0..N levels.';
COMMENT ON COLUMN medusa_erd_v1.inventory_level.stocked_quantity IS
  'Số lượng lưu kho tại location; numeric, default 0. Không tự giảm khi thêm vào cart.';
COMMENT ON COLUMN medusa_erd_v1.inventory_level.reserved_quantity IS
  'Số lượng đang được giữ bởi reservation. Để Medusa workflow quản lý.';
COMMENT ON COLUMN medusa_erd_v1.inventory_level.incoming_quantity IS
  'Số lượng dự kiến nhập; numeric, default 0.';

COMMENT ON TABLE medusa_erd_v1.stock_location IS
  'Stock Location Module: kho/địa điểm lưu hàng. inventory_level.location_id tham chiếu qua ID, không có FK vật lý giữa hai bảng trong dump.';
COMMENT ON COLUMN medusa_erd_v1.stock_location.address_id IS
  'Tham chiếu stock_location_address.id ngoài phạm vi. FK thật trong dump được lược khỏi bản 9 bảng.';

COMMENT ON TABLE medusa_erd_v1.product_variant_inventory_item IS
  'Stored module link: ProductVariant N:N InventoryItem. PK ghép (variant_id, inventory_item_id). Hai ID không có FK vật lý trong dump; không thêm UNIQUE từng phía vì sẽ ép cardinality.';
COMMENT ON COLUMN medusa_erd_v1.product_variant_inventory_item.id IS
  'NOT NULL và chỉ có index thường; không phải PK hay UNIQUE trong dump.';
COMMENT ON COLUMN medusa_erd_v1.product_variant_inventory_item.variant_id IS
  'Một phần PK ghép; tham chiếu Product Module, không có FK vật lý.';
COMMENT ON COLUMN medusa_erd_v1.product_variant_inventory_item.inventory_item_id IS
  'Một phần PK ghép; tham chiếu Inventory Module, không có FK vật lý.';
COMMENT ON COLUMN medusa_erd_v1.product_variant_inventory_item.required_quantity IS
  'Numeric DEFAULT 1 NOT NULL: số đơn vị inventory item cần cho một đơn vị variant.';

COMMENT ON TABLE medusa_erd_v1.cart IS
  'Cart Module: giỏ hàng. Một cart có 0..N line items. customer_id nullable cho guest cart; customer/region/sales channel là tham chiếu module qua ID.';
COMMENT ON COLUMN medusa_erd_v1.cart.customer_id IS
  'Nullable. Read-only reference tới customer.id, không có FK vật lý. Một cart tham chiếu 0..1 customer.';
COMMENT ON COLUMN medusa_erd_v1.cart.region_id IS
  'Tham chiếu Region Module ngoài phạm vi; ảnh hưởng ngữ cảnh giá và checkout.';
COMMENT ON COLUMN medusa_erd_v1.cart.sales_channel_id IS
  'Tham chiếu Sales Channel Module ngoài phạm vi; xác định kênh bán.';
COMMENT ON COLUMN medusa_erd_v1.cart.email IS
  'Email gắn với giỏ; nullable, có thể dùng cho guest checkout.';
COMMENT ON COLUMN medusa_erd_v1.cart.currency_code IS
  'Mã tiền tệ, NOT NULL. Seed ứng dụng hiện dùng vnd.';
COMMENT ON COLUMN medusa_erd_v1.cart.completed_at IS
  'Nullable; thời điểm cart được hoàn tất/chuyển thành order. Order ngoài phạm vi hình chính.';
COMMENT ON COLUMN medusa_erd_v1.cart.shipping_address_id IS
  'Tham chiếu cart_address.id ngoài phạm vi. FK thật trong dump được lược khỏi bản 9 bảng.';
COMMENT ON COLUMN medusa_erd_v1.cart.billing_address_id IS
  'Tham chiếu cart_address.id ngoài phạm vi. FK thật trong dump được lược khỏi bản 9 bảng.';

COMMENT ON TABLE medusa_erd_v1.cart_line_item IS
  'CartItem trong task = LineItem của Cart Module, bảng cart_line_item. Một item thuộc đúng một cart; có thể không có variant/product. Lưu snapshot tên/SKU/options và đơn giá của dòng hàng.';
COMMENT ON COLUMN medusa_erd_v1.cart_line_item.cart_id IS
  'FK vật lý tới cart.id, NOT NULL; ON UPDATE CASCADE, ON DELETE CASCADE.';
COMMENT ON COLUMN medusa_erd_v1.cart_line_item.variant_id IS
  'Nullable. Read-only reference tới product_variant.id; không có FK vật lý. Một variant có thể được tham chiếu bởi 0..N line items.';
COMMENT ON COLUMN medusa_erd_v1.cart_line_item.product_id IS
  'Nullable. Read-only reference tới product.id; không có FK vật lý.';
COMMENT ON COLUMN medusa_erd_v1.cart_line_item.quantity IS
  'Integer NOT NULL trong dump; giữ nguyên kiểu đã khảo sát.';
COMMENT ON COLUMN medusa_erd_v1.cart_line_item.unit_price IS
  'Numeric NOT NULL, CHECK >= 0; đơn giá của dòng hàng, không thay thế bảng giá catalog. Giá/totals do Medusa API/workflow xử lý.';
COMMENT ON COLUMN medusa_erd_v1.cart_line_item.raw_unit_price IS
  'JSONB NOT NULL của biểu diễn số chính xác do Medusa quản lý; không tự tạo sample bằng INSERT trực tiếp.';

COMMIT;

-- E. TRUY VẤN CHỈ ĐỌC SAU KHI TẠO
-- Kết quả đầu: đúng 9 bảng. Không suy ra số row hoặc trạng thái seed từ DDL.

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'medusa_erd_v1'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Kết quả thứ hai: đúng 3 FK nội phạm vi; thiếu các cạnh module là có chủ đích.
SELECT
  conrelid::regclass AS source_table,
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE connamespace = 'medusa_erd_v1'::regnamespace
  AND contype = 'f'
ORDER BY conrelid::regclass::text, conname;

-- Xem index thật, gồm PK và các partial unique có điều kiện soft-delete.
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'medusa_erd_v1'
ORDER BY tablename, indexname;

