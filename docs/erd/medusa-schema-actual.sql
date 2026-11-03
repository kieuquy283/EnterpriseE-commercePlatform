--
-- PostgreSQL database cluster dump (role credential omitted for version control)
--

-- Started on 2026-10-17 22:08:53

\restrict nu3HVmXhkgDd1A66fL0diJk1nkBDsiCek4p1u1ECFwXPaCPRYvbWvHstwfm2iRX

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE commerce;
ALTER ROLE commerce WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS;

--
-- User Configurations
--








\unrestrict nu3HVmXhkgDd1A66fL0diJk1nkBDsiCek4p1u1ECFwXPaCPRYvbWvHstwfm2iRX

--
-- Databases
--

--
-- Database "template1" dump
--

\connect template1

--
-- PostgreSQL database dump
--

\restrict dAbvikWrivMccPFgTXR8eEzcHVYC1gEfGgmZm1IErfLkYJwYhy1KyAteGdGRnhy

-- Dumped from database version 16.15
-- Dumped by pg_dump version 18.4

-- Started on 2026-10-17 22:08:53

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Completed on 2026-10-17 22:08:53

--
-- PostgreSQL database dump complete
--

\unrestrict dAbvikWrivMccPFgTXR8eEzcHVYC1gEfGgmZm1IErfLkYJwYhy1KyAteGdGRnhy

--
-- Database "commerce" dump
--

--
-- PostgreSQL database dump
--

\restrict 8SvbeGhN8H4vAweIqwtbzXQgcZZBssU5er7SGBMk7hsrtwLkEJbE5oFjv2khAg1

-- Dumped from database version 16.15
-- Dumped by pg_dump version 18.4

-- Started on 2026-10-17 22:08:53

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5370 (class 1262 OID 16384)
-- Name: commerce; Type: DATABASE; Schema: -; Owner: commerce
--

CREATE DATABASE commerce WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE commerce OWNER TO commerce;

\unrestrict 8SvbeGhN8H4vAweIqwtbzXQgcZZBssU5er7SGBMk7hsrtwLkEJbE5oFjv2khAg1
\connect commerce
\restrict 8SvbeGhN8H4vAweIqwtbzXQgcZZBssU5er7SGBMk7hsrtwLkEJbE5oFjv2khAg1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 19268)
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- TOC entry 5371 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner:
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- TOC entry 3 (class 3079 OID 19349)
-- Name: unaccent; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;


--
-- TOC entry 5372 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION unaccent; Type: COMMENT; Schema: -; Owner:
--

COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';


--
-- TOC entry 1310 (class 1247 OID 18541)
-- Name: claim_reason_enum; Type: TYPE; Schema: public; Owner: commerce
--

CREATE TYPE public.claim_reason_enum AS ENUM (
    'missing_item',
    'wrong_item',
    'production_failure',
    'other'
);


ALTER TYPE public.claim_reason_enum OWNER TO commerce;

--
-- TOC entry 1304 (class 1247 OID 18520)
-- Name: order_claim_type_enum; Type: TYPE; Schema: public; Owner: commerce
--

CREATE TYPE public.order_claim_type_enum AS ENUM (
    'refund',
    'replace'
);


ALTER TYPE public.order_claim_type_enum OWNER TO commerce;

--
-- TOC entry 1250 (class 1247 OID 18186)
-- Name: order_status_enum; Type: TYPE; Schema: public; Owner: commerce
--

CREATE TYPE public.order_status_enum AS ENUM (
    'pending',
    'completed',
    'draft',
    'archived',
    'canceled',
    'requires_action'
);


ALTER TYPE public.order_status_enum OWNER TO commerce;

--
-- TOC entry 1319 (class 1247 OID 18591)
-- Name: return_status_enum; Type: TYPE; Schema: public; Owner: commerce
--

CREATE TYPE public.return_status_enum AS ENUM (
    'open',
    'requested',
    'received',
    'partially_received',
    'canceled'
);


ALTER TYPE public.return_status_enum OWNER TO commerce;

--
-- TOC entry 2697 (class 3602 OID 19356)
-- Name: medusa_search_english; Type: TEXT SEARCH CONFIGURATION; Schema: public; Owner: commerce
--

CREATE TEXT SEARCH CONFIGURATION public.medusa_search_english (
    PARSER = pg_catalog."default" );

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR asciiword WITH english_stem;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR word WITH public.unaccent, english_stem;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR numword WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR email WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR url WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR host WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR sfloat WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR version WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR hword_numpart WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR hword_part WITH public.unaccent, english_stem;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR hword_asciipart WITH english_stem;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR numhword WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR asciihword WITH english_stem;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR hword WITH public.unaccent, english_stem;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR url_path WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR file WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR "float" WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR "int" WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR uint WITH simple;


ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english OWNER TO commerce;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 288 (class 1259 OID 18137)
-- Name: account_holder; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.account_holder (
    id text NOT NULL,
    provider_id text NOT NULL,
    external_id text NOT NULL,
    email text,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.account_holder OWNER TO commerce;

--
-- TOC entry 271 (class 1259 OID 17841)
-- Name: api_key; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.api_key (
    id text NOT NULL,
    token text NOT NULL,
    salt text NOT NULL,
    redacted text NOT NULL,
    title text NOT NULL,
    type text NOT NULL,
    last_used_at timestamp with time zone,
    created_by text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_by text,
    revoked_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT api_key_type_check CHECK ((type = ANY (ARRAY['publishable'::text, 'secret'::text])))
);


ALTER TABLE public.api_key OWNER TO commerce;

--
-- TOC entry 252 (class 1259 OID 17350)
-- Name: application_method_buy_rules; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.application_method_buy_rules (
    application_method_id text NOT NULL,
    promotion_rule_id text NOT NULL
);


ALTER TABLE public.application_method_buy_rules OWNER TO commerce;

--
-- TOC entry 251 (class 1259 OID 17343)
-- Name: application_method_target_rules; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.application_method_target_rules (
    application_method_id text NOT NULL,
    promotion_rule_id text NOT NULL
);


ALTER TABLE public.application_method_target_rules OWNER TO commerce;

--
-- TOC entry 321 (class 1259 OID 18785)
-- Name: auth_identity; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.auth_identity (
    id text NOT NULL,
    app_metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.auth_identity OWNER TO commerce;

--
-- TOC entry 323 (class 1259 OID 18814)
-- Name: auth_mfa_factor; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.auth_mfa_factor (
    id text NOT NULL,
    auth_identity_id text NOT NULL,
    provider text NOT NULL,
    status text NOT NULL,
    provider_metadata jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.auth_mfa_factor OWNER TO commerce;

--
-- TOC entry 324 (class 1259 OID 18826)
-- Name: auth_mfa_recovery_code; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.auth_mfa_recovery_code (
    id text NOT NULL,
    auth_identity_id text NOT NULL,
    code_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.auth_mfa_recovery_code OWNER TO commerce;

--
-- TOC entry 325 (class 1259 OID 18872)
-- Name: auth_password_reset_token; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.auth_password_reset_token (
    id text NOT NULL,
    auth_identity_id text NOT NULL,
    provider_identity_id text NOT NULL,
    entity_id text NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.auth_password_reset_token OWNER TO commerce;

--
-- TOC entry 326 (class 1259 OID 18896)
-- Name: auth_verification; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.auth_verification (
    id text NOT NULL,
    auth_identity_id text NOT NULL,
    entity_id text NOT NULL,
    entity_type text NOT NULL,
    code_provider text NOT NULL,
    verified_at timestamp with time zone,
    requested_at timestamp with time zone NOT NULL,
    provider_metadata jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.auth_verification OWNER TO commerce;

--
-- TOC entry 286 (class 1259 OID 18053)
-- Name: capture; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.capture (
    id text NOT NULL,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    payment_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by text,
    metadata jsonb
);


ALTER TABLE public.capture OWNER TO commerce;

--
-- TOC entry 260 (class 1259 OID 17594)
-- Name: cart; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.cart (
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


ALTER TABLE public.cart OWNER TO commerce;

--
-- TOC entry 261 (class 1259 OID 17609)
-- Name: cart_address; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.cart_address (
    id text NOT NULL,
    customer_id text,
    company text,
    first_name text,
    last_name text,
    address_1 text,
    address_2 text,
    city text,
    country_code text,
    province text,
    postal_code text,
    phone text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.cart_address OWNER TO commerce;

--
-- TOC entry 262 (class 1259 OID 17618)
-- Name: cart_line_item; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.cart_line_item (
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


ALTER TABLE public.cart_line_item OWNER TO commerce;

--
-- TOC entry 263 (class 1259 OID 17644)
-- Name: cart_line_item_adjustment; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.cart_line_item_adjustment (
    id text NOT NULL,
    description text,
    promotion_id text,
    code text,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    provider_id text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    item_id text,
    is_tax_inclusive boolean DEFAULT false NOT NULL,
    CONSTRAINT cart_line_item_adjustment_check CHECK ((amount >= (0)::numeric))
);


ALTER TABLE public.cart_line_item_adjustment OWNER TO commerce;

--
-- TOC entry 264 (class 1259 OID 17656)
-- Name: cart_line_item_tax_line; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.cart_line_item_tax_line (
    id text NOT NULL,
    description text,
    tax_rate_id text,
    code text NOT NULL,
    rate real NOT NULL,
    provider_id text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    item_id text,
    data jsonb
);


ALTER TABLE public.cart_line_item_tax_line OWNER TO commerce;

--
-- TOC entry 350 (class 1259 OID 19408)
-- Name: cart_payment_collection; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.cart_payment_collection (
    cart_id character varying(255) NOT NULL,
    payment_collection_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.cart_payment_collection OWNER TO commerce;

--
-- TOC entry 351 (class 1259 OID 19421)
-- Name: cart_promotion; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.cart_promotion (
    cart_id character varying(255) NOT NULL,
    promotion_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.cart_promotion OWNER TO commerce;

--
-- TOC entry 265 (class 1259 OID 17667)
-- Name: cart_shipping_method; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.cart_shipping_method (
    id text NOT NULL,
    cart_id text NOT NULL,
    name text NOT NULL,
    description jsonb,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    is_tax_inclusive boolean DEFAULT false NOT NULL,
    shipping_option_id text,
    data jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT cart_shipping_method_check CHECK ((amount >= (0)::numeric))
);


ALTER TABLE public.cart_shipping_method OWNER TO commerce;

--
-- TOC entry 266 (class 1259 OID 17680)
-- Name: cart_shipping_method_adjustment; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.cart_shipping_method_adjustment (
    id text NOT NULL,
    description text,
    promotion_id text,
    code text,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    provider_id text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    shipping_method_id text
);


ALTER TABLE public.cart_shipping_method_adjustment OWNER TO commerce;

--
-- TOC entry 267 (class 1259 OID 17691)
-- Name: cart_shipping_method_tax_line; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.cart_shipping_method_tax_line (
    id text NOT NULL,
    description text,
    tax_rate_id text,
    code text NOT NULL,
    rate real NOT NULL,
    provider_id text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    shipping_method_id text,
    data jsonb
);


ALTER TABLE public.cart_shipping_method_tax_line OWNER TO commerce;

--
-- TOC entry 268 (class 1259 OID 17794)
-- Name: credit_line; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.credit_line (
    id text NOT NULL,
    cart_id text NOT NULL,
    reference text,
    reference_id text,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.credit_line OWNER TO commerce;

--
-- TOC entry 279 (class 1259 OID 17978)
-- Name: currency; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.currency (
    code text NOT NULL,
    symbol text NOT NULL,
    symbol_native text NOT NULL,
    decimal_digits integer DEFAULT 0 NOT NULL,
    rounding numeric DEFAULT 0 NOT NULL,
    raw_rounding jsonb NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.currency OWNER TO commerce;

--
-- TOC entry 255 (class 1259 OID 17506)
-- Name: customer; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.customer (
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


ALTER TABLE public.customer OWNER TO commerce;

--
-- TOC entry 352 (class 1259 OID 19434)
-- Name: customer_account_holder; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.customer_account_holder (
    customer_id character varying(255) NOT NULL,
    account_holder_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.customer_account_holder OWNER TO commerce;

--
-- TOC entry 256 (class 1259 OID 17516)
-- Name: customer_address; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.customer_address (
    id text NOT NULL,
    customer_id text NOT NULL,
    address_name text,
    is_default_shipping boolean DEFAULT false NOT NULL,
    is_default_billing boolean DEFAULT false NOT NULL,
    company text,
    first_name text,
    last_name text,
    address_1 text,
    address_2 text,
    city text,
    country_code text,
    province text,
    postal_code text,
    phone text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.customer_address OWNER TO commerce;

--
-- TOC entry 257 (class 1259 OID 17530)
-- Name: customer_group; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.customer_group (
    id text NOT NULL,
    name text NOT NULL,
    metadata jsonb,
    created_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.customer_group OWNER TO commerce;

--
-- TOC entry 258 (class 1259 OID 17540)
-- Name: customer_group_customer; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.customer_group_customer (
    id text NOT NULL,
    customer_id text NOT NULL,
    customer_group_id text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text,
    deleted_at timestamp with time zone
);


ALTER TABLE public.customer_group_customer OWNER TO commerce;

--
-- TOC entry 338 (class 1259 OID 19048)
-- Name: fulfillment; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.fulfillment (
    id text NOT NULL,
    location_id text NOT NULL,
    packed_at timestamp with time zone,
    shipped_at timestamp with time zone,
    delivered_at timestamp with time zone,
    canceled_at timestamp with time zone,
    data jsonb,
    provider_id text,
    shipping_option_id text,
    metadata jsonb,
    delivery_address_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    marked_shipped_by text,
    created_by text,
    requires_shipping boolean DEFAULT true NOT NULL
);


ALTER TABLE public.fulfillment OWNER TO commerce;

--
-- TOC entry 329 (class 1259 OID 18940)
-- Name: fulfillment_address; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.fulfillment_address (
    id text NOT NULL,
    company text,
    first_name text,
    last_name text,
    address_1 text,
    address_2 text,
    city text,
    country_code text,
    province text,
    postal_code text,
    phone text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.fulfillment_address OWNER TO commerce;

--
-- TOC entry 340 (class 1259 OID 19074)
-- Name: fulfillment_item; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.fulfillment_item (
    id text NOT NULL,
    title text NOT NULL,
    sku text NOT NULL,
    barcode text NOT NULL,
    quantity numeric NOT NULL,
    raw_quantity jsonb NOT NULL,
    line_item_id text,
    inventory_item_id text,
    fulfillment_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.fulfillment_item OWNER TO commerce;

--
-- TOC entry 339 (class 1259 OID 19063)
-- Name: fulfillment_label; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.fulfillment_label (
    id text NOT NULL,
    tracking_number text NOT NULL,
    tracking_url text NOT NULL,
    label_url text NOT NULL,
    fulfillment_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.fulfillment_label OWNER TO commerce;

--
-- TOC entry 330 (class 1259 OID 18950)
-- Name: fulfillment_provider; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.fulfillment_provider (
    id text NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.fulfillment_provider OWNER TO commerce;

--
-- TOC entry 331 (class 1259 OID 18958)
-- Name: fulfillment_set; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.fulfillment_set (
    id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.fulfillment_set OWNER TO commerce;

--
-- TOC entry 333 (class 1259 OID 18981)
-- Name: geo_zone; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.geo_zone (
    id text NOT NULL,
    type text DEFAULT 'country'::text NOT NULL,
    country_code text NOT NULL,
    province_code text,
    city text,
    service_zone_id text NOT NULL,
    postal_expression jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT geo_zone_type_check CHECK ((type = ANY (ARRAY['country'::text, 'province'::text, 'city'::text, 'zip'::text])))
);


ALTER TABLE public.geo_zone OWNER TO commerce;

--
-- TOC entry 228 (class 1259 OID 16590)
-- Name: image; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.image (
    id text NOT NULL,
    url text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    rank integer DEFAULT 0 NOT NULL,
    product_id text NOT NULL
);


ALTER TABLE public.image OWNER TO commerce;

--
-- TOC entry 221 (class 1259 OID 16431)
-- Name: inventory_item; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.inventory_item (
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


ALTER TABLE public.inventory_item OWNER TO commerce;

--
-- TOC entry 222 (class 1259 OID 16443)
-- Name: inventory_level; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.inventory_level (
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


ALTER TABLE public.inventory_level OWNER TO commerce;

--
-- TOC entry 327 (class 1259 OID 18913)
-- Name: invite; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.invite (
    id text NOT NULL,
    email text NOT NULL,
    accepted boolean DEFAULT false NOT NULL,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.invite OWNER TO commerce;

--
-- TOC entry 355 (class 1259 OID 19473)
-- Name: invite_rbac_role; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.invite_rbac_role (
    invite_id character varying(255) NOT NULL,
    rbac_role_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.invite_rbac_role OWNER TO commerce;

--
-- TOC entry 320 (class 1259 OID 18772)
-- Name: layout_configuration; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.layout_configuration (
    id text NOT NULL,
    zone text NOT NULL,
    user_id text,
    is_system_default boolean DEFAULT false NOT NULL,
    configuration jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.layout_configuration OWNER TO commerce;

--
-- TOC entry 349 (class 1259 OID 19396)
-- Name: link_module_migrations; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.link_module_migrations (
    id integer NOT NULL,
    table_name character varying(255) NOT NULL,
    link_descriptor jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.link_module_migrations OWNER TO commerce;

--
-- TOC entry 348 (class 1259 OID 19395)
-- Name: link_module_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: commerce
--

CREATE SEQUENCE public.link_module_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.link_module_migrations_id_seq OWNER TO commerce;

--
-- TOC entry 5373 (class 0 OID 0)
-- Dependencies: 348
-- Name: link_module_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: commerce
--

ALTER SEQUENCE public.link_module_migrations_id_seq OWNED BY public.link_module_migrations.id;


--
-- TOC entry 353 (class 1259 OID 19447)
-- Name: location_fulfillment_provider; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.location_fulfillment_provider (
    stock_location_id character varying(255) NOT NULL,
    fulfillment_provider_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.location_fulfillment_provider OWNER TO commerce;

--
-- TOC entry 354 (class 1259 OID 19460)
-- Name: location_fulfillment_set; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.location_fulfillment_set (
    stock_location_id character varying(255) NOT NULL,
    fulfillment_set_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.location_fulfillment_set OWNER TO commerce;

--
-- TOC entry 218 (class 1259 OID 16390)
-- Name: mikro_orm_migrations; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.mikro_orm_migrations (
    id integer NOT NULL,
    name character varying(255),
    executed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.mikro_orm_migrations OWNER TO commerce;

--
-- TOC entry 217 (class 1259 OID 16389)
-- Name: mikro_orm_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: commerce
--

CREATE SEQUENCE public.mikro_orm_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mikro_orm_migrations_id_seq OWNER TO commerce;

--
-- TOC entry 5374 (class 0 OID 0)
-- Dependencies: 217
-- Name: mikro_orm_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: commerce
--

ALTER SEQUENCE public.mikro_orm_migrations_id_seq OWNED BY public.mikro_orm_migrations.id;


--
-- TOC entry 342 (class 1259 OID 19184)
-- Name: notification; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.notification (
    id text NOT NULL,
    "to" text NOT NULL,
    channel text NOT NULL,
    template text,
    data jsonb,
    trigger_type text,
    resource_id text,
    resource_type text,
    receiver_id text,
    original_notification_id text,
    idempotency_key text,
    external_id text,
    provider_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    status text DEFAULT 'pending'::text NOT NULL,
    "from" text,
    provider_data jsonb,
    CONSTRAINT notification_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'success'::text, 'failure'::text])))
);


ALTER TABLE public.notification OWNER TO commerce;

--
-- TOC entry 341 (class 1259 OID 19176)
-- Name: notification_provider; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.notification_provider (
    id text NOT NULL,
    handle text NOT NULL,
    name text NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    channels text[] DEFAULT '{}'::text[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.notification_provider OWNER TO commerce;

--
-- TOC entry 291 (class 1259 OID 18173)
-- Name: order; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public."order" (
    id text NOT NULL,
    region_id text,
    display_id integer,
    customer_id text,
    version integer DEFAULT 1 NOT NULL,
    sales_channel_id text,
    status public.order_status_enum DEFAULT 'pending'::public.order_status_enum NOT NULL,
    is_draft_order boolean DEFAULT false NOT NULL,
    email text,
    currency_code text NOT NULL,
    shipping_address_id text,
    billing_address_id text,
    no_notification boolean,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    canceled_at timestamp with time zone,
    custom_display_id text,
    locale text
);


ALTER TABLE public."order" OWNER TO commerce;

--
-- TOC entry 289 (class 1259 OID 18162)
-- Name: order_address; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.order_address (
    id text NOT NULL,
    customer_id text,
    company text,
    first_name text,
    last_name text,
    address_1 text,
    address_2 text,
    city text,
    country_code text,
    province text,
    postal_code text,
    phone text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_address OWNER TO commerce;

--
-- TOC entry 356 (class 1259 OID 19486)
-- Name: order_cart; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.order_cart (
    order_id character varying(255) NOT NULL,
    cart_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_cart OWNER TO commerce;

--
-- TOC entry 293 (class 1259 OID 18225)
-- Name: order_change; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.order_change (
    id text NOT NULL,
    order_id text NOT NULL,
    version integer NOT NULL,
    description text,
    status text DEFAULT 'pending'::text NOT NULL,
    internal_note text,
    created_by text,
    requested_by text,
    requested_at timestamp with time zone,
    confirmed_by text,
    confirmed_at timestamp with time zone,
    declined_by text,
    declined_reason text,
    metadata jsonb,
    declined_at timestamp with time zone,
    canceled_by text,
    canceled_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    change_type text,
    deleted_at timestamp with time zone,
    return_id text,
    claim_id text,
    exchange_id text,
    carry_over_promotions boolean,
    no_notification boolean,
    CONSTRAINT order_change_status_check CHECK ((status = ANY (ARRAY['confirmed'::text, 'declined'::text, 'requested'::text, 'pending'::text, 'canceled'::text])))
);


ALTER TABLE public.order_change OWNER TO commerce;

--
-- TOC entry 295 (class 1259 OID 18240)
-- Name: order_change_action; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.order_change_action (
    id text NOT NULL,
    order_id text,
    version integer,
    ordering bigint NOT NULL,
    order_change_id text,
    reference text,
    reference_id text,
    action text NOT NULL,
    details jsonb,
    amount numeric,
    raw_amount jsonb,
    internal_note text,
    applied boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    return_id text,
    claim_id text,
    exchange_id text
);


ALTER TABLE public.order_change_action OWNER TO commerce;

--
-- TOC entry 294 (class 1259 OID 18239)
-- Name: order_change_action_ordering_seq; Type: SEQUENCE; Schema: public; Owner: commerce
--

CREATE SEQUENCE public.order_change_action_ordering_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_change_action_ordering_seq OWNER TO commerce;

--
-- TOC entry 5375 (class 0 OID 0)
-- Dependencies: 294
-- Name: order_change_action_ordering_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: commerce
--

ALTER SEQUENCE public.order_change_action_ordering_seq OWNED BY public.order_change_action.ordering;


--
-- TOC entry 313 (class 1259 OID 18526)
-- Name: order_claim; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.order_claim (
    id text NOT NULL,
    order_id text NOT NULL,
    return_id text,
    order_version integer NOT NULL,
    display_id integer NOT NULL,
    type public.order_claim_type_enum NOT NULL,
    no_notification boolean,
    refund_amount numeric,
    raw_refund_amount jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    canceled_at timestamp with time zone,
    created_by text
);


ALTER TABLE public.order_claim OWNER TO commerce;

--
-- TOC entry 312 (class 1259 OID 18525)
-- Name: order_claim_display_id_seq; Type: SEQUENCE; Schema: public; Owner: commerce
--

CREATE SEQUENCE public.order_claim_display_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_claim_display_id_seq OWNER TO commerce;

--
-- TOC entry 5376 (class 0 OID 0)
-- Dependencies: 312
-- Name: order_claim_display_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: commerce
--

ALTER SEQUENCE public.order_claim_display_id_seq OWNED BY public.order_claim.display_id;


--
-- TOC entry 314 (class 1259 OID 18549)
-- Name: order_claim_item; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.order_claim_item (
    id text NOT NULL,
    claim_id text NOT NULL,
    item_id text NOT NULL,
    is_additional_item boolean DEFAULT false NOT NULL,
    reason public.claim_reason_enum,
    quantity numeric NOT NULL,
    raw_quantity jsonb NOT NULL,
    note text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_claim_item OWNER TO commerce;

--
-- TOC entry 315 (class 1259 OID 18562)
-- Name: order_claim_item_image; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.order_claim_item_image (
    id text NOT NULL,
    claim_item_id text NOT NULL,
    url text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_claim_item_image OWNER TO commerce;

--
-- TOC entry 316 (class 1259 OID 18620)
-- Name: order_credit_line; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.order_credit_line (
    id text NOT NULL,
    order_id text NOT NULL,
    reference text,
    reference_id text,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.order_credit_line OWNER TO commerce;

--
-- TOC entry 290 (class 1259 OID 18172)
-- Name: order_display_id_seq; Type: SEQUENCE; Schema: public; Owner: commerce
--

CREATE SEQUENCE public.order_display_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_display_id_seq OWNER TO commerce;

--
-- TOC entry 5377 (class 0 OID 0)
-- Dependencies: 290
-- Name: order_display_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: commerce
--

ALTER SEQUENCE public.order_display_id_seq OWNED BY public."order".display_id;


--
-- TOC entry 310 (class 1259 OID 18492)
-- Name: order_exchange; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.order_exchange (
    id text NOT NULL,
    order_id text NOT NULL,
    return_id text,
    order_version integer NOT NULL,
    display_id integer NOT NULL,
    no_notification boolean,
    allow_backorder boolean DEFAULT false NOT NULL,
    difference_due numeric,
    raw_difference_due jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    canceled_at timestamp with time zone,
    created_by text
);


ALTER TABLE public.order_exchange OWNER TO commerce;

--
-- TOC entry 309 (class 1259 OID 18491)
-- Name: order_exchange_display_id_seq; Type: SEQUENCE; Schema: public; Owner: commerce
--

CREATE SEQUENCE public.order_exchange_display_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_exchange_display_id_seq OWNER TO commerce;

--
-- TOC entry 5378 (class 0 OID 0)
-- Dependencies: 309
-- Name: order_exchange_display_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: commerce
--

ALTER SEQUENCE public.order_exchange_display_id_seq OWNED BY public.order_exchange.display_id;


--
-- TOC entry 311 (class 1259 OID 18507)
-- Name: order_exchange_item; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.order_exchange_item (
    id text NOT NULL,
    exchange_id text NOT NULL,
    item_id text NOT NULL,
    quantity numeric NOT NULL,
    raw_quantity jsonb NOT NULL,
    note text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_exchange_item OWNER TO commerce;

--
-- TOC entry 357 (class 1259 OID 19499)
-- Name: order_fulfillment; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.order_fulfillment (
    order_id character varying(255) NOT NULL,
    fulfillment_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_fulfillment OWNER TO commerce;

--
-- TOC entry 296 (class 1259 OID 18254)
-- Name: order_item; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.order_item (
    id text NOT NULL,
    order_id text NOT NULL,
    version integer NOT NULL,
    item_id text NOT NULL,
    quantity numeric NOT NULL,
    raw_quantity jsonb NOT NULL,
    fulfilled_quantity numeric NOT NULL,
    raw_fulfilled_quantity jsonb DEFAULT '{"value": "0", "precision": 20}'::jsonb NOT NULL,
    shipped_quantity numeric NOT NULL,
    raw_shipped_quantity jsonb DEFAULT '{"value": "0", "precision": 20}'::jsonb NOT NULL,
    return_requested_quantity numeric NOT NULL,
    raw_return_requested_quantity jsonb DEFAULT '{"value": "0", "precision": 20}'::jsonb NOT NULL,
    return_received_quantity numeric NOT NULL,
    raw_return_received_quantity jsonb DEFAULT '{"value": "0", "precision": 20}'::jsonb NOT NULL,
    return_dismissed_quantity numeric NOT NULL,
    raw_return_dismissed_quantity jsonb DEFAULT '{"value": "0", "precision": 20}'::jsonb NOT NULL,
    written_off_quantity numeric NOT NULL,
    raw_written_off_quantity jsonb DEFAULT '{"value": "0", "precision": 20}'::jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    delivered_quantity numeric DEFAULT 0 NOT NULL,
    raw_delivered_quantity jsonb DEFAULT '{"value": "0", "precision": 20}'::jsonb NOT NULL,
    unit_price numeric,
    raw_unit_price jsonb,
    compare_at_unit_price numeric,
    raw_compare_at_unit_price jsonb
);


ALTER TABLE public.order_item OWNER TO commerce;

--
-- TOC entry 298 (class 1259 OID 18278)
-- Name: order_line_item; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.order_line_item (
    id text NOT NULL,
    totals_id text,
    title text NOT NULL,
    subtitle text,
    thumbnail text,
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
    is_custom_price boolean DEFAULT false NOT NULL,
    product_type_id text,
    is_giftcard boolean DEFAULT false NOT NULL
);


ALTER TABLE public.order_line_item OWNER TO commerce;

--
-- TOC entry 300 (class 1259 OID 18302)
-- Name: order_line_item_adjustment; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.order_line_item_adjustment (
    id text NOT NULL,
    description text,
    promotion_id text,
    code text,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    provider_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    item_id text NOT NULL,
    deleted_at timestamp with time zone,
    is_tax_inclusive boolean DEFAULT false NOT NULL,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.order_line_item_adjustment OWNER TO commerce;

--
-- TOC entry 299 (class 1259 OID 18292)
-- Name: order_line_item_tax_line; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.order_line_item_tax_line (
    id text NOT NULL,
    description text,
    tax_rate_id text,
    code text NOT NULL,
    rate numeric NOT NULL,
    raw_rate jsonb NOT NULL,
    provider_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    item_id text NOT NULL,
    deleted_at timestamp with time zone,
    metadata jsonb,
    data jsonb
);


ALTER TABLE public.order_line_item_tax_line OWNER TO commerce;

--
-- TOC entry 358 (class 1259 OID 19512)
-- Name: order_payment_collection; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.order_payment_collection (
    order_id character varying(255) NOT NULL,
    payment_collection_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_payment_collection OWNER TO commerce;

--
-- TOC entry 359 (class 1259 OID 19525)
-- Name: order_promotion; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.order_promotion (
    order_id character varying(255) NOT NULL,
    promotion_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_promotion OWNER TO commerce;

--
-- TOC entry 297 (class 1259 OID 18266)
-- Name: order_shipping; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.order_shipping (
    id text NOT NULL,
    order_id text NOT NULL,
    version integer NOT NULL,
    shipping_method_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    return_id text,
    claim_id text,
    exchange_id text
);


ALTER TABLE public.order_shipping OWNER TO commerce;

--
-- TOC entry 301 (class 1259 OID 18312)
-- Name: order_shipping_method; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.order_shipping_method (
    id text NOT NULL,
    name text NOT NULL,
    description jsonb,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    is_tax_inclusive boolean DEFAULT false NOT NULL,
    shipping_option_id text,
    data jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    is_custom_amount boolean DEFAULT false NOT NULL
);


ALTER TABLE public.order_shipping_method OWNER TO commerce;

--
-- TOC entry 302 (class 1259 OID 18323)
-- Name: order_shipping_method_adjustment; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.order_shipping_method_adjustment (
    id text NOT NULL,
    description text,
    promotion_id text,
    code text,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    provider_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    shipping_method_id text NOT NULL,
    deleted_at timestamp with time zone,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.order_shipping_method_adjustment OWNER TO commerce;

--
-- TOC entry 303 (class 1259 OID 18333)
-- Name: order_shipping_method_tax_line; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.order_shipping_method_tax_line (
    id text NOT NULL,
    description text,
    tax_rate_id text,
    code text NOT NULL,
    rate numeric NOT NULL,
    raw_rate jsonb NOT NULL,
    provider_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    shipping_method_id text NOT NULL,
    deleted_at timestamp with time zone,
    metadata jsonb,
    data jsonb
);


ALTER TABLE public.order_shipping_method_tax_line OWNER TO commerce;

--
-- TOC entry 292 (class 1259 OID 18214)
-- Name: order_summary; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.order_summary (
    id text NOT NULL,
    order_id text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    totals jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_summary OWNER TO commerce;

--
-- TOC entry 304 (class 1259 OID 18343)
-- Name: order_transaction; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.order_transaction (
    id text NOT NULL,
    order_id text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    currency_code text NOT NULL,
    reference text,
    reference_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    return_id text,
    claim_id text,
    exchange_id text
);


ALTER TABLE public.order_transaction OWNER TO commerce;

--
-- TOC entry 284 (class 1259 OID 18035)
-- Name: payment; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.payment (
    id text NOT NULL,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    currency_code text NOT NULL,
    provider_id text NOT NULL,
    data jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    captured_at timestamp with time zone,
    canceled_at timestamp with time zone,
    payment_collection_id text NOT NULL,
    payment_session_id text NOT NULL,
    metadata jsonb
);


ALTER TABLE public.payment OWNER TO commerce;

--
-- TOC entry 280 (class 1259 OID 17989)
-- Name: payment_collection; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.payment_collection (
    id text NOT NULL,
    currency_code text NOT NULL,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    authorized_amount numeric,
    raw_authorized_amount jsonb,
    captured_amount numeric,
    raw_captured_amount jsonb,
    refunded_amount numeric,
    raw_refunded_amount jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    completed_at timestamp with time zone,
    status text DEFAULT 'not_paid'::text NOT NULL,
    metadata jsonb,
    CONSTRAINT payment_collection_status_check CHECK ((status = ANY (ARRAY['not_paid'::text, 'awaiting'::text, 'authorized'::text, 'partially_authorized'::text, 'canceled'::text, 'failed'::text, 'partially_captured'::text, 'completed'::text])))
);


ALTER TABLE public.payment_collection OWNER TO commerce;

--
-- TOC entry 282 (class 1259 OID 18017)
-- Name: payment_collection_payment_providers; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.payment_collection_payment_providers (
    payment_collection_id text NOT NULL,
    payment_provider_id text NOT NULL
);


ALTER TABLE public.payment_collection_payment_providers OWNER TO commerce;

--
-- TOC entry 281 (class 1259 OID 18009)
-- Name: payment_provider; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.payment_provider (
    id text NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.payment_provider OWNER TO commerce;

--
-- TOC entry 283 (class 1259 OID 18024)
-- Name: payment_session; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.payment_session (
    id text NOT NULL,
    currency_code text NOT NULL,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    provider_id text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    context jsonb,
    status text DEFAULT 'pending'::text NOT NULL,
    authorized_at timestamp with time zone,
    payment_collection_id text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT payment_session_status_check CHECK ((status = ANY (ARRAY['authorized'::text, 'captured'::text, 'pending'::text, 'requires_more'::text, 'error'::text, 'canceled'::text, 'pending_authorization'::text])))
);


ALTER TABLE public.payment_session OWNER TO commerce;

--
-- TOC entry 240 (class 1259 OID 17020)
-- Name: price; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.price (
    id text NOT NULL,
    title text,
    price_set_id text NOT NULL,
    currency_code text NOT NULL,
    raw_amount jsonb NOT NULL,
    rules_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    price_list_id text,
    amount numeric NOT NULL,
    min_quantity numeric,
    max_quantity numeric,
    raw_min_quantity jsonb,
    raw_max_quantity jsonb
);


ALTER TABLE public.price OWNER TO commerce;

--
-- TOC entry 242 (class 1259 OID 17096)
-- Name: price_list; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.price_list (
    id text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    rules_count integer DEFAULT 0,
    title text NOT NULL,
    description text NOT NULL,
    type text DEFAULT 'sale'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    metadata jsonb,
    CONSTRAINT price_list_status_check CHECK ((status = ANY (ARRAY['active'::text, 'draft'::text]))),
    CONSTRAINT price_list_type_check CHECK ((type = ANY (ARRAY['sale'::text, 'override'::text])))
);


ALTER TABLE public.price_list OWNER TO commerce;

--
-- TOC entry 243 (class 1259 OID 17106)
-- Name: price_list_rule; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.price_list_rule (
    id text NOT NULL,
    price_list_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    value jsonb,
    attribute text DEFAULT ''::text NOT NULL
);


ALTER TABLE public.price_list_rule OWNER TO commerce;

--
-- TOC entry 244 (class 1259 OID 17201)
-- Name: price_preference; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.price_preference (
    id text NOT NULL,
    attribute text NOT NULL,
    value text,
    is_tax_inclusive boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.price_preference OWNER TO commerce;

--
-- TOC entry 241 (class 1259 OID 17051)
-- Name: price_rule; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.price_rule (
    id text NOT NULL,
    value text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    price_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    attribute text DEFAULT ''::text NOT NULL,
    operator text DEFAULT 'eq'::text NOT NULL,
    CONSTRAINT price_rule_operator_check CHECK ((operator = ANY (ARRAY['gte'::text, 'lte'::text, 'gt'::text, 'lt'::text, 'eq'::text])))
);


ALTER TABLE public.price_rule OWNER TO commerce;

--
-- TOC entry 239 (class 1259 OID 17011)
-- Name: price_set; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.price_set (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.price_set OWNER TO commerce;

--
-- TOC entry 224 (class 1259 OID 16534)
-- Name: product; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.product (
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


ALTER TABLE public.product OWNER TO commerce;

--
-- TOC entry 232 (class 1259 OID 16634)
-- Name: product_category; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.product_category (
    id text NOT NULL,
    name text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    handle text NOT NULL,
    mpath text NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    is_internal boolean DEFAULT false NOT NULL,
    rank integer DEFAULT 0 NOT NULL,
    parent_category_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    metadata jsonb,
    external_id text
);


ALTER TABLE public.product_category OWNER TO commerce;

--
-- TOC entry 234 (class 1259 OID 16664)
-- Name: product_category_product; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.product_category_product (
    product_id text NOT NULL,
    product_category_id text NOT NULL
);


ALTER TABLE public.product_category_product OWNER TO commerce;

--
-- TOC entry 231 (class 1259 OID 16623)
-- Name: product_collection; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.product_collection (
    id text NOT NULL,
    title text NOT NULL,
    handle text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    external_id text
);


ALTER TABLE public.product_collection OWNER TO commerce;

--
-- TOC entry 226 (class 1259 OID 16568)
-- Name: product_option; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.product_option (
    id text NOT NULL,
    title text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    is_exclusive boolean DEFAULT false NOT NULL
);


ALTER TABLE public.product_option OWNER TO commerce;

--
-- TOC entry 227 (class 1259 OID 16579)
-- Name: product_option_value; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.product_option_value (
    id text NOT NULL,
    value text NOT NULL,
    option_id text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    rank integer
);


ALTER TABLE public.product_option_value OWNER TO commerce;

--
-- TOC entry 237 (class 1259 OID 16859)
-- Name: product_product_option; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.product_product_option (
    id text NOT NULL,
    product_id text NOT NULL,
    product_option_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.product_product_option OWNER TO commerce;

--
-- TOC entry 238 (class 1259 OID 16882)
-- Name: product_product_option_value; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.product_product_option_value (
    id text NOT NULL,
    product_product_option_id text NOT NULL,
    product_option_value_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.product_product_option_value OWNER TO commerce;

--
-- TOC entry 361 (class 1259 OID 19551)
-- Name: product_sales_channel; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.product_sales_channel (
    product_id character varying(255) NOT NULL,
    sales_channel_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.product_sales_channel OWNER TO commerce;

--
-- TOC entry 362 (class 1259 OID 19564)
-- Name: product_shipping_profile; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.product_shipping_profile (
    product_id character varying(255) NOT NULL,
    shipping_profile_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.product_shipping_profile OWNER TO commerce;

--
-- TOC entry 229 (class 1259 OID 16601)
-- Name: product_tag; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.product_tag (
    id text NOT NULL,
    value text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    external_id text
);


ALTER TABLE public.product_tag OWNER TO commerce;

--
-- TOC entry 233 (class 1259 OID 16650)
-- Name: product_tags; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.product_tags (
    product_id text NOT NULL,
    product_tag_id text NOT NULL
);


ALTER TABLE public.product_tags OWNER TO commerce;

--
-- TOC entry 230 (class 1259 OID 16612)
-- Name: product_type; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.product_type (
    id text NOT NULL,
    value text NOT NULL,
    metadata json,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    external_id text
);


ALTER TABLE public.product_type OWNER TO commerce;

--
-- TOC entry 225 (class 1259 OID 16550)
-- Name: product_variant; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.product_variant (
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


ALTER TABLE public.product_variant OWNER TO commerce;

--
-- TOC entry 363 (class 1259 OID 19577)
-- Name: product_variant_inventory_item; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.product_variant_inventory_item (
    variant_id character varying(255) NOT NULL,
    inventory_item_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    required_quantity numeric DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.product_variant_inventory_item OWNER TO commerce;

--
-- TOC entry 235 (class 1259 OID 16671)
-- Name: product_variant_option; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.product_variant_option (
    variant_id text NOT NULL,
    option_value_id text NOT NULL
);


ALTER TABLE public.product_variant_option OWNER TO commerce;

--
-- TOC entry 364 (class 1259 OID 19591)
-- Name: product_variant_price_set; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.product_variant_price_set (
    variant_id character varying(255) NOT NULL,
    price_set_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.product_variant_price_set OWNER TO commerce;

--
-- TOC entry 236 (class 1259 OID 16842)
-- Name: product_variant_product_image; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.product_variant_product_image (
    id text NOT NULL,
    variant_id text NOT NULL,
    image_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.product_variant_product_image OWNER TO commerce;

--
-- TOC entry 247 (class 1259 OID 17292)
-- Name: promotion; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.promotion (
    id text NOT NULL,
    code text NOT NULL,
    campaign_id text,
    is_automatic boolean DEFAULT false NOT NULL,
    type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    status text DEFAULT 'draft'::text NOT NULL,
    is_tax_inclusive boolean DEFAULT false NOT NULL,
    "limit" integer,
    used integer DEFAULT 0 NOT NULL,
    metadata jsonb,
    CONSTRAINT promotion_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'inactive'::text]))),
    CONSTRAINT promotion_type_check CHECK ((type = ANY (ARRAY['standard'::text, 'buyget'::text])))
);


ALTER TABLE public.promotion OWNER TO commerce;

--
-- TOC entry 248 (class 1259 OID 17307)
-- Name: promotion_application_method; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.promotion_application_method (
    id text NOT NULL,
    value numeric,
    raw_value jsonb,
    max_quantity integer,
    apply_to_quantity integer,
    buy_rules_min_quantity integer,
    type text NOT NULL,
    target_type text NOT NULL,
    allocation text,
    promotion_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    currency_code text,
    CONSTRAINT promotion_application_method_allocation_check CHECK ((allocation = ANY (ARRAY['each'::text, 'across'::text, 'once'::text]))),
    CONSTRAINT promotion_application_method_target_type_check CHECK ((target_type = ANY (ARRAY['order'::text, 'shipping_methods'::text, 'items'::text]))),
    CONSTRAINT promotion_application_method_type_check CHECK ((type = ANY (ARRAY['fixed'::text, 'percentage'::text])))
);


ALTER TABLE public.promotion_application_method OWNER TO commerce;

--
-- TOC entry 245 (class 1259 OID 17267)
-- Name: promotion_campaign; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.promotion_campaign (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    campaign_identifier text NOT NULL,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.promotion_campaign OWNER TO commerce;

--
-- TOC entry 246 (class 1259 OID 17278)
-- Name: promotion_campaign_budget; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.promotion_campaign_budget (
    id text NOT NULL,
    type text NOT NULL,
    campaign_id text NOT NULL,
    "limit" numeric,
    raw_limit jsonb,
    used numeric DEFAULT 0 NOT NULL,
    raw_used jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    currency_code text,
    attribute text,
    CONSTRAINT promotion_campaign_budget_type_check CHECK ((type = ANY (ARRAY['spend'::text, 'usage'::text, 'use_by_attribute'::text, 'spend_by_attribute'::text])))
);


ALTER TABLE public.promotion_campaign_budget OWNER TO commerce;

--
-- TOC entry 254 (class 1259 OID 17480)
-- Name: promotion_campaign_budget_usage; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.promotion_campaign_budget_usage (
    id text NOT NULL,
    attribute_value text NOT NULL,
    used numeric DEFAULT 0 NOT NULL,
    budget_id text NOT NULL,
    raw_used jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.promotion_campaign_budget_usage OWNER TO commerce;

--
-- TOC entry 250 (class 1259 OID 17336)
-- Name: promotion_promotion_rule; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.promotion_promotion_rule (
    promotion_id text NOT NULL,
    promotion_rule_id text NOT NULL
);


ALTER TABLE public.promotion_promotion_rule OWNER TO commerce;

--
-- TOC entry 249 (class 1259 OID 17324)
-- Name: promotion_rule; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.promotion_rule (
    id text NOT NULL,
    description text,
    attribute text NOT NULL,
    operator text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT promotion_rule_operator_check CHECK ((operator = ANY (ARRAY['gte'::text, 'lte'::text, 'gt'::text, 'lt'::text, 'eq'::text, 'ne'::text, 'in'::text])))
);


ALTER TABLE public.promotion_rule OWNER TO commerce;

--
-- TOC entry 253 (class 1259 OID 17357)
-- Name: promotion_rule_value; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.promotion_rule_value (
    id text NOT NULL,
    promotion_rule_id text NOT NULL,
    value text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.promotion_rule_value OWNER TO commerce;

--
-- TOC entry 319 (class 1259 OID 18760)
-- Name: property_label; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.property_label (
    id text NOT NULL,
    entity text NOT NULL,
    property text NOT NULL,
    label text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.property_label OWNER TO commerce;

--
-- TOC entry 322 (class 1259 OID 18794)
-- Name: provider_identity; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.provider_identity (
    id text NOT NULL,
    entity_id text NOT NULL,
    provider text NOT NULL,
    auth_identity_id text NOT NULL,
    user_metadata jsonb,
    provider_metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.provider_identity OWNER TO commerce;

--
-- TOC entry 365 (class 1259 OID 19604)
-- Name: publishable_api_key_sales_channel; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.publishable_api_key_sales_channel (
    publishable_key_id character varying(255) NOT NULL,
    sales_channel_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.publishable_api_key_sales_channel OWNER TO commerce;

--
-- TOC entry 285 (class 1259 OID 18044)
-- Name: refund; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.refund (
    id text NOT NULL,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    payment_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by text,
    metadata jsonb,
    refund_reason_id text,
    note text
);


ALTER TABLE public.refund OWNER TO commerce;

--
-- TOC entry 287 (class 1259 OID 18103)
-- Name: refund_reason; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.refund_reason (
    id text NOT NULL,
    label text NOT NULL,
    description text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    code text NOT NULL
);


ALTER TABLE public.refund_reason OWNER TO commerce;

--
-- TOC entry 269 (class 1259 OID 17813)
-- Name: region; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.region (
    id text NOT NULL,
    name text NOT NULL,
    currency_code text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    automatic_taxes boolean DEFAULT true NOT NULL
);


ALTER TABLE public.region OWNER TO commerce;

--
-- TOC entry 270 (class 1259 OID 17824)
-- Name: region_country; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.region_country (
    iso_2 text NOT NULL,
    iso_3 text NOT NULL,
    num_code text NOT NULL,
    name text NOT NULL,
    display_name text NOT NULL,
    region_id text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.region_country OWNER TO commerce;

--
-- TOC entry 366 (class 1259 OID 19617)
-- Name: region_payment_provider; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.region_payment_provider (
    region_id character varying(255) NOT NULL,
    payment_provider_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.region_payment_provider OWNER TO commerce;

--
-- TOC entry 223 (class 1259 OID 16458)
-- Name: reservation_item; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.reservation_item (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    line_item_id text,
    location_id text NOT NULL,
    quantity numeric NOT NULL,
    external_id text,
    description text,
    created_by text,
    metadata jsonb,
    inventory_item_id text NOT NULL,
    allow_backorder boolean DEFAULT false,
    raw_quantity jsonb
);


ALTER TABLE public.reservation_item OWNER TO commerce;

--
-- TOC entry 307 (class 1259 OID 18462)
-- Name: return; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.return (
    id text NOT NULL,
    order_id text NOT NULL,
    claim_id text,
    exchange_id text,
    order_version integer NOT NULL,
    display_id integer NOT NULL,
    status public.return_status_enum DEFAULT 'open'::public.return_status_enum NOT NULL,
    no_notification boolean,
    refund_amount numeric,
    raw_refund_amount jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    received_at timestamp with time zone,
    canceled_at timestamp with time zone,
    location_id text,
    requested_at timestamp with time zone,
    created_by text
);


ALTER TABLE public.return OWNER TO commerce;

--
-- TOC entry 306 (class 1259 OID 18461)
-- Name: return_display_id_seq; Type: SEQUENCE; Schema: public; Owner: commerce
--

CREATE SEQUENCE public.return_display_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.return_display_id_seq OWNER TO commerce;

--
-- TOC entry 5379 (class 0 OID 0)
-- Dependencies: 306
-- Name: return_display_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: commerce
--

ALTER SEQUENCE public.return_display_id_seq OWNED BY public.return.display_id;


--
-- TOC entry 360 (class 1259 OID 19538)
-- Name: return_fulfillment; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.return_fulfillment (
    return_id character varying(255) NOT NULL,
    fulfillment_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.return_fulfillment OWNER TO commerce;

--
-- TOC entry 308 (class 1259 OID 18477)
-- Name: return_item; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.return_item (
    id text NOT NULL,
    return_id text NOT NULL,
    reason_id text,
    item_id text NOT NULL,
    quantity numeric NOT NULL,
    raw_quantity jsonb NOT NULL,
    received_quantity numeric DEFAULT 0 NOT NULL,
    raw_received_quantity jsonb DEFAULT '{"value": "0", "precision": 20}'::jsonb NOT NULL,
    note text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    damaged_quantity numeric DEFAULT 0 NOT NULL,
    raw_damaged_quantity jsonb DEFAULT '{"value": "0", "precision": 20}'::jsonb NOT NULL
);


ALTER TABLE public.return_item OWNER TO commerce;

--
-- TOC entry 305 (class 1259 OID 18356)
-- Name: return_reason; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.return_reason (
    id character varying NOT NULL,
    value character varying NOT NULL,
    label character varying NOT NULL,
    description character varying,
    metadata jsonb,
    parent_return_reason_id character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.return_reason OWNER TO commerce;

--
-- TOC entry 259 (class 1259 OID 17583)
-- Name: sales_channel; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.sales_channel (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    is_disabled boolean DEFAULT false NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.sales_channel OWNER TO commerce;

--
-- TOC entry 367 (class 1259 OID 19630)
-- Name: sales_channel_stock_location; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.sales_channel_stock_location (
    sales_channel_id character varying(255) NOT NULL,
    stock_location_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.sales_channel_stock_location OWNER TO commerce;

--
-- TOC entry 371 (class 1259 OID 19670)
-- Name: script_migrations; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.script_migrations (
    id integer NOT NULL,
    script_name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    finished_at timestamp with time zone
);


ALTER TABLE public.script_migrations OWNER TO commerce;

--
-- TOC entry 370 (class 1259 OID 19669)
-- Name: script_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: commerce
--

CREATE SEQUENCE public.script_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.script_migrations_id_seq OWNER TO commerce;

--
-- TOC entry 5380 (class 0 OID 0)
-- Dependencies: 370
-- Name: script_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: commerce
--

ALTER SEQUENCE public.script_migrations_id_seq OWNED BY public.script_migrations.id;


--
-- TOC entry 343 (class 1259 OID 19209)
-- Name: search_index; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.search_index (
    id text NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    active_version integer
);


ALTER TABLE public.search_index OWNER TO commerce;

--
-- TOC entry 344 (class 1259 OID 19222)
-- Name: search_index_sync; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.search_index_sync (
    id text NOT NULL,
    job_id text,
    status text DEFAULT 'pending'::text NOT NULL,
    filters jsonb,
    last_key text,
    documents_synced integer DEFAULT 0 NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    error text,
    search_index_version_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    resumable boolean DEFAULT true NOT NULL,
    CONSTRAINT search_index_sync_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'done'::text, 'failed'::text, 'canceled'::text])))
);


ALTER TABLE public.search_index_sync OWNER TO commerce;

--
-- TOC entry 345 (class 1259 OID 19242)
-- Name: search_index_version; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.search_index_version (
    id text NOT NULL,
    version integer NOT NULL,
    provider text NOT NULL,
    physical_name text NOT NULL,
    definition_hash text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    search_index_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT search_index_version_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'building'::text, 'ready'::text, 'error'::text])))
);


ALTER TABLE public.search_index_version OWNER TO commerce;

--
-- TOC entry 346 (class 1259 OID 19357)
-- Name: search_postgres_index; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.search_postgres_index (
    name text NOT NULL,
    table_name text NOT NULL,
    schema_hash text NOT NULL,
    plan jsonb NOT NULL,
    document_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.search_postgres_index OWNER TO commerce;

--
-- TOC entry 332 (class 1259 OID 18969)
-- Name: service_zone; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.service_zone (
    id text NOT NULL,
    name text NOT NULL,
    metadata jsonb,
    fulfillment_set_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.service_zone OWNER TO commerce;

--
-- TOC entry 336 (class 1259 OID 19018)
-- Name: shipping_option; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.shipping_option (
    id text NOT NULL,
    name text NOT NULL,
    price_type text DEFAULT 'flat'::text NOT NULL,
    service_zone_id text NOT NULL,
    shipping_profile_id text,
    provider_id text,
    data jsonb,
    metadata jsonb,
    shipping_option_type_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT shipping_option_price_type_check CHECK ((price_type = ANY (ARRAY['calculated'::text, 'flat'::text])))
);


ALTER TABLE public.shipping_option OWNER TO commerce;

--
-- TOC entry 368 (class 1259 OID 19643)
-- Name: shipping_option_price_set; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.shipping_option_price_set (
    shipping_option_id character varying(255) NOT NULL,
    price_set_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.shipping_option_price_set OWNER TO commerce;

--
-- TOC entry 337 (class 1259 OID 19036)
-- Name: shipping_option_rule; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.shipping_option_rule (
    id text NOT NULL,
    attribute text NOT NULL,
    operator text NOT NULL,
    value jsonb,
    shipping_option_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT shipping_option_rule_operator_check CHECK ((operator = ANY (ARRAY['in'::text, 'eq'::text, 'ne'::text, 'gt'::text, 'gte'::text, 'lt'::text, 'lte'::text, 'nin'::text])))
);


ALTER TABLE public.shipping_option_rule OWNER TO commerce;

--
-- TOC entry 334 (class 1259 OID 18997)
-- Name: shipping_option_type; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.shipping_option_type (
    id text NOT NULL,
    label text NOT NULL,
    description text,
    code text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.shipping_option_type OWNER TO commerce;

--
-- TOC entry 335 (class 1259 OID 19007)
-- Name: shipping_profile; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.shipping_profile (
    id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.shipping_profile OWNER TO commerce;

--
-- TOC entry 220 (class 1259 OID 16407)
-- Name: stock_location; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.stock_location (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    name text NOT NULL,
    address_id text,
    metadata jsonb
);


ALTER TABLE public.stock_location OWNER TO commerce;

--
-- TOC entry 219 (class 1259 OID 16397)
-- Name: stock_location_address; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.stock_location_address (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    address_1 text NOT NULL,
    address_2 text,
    company text,
    city text,
    country_code text NOT NULL,
    phone text,
    province text,
    postal_code text,
    metadata jsonb
);


ALTER TABLE public.stock_location_address OWNER TO commerce;

--
-- TOC entry 272 (class 1259 OID 17857)
-- Name: store; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.store (
    id text NOT NULL,
    name text DEFAULT 'Medusa Store'::text NOT NULL,
    default_sales_channel_id text,
    default_region_id text,
    default_location_id text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.store OWNER TO commerce;

--
-- TOC entry 273 (class 1259 OID 17869)
-- Name: store_currency; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.store_currency (
    id text NOT NULL,
    currency_code text NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    store_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.store_currency OWNER TO commerce;

--
-- TOC entry 274 (class 1259 OID 17886)
-- Name: store_locale; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.store_locale (
    id text NOT NULL,
    locale_code text NOT NULL,
    store_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.store_locale OWNER TO commerce;

--
-- TOC entry 275 (class 1259 OID 17903)
-- Name: tax_provider; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.tax_provider (
    id text NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.tax_provider OWNER TO commerce;

--
-- TOC entry 277 (class 1259 OID 17925)
-- Name: tax_rate; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.tax_rate (
    id text NOT NULL,
    rate real,
    code text NOT NULL,
    name text NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    is_combinable boolean DEFAULT false NOT NULL,
    tax_region_id text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text,
    deleted_at timestamp with time zone
);


ALTER TABLE public.tax_rate OWNER TO commerce;

--
-- TOC entry 278 (class 1259 OID 17939)
-- Name: tax_rate_rule; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.tax_rate_rule (
    id text NOT NULL,
    tax_rate_id text NOT NULL,
    reference_id text NOT NULL,
    reference text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text,
    deleted_at timestamp with time zone
);


ALTER TABLE public.tax_rate_rule OWNER TO commerce;

--
-- TOC entry 276 (class 1259 OID 17911)
-- Name: tax_region; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.tax_region (
    id text NOT NULL,
    provider_id text,
    country_code text NOT NULL,
    province_code text,
    parent_id text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text,
    deleted_at timestamp with time zone,
    CONSTRAINT "CK_tax_region_country_top_level" CHECK (((parent_id IS NULL) OR (province_code IS NOT NULL))),
    CONSTRAINT "CK_tax_region_provider_top_level" CHECK (((parent_id IS NULL) OR (provider_id IS NULL)))
);


ALTER TABLE public.tax_region OWNER TO commerce;

--
-- TOC entry 328 (class 1259 OID 18926)
-- Name: user; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public."user" (
    id text NOT NULL,
    first_name text,
    last_name text,
    email text NOT NULL,
    avatar_url text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public."user" OWNER TO commerce;

--
-- TOC entry 317 (class 1259 OID 18734)
-- Name: user_preference; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.user_preference (
    id text NOT NULL,
    user_id text NOT NULL,
    key text NOT NULL,
    value jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.user_preference OWNER TO commerce;

--
-- TOC entry 369 (class 1259 OID 19656)
-- Name: user_rbac_role; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.user_rbac_role (
    user_id character varying(255) NOT NULL,
    rbac_role_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.user_rbac_role OWNER TO commerce;

--
-- TOC entry 318 (class 1259 OID 18746)
-- Name: view_configuration; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.view_configuration (
    id text NOT NULL,
    entity text NOT NULL,
    name text,
    user_id text,
    is_system_default boolean DEFAULT false NOT NULL,
    configuration jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.view_configuration OWNER TO commerce;

--
-- TOC entry 347 (class 1259 OID 19367)
-- Name: workflow_execution; Type: TABLE; Schema: public; Owner: commerce
--

CREATE TABLE public.workflow_execution (
    id character varying NOT NULL,
    workflow_id character varying NOT NULL,
    transaction_id character varying NOT NULL,
    execution jsonb,
    context jsonb,
    state character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone,
    retention_time integer,
    run_id text DEFAULT '01M555352SKEH8GAFHF95M6AWZ'::text NOT NULL
);


ALTER TABLE public.workflow_execution OWNER TO commerce;

--
-- TOC entry 4307 (class 2604 OID 19399)
-- Name: link_module_migrations id; Type: DEFAULT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.link_module_migrations ALTER COLUMN id SET DEFAULT nextval('public.link_module_migrations_id_seq'::regclass);


--
-- TOC entry 3961 (class 2604 OID 16393)
-- Name: mikro_orm_migrations id; Type: DEFAULT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.mikro_orm_migrations ALTER COLUMN id SET DEFAULT nextval('public.mikro_orm_migrations_id_seq'::regclass);


--
-- TOC entry 4147 (class 2604 OID 18176)
-- Name: order display_id; Type: DEFAULT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public."order" ALTER COLUMN display_id SET DEFAULT nextval('public.order_display_id_seq'::regclass);


--
-- TOC entry 4159 (class 2604 OID 18243)
-- Name: order_change_action ordering; Type: DEFAULT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_change_action ALTER COLUMN ordering SET DEFAULT nextval('public.order_change_action_ordering_seq'::regclass);


--
-- TOC entry 4218 (class 2604 OID 18529)
-- Name: order_claim display_id; Type: DEFAULT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_claim ALTER COLUMN display_id SET DEFAULT nextval('public.order_claim_display_id_seq'::regclass);


--
-- TOC entry 4212 (class 2604 OID 18495)
-- Name: order_exchange display_id; Type: DEFAULT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_exchange ALTER COLUMN display_id SET DEFAULT nextval('public.order_exchange_display_id_seq'::regclass);


--
-- TOC entry 4202 (class 2604 OID 18465)
-- Name: return display_id; Type: DEFAULT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.return ALTER COLUMN display_id SET DEFAULT nextval('public.return_display_id_seq'::regclass);


--
-- TOC entry 4351 (class 2604 OID 19673)
-- Name: script_migrations id; Type: DEFAULT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.script_migrations ALTER COLUMN id SET DEFAULT nextval('public.script_migrations_id_seq'::regclass);


--
-- TOC entry 4711 (class 2606 OID 18146)
-- Name: account_holder account_holder_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.account_holder
    ADD CONSTRAINT account_holder_pkey PRIMARY KEY (id);


--
-- TOC entry 4642 (class 2606 OID 17848)
-- Name: api_key api_key_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.api_key
    ADD CONSTRAINT api_key_pkey PRIMARY KEY (id);


--
-- TOC entry 4546 (class 2606 OID 17356)
-- Name: application_method_buy_rules application_method_buy_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.application_method_buy_rules
    ADD CONSTRAINT application_method_buy_rules_pkey PRIMARY KEY (application_method_id, promotion_rule_id);


--
-- TOC entry 4544 (class 2606 OID 17349)
-- Name: application_method_target_rules application_method_target_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.application_method_target_rules
    ADD CONSTRAINT application_method_target_rules_pkey PRIMARY KEY (application_method_id, promotion_rule_id);


--
-- TOC entry 4868 (class 2606 OID 18791)
-- Name: auth_identity auth_identity_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.auth_identity
    ADD CONSTRAINT auth_identity_pkey PRIMARY KEY (id);


--
-- TOC entry 4878 (class 2606 OID 18822)
-- Name: auth_mfa_factor auth_mfa_factor_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.auth_mfa_factor
    ADD CONSTRAINT auth_mfa_factor_pkey PRIMARY KEY (id);


--
-- TOC entry 4883 (class 2606 OID 18834)
-- Name: auth_mfa_recovery_code auth_mfa_recovery_code_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.auth_mfa_recovery_code
    ADD CONSTRAINT auth_mfa_recovery_code_pkey PRIMARY KEY (id);


--
-- TOC entry 4890 (class 2606 OID 18880)
-- Name: auth_password_reset_token auth_password_reset_token_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.auth_password_reset_token
    ADD CONSTRAINT auth_password_reset_token_pkey PRIMARY KEY (id);


--
-- TOC entry 4895 (class 2606 OID 18904)
-- Name: auth_verification auth_verification_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.auth_verification
    ADD CONSTRAINT auth_verification_pkey PRIMARY KEY (id);


--
-- TOC entry 4704 (class 2606 OID 18061)
-- Name: capture capture_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.capture
    ADD CONSTRAINT capture_pkey PRIMARY KEY (id);


--
-- TOC entry 4591 (class 2606 OID 17617)
-- Name: cart_address cart_address_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.cart_address
    ADD CONSTRAINT cart_address_pkey PRIMARY KEY (id);


--
-- TOC entry 4602 (class 2606 OID 17653)
-- Name: cart_line_item_adjustment cart_line_item_adjustment_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.cart_line_item_adjustment
    ADD CONSTRAINT cart_line_item_adjustment_pkey PRIMARY KEY (id);


--
-- TOC entry 4597 (class 2606 OID 17630)
-- Name: cart_line_item cart_line_item_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.cart_line_item
    ADD CONSTRAINT cart_line_item_pkey PRIMARY KEY (id);


--
-- TOC entry 4607 (class 2606 OID 17664)
-- Name: cart_line_item_tax_line cart_line_item_tax_line_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.cart_line_item_tax_line
    ADD CONSTRAINT cart_line_item_tax_line_pkey PRIMARY KEY (id);


--
-- TOC entry 5007 (class 2606 OID 19416)
-- Name: cart_payment_collection cart_payment_collection_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.cart_payment_collection
    ADD CONSTRAINT cart_payment_collection_pkey PRIMARY KEY (cart_id, payment_collection_id);


--
-- TOC entry 4588 (class 2606 OID 17602)
-- Name: cart cart_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_pkey PRIMARY KEY (id);


--
-- TOC entry 5013 (class 2606 OID 19429)
-- Name: cart_promotion cart_promotion_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.cart_promotion
    ADD CONSTRAINT cart_promotion_pkey PRIMARY KEY (cart_id, promotion_id);


--
-- TOC entry 4617 (class 2606 OID 17688)
-- Name: cart_shipping_method_adjustment cart_shipping_method_adjustment_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.cart_shipping_method_adjustment
    ADD CONSTRAINT cart_shipping_method_adjustment_pkey PRIMARY KEY (id);


--
-- TOC entry 4612 (class 2606 OID 17677)
-- Name: cart_shipping_method cart_shipping_method_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.cart_shipping_method
    ADD CONSTRAINT cart_shipping_method_pkey PRIMARY KEY (id);


--
-- TOC entry 4622 (class 2606 OID 17699)
-- Name: cart_shipping_method_tax_line cart_shipping_method_tax_line_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.cart_shipping_method_tax_line
    ADD CONSTRAINT cart_shipping_method_tax_line_pkey PRIMARY KEY (id);


--
-- TOC entry 4627 (class 2606 OID 17802)
-- Name: credit_line credit_line_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.credit_line
    ADD CONSTRAINT credit_line_pkey PRIMARY KEY (id);


--
-- TOC entry 4676 (class 2606 OID 17988)
-- Name: currency currency_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.currency
    ADD CONSTRAINT currency_pkey PRIMARY KEY (code);


--
-- TOC entry 5019 (class 2606 OID 19442)
-- Name: customer_account_holder customer_account_holder_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.customer_account_holder
    ADD CONSTRAINT customer_account_holder_pkey PRIMARY KEY (customer_id, account_holder_id);


--
-- TOC entry 4567 (class 2606 OID 17526)
-- Name: customer_address customer_address_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.customer_address
    ADD CONSTRAINT customer_address_pkey PRIMARY KEY (id);


--
-- TOC entry 4576 (class 2606 OID 17548)
-- Name: customer_group_customer customer_group_customer_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.customer_group_customer
    ADD CONSTRAINT customer_group_customer_pkey PRIMARY KEY (id);


--
-- TOC entry 4571 (class 2606 OID 17538)
-- Name: customer_group customer_group_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.customer_group
    ADD CONSTRAINT customer_group_pkey PRIMARY KEY (id);


--
-- TOC entry 4561 (class 2606 OID 17515)
-- Name: customer customer_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_pkey PRIMARY KEY (id);


--
-- TOC entry 4907 (class 2606 OID 18948)
-- Name: fulfillment_address fulfillment_address_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.fulfillment_address
    ADD CONSTRAINT fulfillment_address_pkey PRIMARY KEY (id);


--
-- TOC entry 4959 (class 2606 OID 19082)
-- Name: fulfillment_item fulfillment_item_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.fulfillment_item
    ADD CONSTRAINT fulfillment_item_pkey PRIMARY KEY (id);


--
-- TOC entry 4953 (class 2606 OID 19071)
-- Name: fulfillment_label fulfillment_label_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.fulfillment_label
    ADD CONSTRAINT fulfillment_label_pkey PRIMARY KEY (id);


--
-- TOC entry 4949 (class 2606 OID 19056)
-- Name: fulfillment fulfillment_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.fulfillment
    ADD CONSTRAINT fulfillment_pkey PRIMARY KEY (id);


--
-- TOC entry 4910 (class 2606 OID 18957)
-- Name: fulfillment_provider fulfillment_provider_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.fulfillment_provider
    ADD CONSTRAINT fulfillment_provider_pkey PRIMARY KEY (id);


--
-- TOC entry 4914 (class 2606 OID 18966)
-- Name: fulfillment_set fulfillment_set_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.fulfillment_set
    ADD CONSTRAINT fulfillment_set_pkey PRIMARY KEY (id);


--
-- TOC entry 4926 (class 2606 OID 18991)
-- Name: geo_zone geo_zone_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.geo_zone
    ADD CONSTRAINT geo_zone_pkey PRIMARY KEY (id);


--
-- TOC entry 4436 (class 2606 OID 16598)
-- Name: image image_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.image
    ADD CONSTRAINT image_pkey PRIMARY KEY (id);


--
-- TOC entry 4391 (class 2606 OID 16440)
-- Name: inventory_item inventory_item_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.inventory_item
    ADD CONSTRAINT inventory_item_pkey PRIMARY KEY (id);


--
-- TOC entry 4397 (class 2606 OID 16454)
-- Name: inventory_level inventory_level_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.inventory_level
    ADD CONSTRAINT inventory_level_pkey PRIMARY KEY (id);


--
-- TOC entry 4900 (class 2606 OID 18922)
-- Name: invite invite_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.invite
    ADD CONSTRAINT invite_pkey PRIMARY KEY (id);


--
-- TOC entry 5037 (class 2606 OID 19481)
-- Name: invite_rbac_role invite_rbac_role_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.invite_rbac_role
    ADD CONSTRAINT invite_rbac_role_pkey PRIMARY KEY (invite_id, rbac_role_id);


--
-- TOC entry 4865 (class 2606 OID 18781)
-- Name: layout_configuration layout_configuration_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.layout_configuration
    ADD CONSTRAINT layout_configuration_pkey PRIMARY KEY (id);


--
-- TOC entry 4999 (class 2606 OID 19405)
-- Name: link_module_migrations link_module_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.link_module_migrations
    ADD CONSTRAINT link_module_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 5001 (class 2606 OID 19407)
-- Name: link_module_migrations link_module_migrations_table_name_key; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.link_module_migrations
    ADD CONSTRAINT link_module_migrations_table_name_key UNIQUE (table_name);


--
-- TOC entry 5025 (class 2606 OID 19455)
-- Name: location_fulfillment_provider location_fulfillment_provider_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.location_fulfillment_provider
    ADD CONSTRAINT location_fulfillment_provider_pkey PRIMARY KEY (stock_location_id, fulfillment_provider_id);


--
-- TOC entry 5031 (class 2606 OID 19468)
-- Name: location_fulfillment_set location_fulfillment_set_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.location_fulfillment_set
    ADD CONSTRAINT location_fulfillment_set_pkey PRIMARY KEY (stock_location_id, fulfillment_set_id);


--
-- TOC entry 4380 (class 2606 OID 16396)
-- Name: mikro_orm_migrations mikro_orm_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.mikro_orm_migrations
    ADD CONSTRAINT mikro_orm_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 4968 (class 2606 OID 19191)
-- Name: notification notification_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_pkey PRIMARY KEY (id);


--
-- TOC entry 4962 (class 2606 OID 19183)
-- Name: notification_provider notification_provider_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.notification_provider
    ADD CONSTRAINT notification_provider_pkey PRIMARY KEY (id);


--
-- TOC entry 4715 (class 2606 OID 18170)
-- Name: order_address order_address_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_address
    ADD CONSTRAINT order_address_pkey PRIMARY KEY (id);


--
-- TOC entry 5043 (class 2606 OID 19494)
-- Name: order_cart order_cart_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_cart
    ADD CONSTRAINT order_cart_pkey PRIMARY KEY (order_id, cart_id);


--
-- TOC entry 4751 (class 2606 OID 18250)
-- Name: order_change_action order_change_action_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_change_action
    ADD CONSTRAINT order_change_action_pkey PRIMARY KEY (id);


--
-- TOC entry 4742 (class 2606 OID 18235)
-- Name: order_change order_change_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_change
    ADD CONSTRAINT order_change_pkey PRIMARY KEY (id);


--
-- TOC entry 4839 (class 2606 OID 18570)
-- Name: order_claim_item_image order_claim_item_image_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_claim_item_image
    ADD CONSTRAINT order_claim_item_image_pkey PRIMARY KEY (id);


--
-- TOC entry 4835 (class 2606 OID 18558)
-- Name: order_claim_item order_claim_item_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_claim_item
    ADD CONSTRAINT order_claim_item_pkey PRIMARY KEY (id);


--
-- TOC entry 4830 (class 2606 OID 18535)
-- Name: order_claim order_claim_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_claim
    ADD CONSTRAINT order_claim_pkey PRIMARY KEY (id);


--
-- TOC entry 4844 (class 2606 OID 18628)
-- Name: order_credit_line order_credit_line_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_credit_line
    ADD CONSTRAINT order_credit_line_pkey PRIMARY KEY (id);


--
-- TOC entry 4824 (class 2606 OID 18515)
-- Name: order_exchange_item order_exchange_item_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_exchange_item
    ADD CONSTRAINT order_exchange_item_pkey PRIMARY KEY (id);


--
-- TOC entry 4819 (class 2606 OID 18502)
-- Name: order_exchange order_exchange_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_exchange
    ADD CONSTRAINT order_exchange_pkey PRIMARY KEY (id);


--
-- TOC entry 5049 (class 2606 OID 19507)
-- Name: order_fulfillment order_fulfillment_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_fulfillment
    ADD CONSTRAINT order_fulfillment_pkey PRIMARY KEY (order_id, fulfillment_id);


--
-- TOC entry 4757 (class 2606 OID 18262)
-- Name: order_item order_item_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_item
    ADD CONSTRAINT order_item_pkey PRIMARY KEY (id);


--
-- TOC entry 4778 (class 2606 OID 18310)
-- Name: order_line_item_adjustment order_line_item_adjustment_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_line_item_adjustment
    ADD CONSTRAINT order_line_item_adjustment_pkey PRIMARY KEY (id);


--
-- TOC entry 4772 (class 2606 OID 18289)
-- Name: order_line_item order_line_item_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_line_item
    ADD CONSTRAINT order_line_item_pkey PRIMARY KEY (id);


--
-- TOC entry 4775 (class 2606 OID 18300)
-- Name: order_line_item_tax_line order_line_item_tax_line_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_line_item_tax_line
    ADD CONSTRAINT order_line_item_tax_line_pkey PRIMARY KEY (id);


--
-- TOC entry 5055 (class 2606 OID 19520)
-- Name: order_payment_collection order_payment_collection_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_payment_collection
    ADD CONSTRAINT order_payment_collection_pkey PRIMARY KEY (order_id, payment_collection_id);


--
-- TOC entry 4727 (class 2606 OID 18184)
-- Name: order order_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public."order"
    ADD CONSTRAINT order_pkey PRIMARY KEY (id);


--
-- TOC entry 5061 (class 2606 OID 19533)
-- Name: order_promotion order_promotion_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_promotion
    ADD CONSTRAINT order_promotion_pkey PRIMARY KEY (order_id, promotion_id);


--
-- TOC entry 4785 (class 2606 OID 18331)
-- Name: order_shipping_method_adjustment order_shipping_method_adjustment_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_shipping_method_adjustment
    ADD CONSTRAINT order_shipping_method_adjustment_pkey PRIMARY KEY (id);


--
-- TOC entry 4781 (class 2606 OID 18321)
-- Name: order_shipping_method order_shipping_method_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_shipping_method
    ADD CONSTRAINT order_shipping_method_pkey PRIMARY KEY (id);


--
-- TOC entry 4788 (class 2606 OID 18341)
-- Name: order_shipping_method_tax_line order_shipping_method_tax_line_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_shipping_method_tax_line
    ADD CONSTRAINT order_shipping_method_tax_line_pkey PRIMARY KEY (id);


--
-- TOC entry 4767 (class 2606 OID 18274)
-- Name: order_shipping order_shipping_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_shipping
    ADD CONSTRAINT order_shipping_pkey PRIMARY KEY (id);


--
-- TOC entry 4731 (class 2606 OID 18223)
-- Name: order_summary order_summary_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_summary
    ADD CONSTRAINT order_summary_pkey PRIMARY KEY (id);


--
-- TOC entry 4797 (class 2606 OID 18352)
-- Name: order_transaction order_transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_transaction
    ADD CONSTRAINT order_transaction_pkey PRIMARY KEY (id);


--
-- TOC entry 4684 (class 2606 OID 18023)
-- Name: payment_collection_payment_providers payment_collection_payment_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.payment_collection_payment_providers
    ADD CONSTRAINT payment_collection_payment_providers_pkey PRIMARY KEY (payment_collection_id, payment_provider_id);


--
-- TOC entry 4679 (class 2606 OID 17999)
-- Name: payment_collection payment_collection_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.payment_collection
    ADD CONSTRAINT payment_collection_pkey PRIMARY KEY (id);


--
-- TOC entry 4695 (class 2606 OID 18043)
-- Name: payment payment_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_pkey PRIMARY KEY (id);


--
-- TOC entry 4682 (class 2606 OID 18016)
-- Name: payment_provider payment_provider_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.payment_provider
    ADD CONSTRAINT payment_provider_pkey PRIMARY KEY (id);


--
-- TOC entry 4688 (class 2606 OID 18034)
-- Name: payment_session payment_session_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.payment_session
    ADD CONSTRAINT payment_session_pkey PRIMARY KEY (id);


--
-- TOC entry 4498 (class 2606 OID 17105)
-- Name: price_list price_list_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.price_list
    ADD CONSTRAINT price_list_pkey PRIMARY KEY (id);


--
-- TOC entry 4504 (class 2606 OID 17114)
-- Name: price_list_rule price_list_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.price_list_rule
    ADD CONSTRAINT price_list_rule_pkey PRIMARY KEY (id);


--
-- TOC entry 4484 (class 2606 OID 17029)
-- Name: price price_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.price
    ADD CONSTRAINT price_pkey PRIMARY KEY (id);


--
-- TOC entry 4508 (class 2606 OID 17210)
-- Name: price_preference price_preference_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.price_preference
    ADD CONSTRAINT price_preference_pkey PRIMARY KEY (id);


--
-- TOC entry 4494 (class 2606 OID 17060)
-- Name: price_rule price_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.price_rule
    ADD CONSTRAINT price_rule_pkey PRIMARY KEY (id);


--
-- TOC entry 4478 (class 2606 OID 17019)
-- Name: price_set price_set_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.price_set
    ADD CONSTRAINT price_set_pkey PRIMARY KEY (id);


--
-- TOC entry 4453 (class 2606 OID 16646)
-- Name: product_category product_category_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product_category
    ADD CONSTRAINT product_category_pkey PRIMARY KEY (id);


--
-- TOC entry 4457 (class 2606 OID 16670)
-- Name: product_category_product product_category_product_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product_category_product
    ADD CONSTRAINT product_category_product_pkey PRIMARY KEY (product_id, product_category_id);


--
-- TOC entry 4448 (class 2606 OID 16631)
-- Name: product_collection product_collection_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product_collection
    ADD CONSTRAINT product_collection_pkey PRIMARY KEY (id);


--
-- TOC entry 4423 (class 2606 OID 16576)
-- Name: product_option product_option_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product_option
    ADD CONSTRAINT product_option_pkey PRIMARY KEY (id);


--
-- TOC entry 4428 (class 2606 OID 16587)
-- Name: product_option_value product_option_value_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product_option_value
    ADD CONSTRAINT product_option_value_pkey PRIMARY KEY (id);


--
-- TOC entry 4410 (class 2606 OID 16545)
-- Name: product product_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_pkey PRIMARY KEY (id);


--
-- TOC entry 4469 (class 2606 OID 16867)
-- Name: product_product_option product_product_option_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product_product_option
    ADD CONSTRAINT product_product_option_pkey PRIMARY KEY (id);


--
-- TOC entry 4475 (class 2606 OID 16890)
-- Name: product_product_option_value product_product_option_value_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product_product_option_value
    ADD CONSTRAINT product_product_option_value_pkey PRIMARY KEY (id);


--
-- TOC entry 5073 (class 2606 OID 19559)
-- Name: product_sales_channel product_sales_channel_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product_sales_channel
    ADD CONSTRAINT product_sales_channel_pkey PRIMARY KEY (product_id, sales_channel_id);


--
-- TOC entry 5079 (class 2606 OID 19572)
-- Name: product_shipping_profile product_shipping_profile_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product_shipping_profile
    ADD CONSTRAINT product_shipping_profile_pkey PRIMARY KEY (product_id, shipping_profile_id);


--
-- TOC entry 4440 (class 2606 OID 16609)
-- Name: product_tag product_tag_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product_tag
    ADD CONSTRAINT product_tag_pkey PRIMARY KEY (id);


--
-- TOC entry 4455 (class 2606 OID 16656)
-- Name: product_tags product_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product_tags
    ADD CONSTRAINT product_tags_pkey PRIMARY KEY (product_id, product_tag_id);


--
-- TOC entry 4444 (class 2606 OID 16620)
-- Name: product_type product_type_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product_type
    ADD CONSTRAINT product_type_pkey PRIMARY KEY (id);


--
-- TOC entry 5085 (class 2606 OID 19586)
-- Name: product_variant_inventory_item product_variant_inventory_item_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product_variant_inventory_item
    ADD CONSTRAINT product_variant_inventory_item_pkey PRIMARY KEY (variant_id, inventory_item_id);


--
-- TOC entry 4459 (class 2606 OID 16677)
-- Name: product_variant_option product_variant_option_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product_variant_option
    ADD CONSTRAINT product_variant_option_pkey PRIMARY KEY (variant_id, option_value_id);


--
-- TOC entry 4419 (class 2606 OID 16561)
-- Name: product_variant product_variant_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product_variant
    ADD CONSTRAINT product_variant_pkey PRIMARY KEY (id);


--
-- TOC entry 5091 (class 2606 OID 19599)
-- Name: product_variant_price_set product_variant_price_set_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product_variant_price_set
    ADD CONSTRAINT product_variant_price_set_pkey PRIMARY KEY (variant_id, price_set_id);


--
-- TOC entry 4464 (class 2606 OID 16850)
-- Name: product_variant_product_image product_variant_product_image_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product_variant_product_image
    ADD CONSTRAINT product_variant_product_image_pkey PRIMARY KEY (id);


--
-- TOC entry 4533 (class 2606 OID 17318)
-- Name: promotion_application_method promotion_application_method_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.promotion_application_method
    ADD CONSTRAINT promotion_application_method_pkey PRIMARY KEY (id);


--
-- TOC entry 4517 (class 2606 OID 17288)
-- Name: promotion_campaign_budget promotion_campaign_budget_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.promotion_campaign_budget
    ADD CONSTRAINT promotion_campaign_budget_pkey PRIMARY KEY (id);


--
-- TOC entry 4557 (class 2606 OID 17489)
-- Name: promotion_campaign_budget_usage promotion_campaign_budget_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.promotion_campaign_budget_usage
    ADD CONSTRAINT promotion_campaign_budget_usage_pkey PRIMARY KEY (id);


--
-- TOC entry 4512 (class 2606 OID 17275)
-- Name: promotion_campaign promotion_campaign_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.promotion_campaign
    ADD CONSTRAINT promotion_campaign_pkey PRIMARY KEY (id);


--
-- TOC entry 4525 (class 2606 OID 17302)
-- Name: promotion promotion_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.promotion
    ADD CONSTRAINT promotion_pkey PRIMARY KEY (id);


--
-- TOC entry 4542 (class 2606 OID 17342)
-- Name: promotion_promotion_rule promotion_promotion_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.promotion_promotion_rule
    ADD CONSTRAINT promotion_promotion_rule_pkey PRIMARY KEY (promotion_id, promotion_rule_id);


--
-- TOC entry 4540 (class 2606 OID 17333)
-- Name: promotion_rule promotion_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.promotion_rule
    ADD CONSTRAINT promotion_rule_pkey PRIMARY KEY (id);


--
-- TOC entry 4552 (class 2606 OID 17365)
-- Name: promotion_rule_value promotion_rule_value_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.promotion_rule_value
    ADD CONSTRAINT promotion_rule_value_pkey PRIMARY KEY (id);


--
-- TOC entry 4860 (class 2606 OID 18768)
-- Name: property_label property_label_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.property_label
    ADD CONSTRAINT property_label_pkey PRIMARY KEY (id);


--
-- TOC entry 4873 (class 2606 OID 18802)
-- Name: provider_identity provider_identity_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.provider_identity
    ADD CONSTRAINT provider_identity_pkey PRIMARY KEY (id);


--
-- TOC entry 5097 (class 2606 OID 19612)
-- Name: publishable_api_key_sales_channel publishable_api_key_sales_channel_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.publishable_api_key_sales_channel
    ADD CONSTRAINT publishable_api_key_sales_channel_pkey PRIMARY KEY (publishable_key_id, sales_channel_id);


--
-- TOC entry 4700 (class 2606 OID 18052)
-- Name: refund refund_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.refund
    ADD CONSTRAINT refund_pkey PRIMARY KEY (id);


--
-- TOC entry 4707 (class 2606 OID 18111)
-- Name: refund_reason refund_reason_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.refund_reason
    ADD CONSTRAINT refund_reason_pkey PRIMARY KEY (id);


--
-- TOC entry 4635 (class 2606 OID 17830)
-- Name: region_country region_country_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.region_country
    ADD CONSTRAINT region_country_pkey PRIMARY KEY (iso_2);


--
-- TOC entry 5103 (class 2606 OID 19625)
-- Name: region_payment_provider region_payment_provider_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.region_payment_provider
    ADD CONSTRAINT region_payment_provider_pkey PRIMARY KEY (region_id, payment_provider_id);


--
-- TOC entry 4630 (class 2606 OID 17821)
-- Name: region region_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.region
    ADD CONSTRAINT region_pkey PRIMARY KEY (id);


--
-- TOC entry 4403 (class 2606 OID 16466)
-- Name: reservation_item reservation_item_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.reservation_item
    ADD CONSTRAINT reservation_item_pkey PRIMARY KEY (id);


--
-- TOC entry 5067 (class 2606 OID 19546)
-- Name: return_fulfillment return_fulfillment_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.return_fulfillment
    ADD CONSTRAINT return_fulfillment_pkey PRIMARY KEY (return_id, fulfillment_id);


--
-- TOC entry 4813 (class 2606 OID 18486)
-- Name: return_item return_item_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.return_item
    ADD CONSTRAINT return_item_pkey PRIMARY KEY (id);


--
-- TOC entry 4807 (class 2606 OID 18472)
-- Name: return return_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.return
    ADD CONSTRAINT return_pkey PRIMARY KEY (id);


--
-- TOC entry 4801 (class 2606 OID 18364)
-- Name: return_reason return_reason_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.return_reason
    ADD CONSTRAINT return_reason_pkey PRIMARY KEY (id);


--
-- TOC entry 4579 (class 2606 OID 17592)
-- Name: sales_channel sales_channel_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.sales_channel
    ADD CONSTRAINT sales_channel_pkey PRIMARY KEY (id);


--
-- TOC entry 5109 (class 2606 OID 19638)
-- Name: sales_channel_stock_location sales_channel_stock_location_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.sales_channel_stock_location
    ADD CONSTRAINT sales_channel_stock_location_pkey PRIMARY KEY (sales_channel_id, stock_location_id);


--
-- TOC entry 5124 (class 2606 OID 19676)
-- Name: script_migrations script_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.script_migrations
    ADD CONSTRAINT script_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 4972 (class 2606 OID 19219)
-- Name: search_index search_index_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.search_index
    ADD CONSTRAINT search_index_pkey PRIMARY KEY (id);


--
-- TOC entry 4977 (class 2606 OID 19233)
-- Name: search_index_sync search_index_sync_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.search_index_sync
    ADD CONSTRAINT search_index_sync_pkey PRIMARY KEY (id);


--
-- TOC entry 4982 (class 2606 OID 19252)
-- Name: search_index_version search_index_version_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.search_index_version
    ADD CONSTRAINT search_index_version_pkey PRIMARY KEY (id);


--
-- TOC entry 4984 (class 2606 OID 19366)
-- Name: search_postgres_index search_postgres_index_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.search_postgres_index
    ADD CONSTRAINT search_postgres_index_pkey PRIMARY KEY (name);


--
-- TOC entry 4919 (class 2606 OID 18977)
-- Name: service_zone service_zone_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.service_zone
    ADD CONSTRAINT service_zone_pkey PRIMARY KEY (id);


--
-- TOC entry 4940 (class 2606 OID 19028)
-- Name: shipping_option shipping_option_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.shipping_option
    ADD CONSTRAINT shipping_option_pkey PRIMARY KEY (id);


--
-- TOC entry 5115 (class 2606 OID 19651)
-- Name: shipping_option_price_set shipping_option_price_set_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.shipping_option_price_set
    ADD CONSTRAINT shipping_option_price_set_pkey PRIMARY KEY (shipping_option_id, price_set_id);


--
-- TOC entry 4944 (class 2606 OID 19045)
-- Name: shipping_option_rule shipping_option_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.shipping_option_rule
    ADD CONSTRAINT shipping_option_rule_pkey PRIMARY KEY (id);


--
-- TOC entry 4929 (class 2606 OID 19005)
-- Name: shipping_option_type shipping_option_type_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.shipping_option_type
    ADD CONSTRAINT shipping_option_type_pkey PRIMARY KEY (id);


--
-- TOC entry 4933 (class 2606 OID 19015)
-- Name: shipping_profile shipping_profile_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.shipping_profile
    ADD CONSTRAINT shipping_profile_pkey PRIMARY KEY (id);


--
-- TOC entry 4383 (class 2606 OID 16405)
-- Name: stock_location_address stock_location_address_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.stock_location_address
    ADD CONSTRAINT stock_location_address_pkey PRIMARY KEY (id);


--
-- TOC entry 4387 (class 2606 OID 16415)
-- Name: stock_location stock_location_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.stock_location
    ADD CONSTRAINT stock_location_pkey PRIMARY KEY (id);


--
-- TOC entry 4649 (class 2606 OID 17878)
-- Name: store_currency store_currency_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.store_currency
    ADD CONSTRAINT store_currency_pkey PRIMARY KEY (id);


--
-- TOC entry 4653 (class 2606 OID 17895)
-- Name: store_locale store_locale_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.store_locale
    ADD CONSTRAINT store_locale_pkey PRIMARY KEY (id);


--
-- TOC entry 4645 (class 2606 OID 17867)
-- Name: store store_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.store
    ADD CONSTRAINT store_pkey PRIMARY KEY (id);


--
-- TOC entry 4656 (class 2606 OID 17910)
-- Name: tax_provider tax_provider_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.tax_provider
    ADD CONSTRAINT tax_provider_pkey PRIMARY KEY (id);


--
-- TOC entry 4668 (class 2606 OID 17935)
-- Name: tax_rate tax_rate_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.tax_rate
    ADD CONSTRAINT tax_rate_pkey PRIMARY KEY (id);


--
-- TOC entry 4674 (class 2606 OID 17947)
-- Name: tax_rate_rule tax_rate_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.tax_rate_rule
    ADD CONSTRAINT tax_rate_rule_pkey PRIMARY KEY (id);


--
-- TOC entry 4663 (class 2606 OID 17921)
-- Name: tax_region tax_region_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.tax_region
    ADD CONSTRAINT tax_region_pkey PRIMARY KEY (id);


--
-- TOC entry 4904 (class 2606 OID 18934)
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- TOC entry 4849 (class 2606 OID 18742)
-- Name: user_preference user_preference_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.user_preference
    ADD CONSTRAINT user_preference_pkey PRIMARY KEY (id);


--
-- TOC entry 5121 (class 2606 OID 19664)
-- Name: user_rbac_role user_rbac_role_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.user_rbac_role
    ADD CONSTRAINT user_rbac_role_pkey PRIMARY KEY (user_id, rbac_role_id);


--
-- TOC entry 4855 (class 2606 OID 18755)
-- Name: view_configuration view_configuration_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.view_configuration
    ADD CONSTRAINT view_configuration_pkey PRIMARY KEY (id);


--
-- TOC entry 4997 (class 2606 OID 19389)
-- Name: workflow_execution workflow_execution_pkey; Type: CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.workflow_execution
    ADD CONSTRAINT workflow_execution_pkey PRIMARY KEY (workflow_id, transaction_id, run_id);


--
-- TOC entry 4708 (class 1259 OID 18147)
-- Name: IDX_account_holder_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_account_holder_deleted_at" ON public.account_holder USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 5014 (class 1259 OID 19445)
-- Name: IDX_account_holder_id_5cb3a0c0; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_account_holder_id_5cb3a0c0" ON public.customer_account_holder USING btree (account_holder_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4709 (class 1259 OID 18148)
-- Name: IDX_account_holder_provider_id_external_id_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_account_holder_provider_id_external_id_unique" ON public.account_holder USING btree (provider_id, external_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4636 (class 1259 OID 17854)
-- Name: IDX_api_key_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_api_key_deleted_at" ON public.api_key USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4637 (class 1259 OID 17856)
-- Name: IDX_api_key_redacted; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_api_key_redacted" ON public.api_key USING btree (redacted) WHERE (deleted_at IS NULL);


--
-- TOC entry 4638 (class 1259 OID 17855)
-- Name: IDX_api_key_revoked_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_api_key_revoked_at" ON public.api_key USING btree (revoked_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4639 (class 1259 OID 17849)
-- Name: IDX_api_key_token_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_api_key_token_unique" ON public.api_key USING btree (token);


--
-- TOC entry 4640 (class 1259 OID 17852)
-- Name: IDX_api_key_type; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_api_key_type" ON public.api_key USING btree (type);


--
-- TOC entry 4526 (class 1259 OID 17321)
-- Name: IDX_application_method_allocation; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_application_method_allocation" ON public.promotion_application_method USING btree (allocation);


--
-- TOC entry 4527 (class 1259 OID 17320)
-- Name: IDX_application_method_target_type; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_application_method_target_type" ON public.promotion_application_method USING btree (target_type);


--
-- TOC entry 4528 (class 1259 OID 17319)
-- Name: IDX_application_method_type; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_application_method_type" ON public.promotion_application_method USING btree (type);


--
-- TOC entry 4866 (class 1259 OID 18812)
-- Name: IDX_auth_identity_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_auth_identity_deleted_at" ON public.auth_identity USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4874 (class 1259 OID 18823)
-- Name: IDX_auth_mfa_factor_auth_identity_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_auth_mfa_factor_auth_identity_id" ON public.auth_mfa_factor USING btree (auth_identity_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4875 (class 1259 OID 18825)
-- Name: IDX_auth_mfa_factor_auth_identity_provider_active; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_auth_mfa_factor_auth_identity_provider_active" ON public.auth_mfa_factor USING btree (auth_identity_id, provider) WHERE ((deleted_at IS NULL) AND (status = ANY (ARRAY['pending'::text, 'enabled'::text])));


--
-- TOC entry 4876 (class 1259 OID 18824)
-- Name: IDX_auth_mfa_factor_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_auth_mfa_factor_deleted_at" ON public.auth_mfa_factor USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4879 (class 1259 OID 18837)
-- Name: IDX_auth_mfa_recovery_code_auth_identity_code_hash; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_auth_mfa_recovery_code_auth_identity_code_hash" ON public.auth_mfa_recovery_code USING btree (auth_identity_id, code_hash) WHERE (deleted_at IS NULL);


--
-- TOC entry 4880 (class 1259 OID 18835)
-- Name: IDX_auth_mfa_recovery_code_auth_identity_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_auth_mfa_recovery_code_auth_identity_id" ON public.auth_mfa_recovery_code USING btree (auth_identity_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4881 (class 1259 OID 18836)
-- Name: IDX_auth_mfa_recovery_code_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_auth_mfa_recovery_code_deleted_at" ON public.auth_mfa_recovery_code USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4884 (class 1259 OID 18881)
-- Name: IDX_auth_password_reset_token_auth_identity_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_auth_password_reset_token_auth_identity_id" ON public.auth_password_reset_token USING btree (auth_identity_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4885 (class 1259 OID 18885)
-- Name: IDX_auth_password_reset_token_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_auth_password_reset_token_deleted_at" ON public.auth_password_reset_token USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4886 (class 1259 OID 18884)
-- Name: IDX_auth_password_reset_token_expires_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_auth_password_reset_token_expires_at" ON public.auth_password_reset_token USING btree (expires_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4887 (class 1259 OID 18882)
-- Name: IDX_auth_password_reset_token_provider_identity_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_auth_password_reset_token_provider_identity_id" ON public.auth_password_reset_token USING btree (provider_identity_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4888 (class 1259 OID 18883)
-- Name: IDX_auth_password_reset_token_token_hash; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_auth_password_reset_token_token_hash" ON public.auth_password_reset_token USING btree (token_hash) WHERE (deleted_at IS NULL);


--
-- TOC entry 4891 (class 1259 OID 18905)
-- Name: IDX_auth_verification_auth_identity_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_auth_verification_auth_identity_id" ON public.auth_verification USING btree (auth_identity_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4892 (class 1259 OID 18906)
-- Name: IDX_auth_verification_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_auth_verification_deleted_at" ON public.auth_verification USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4893 (class 1259 OID 18907)
-- Name: IDX_auth_verification_unique_auth_identity_entity_id_entity_typ; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_auth_verification_unique_auth_identity_entity_id_entity_typ" ON public.auth_verification USING btree (auth_identity_id, entity_id, entity_type) WHERE (deleted_at IS NULL);


--
-- TOC entry 4513 (class 1259 OID 17289)
-- Name: IDX_campaign_budget_type; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_campaign_budget_type" ON public.promotion_campaign_budget USING btree (type);


--
-- TOC entry 4701 (class 1259 OID 18118)
-- Name: IDX_capture_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_capture_deleted_at" ON public.capture USING btree (deleted_at);


--
-- TOC entry 4702 (class 1259 OID 18070)
-- Name: IDX_capture_payment_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_capture_payment_id" ON public.capture USING btree (payment_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4589 (class 1259 OID 17733)
-- Name: IDX_cart_address_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_cart_address_deleted_at" ON public.cart_address USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4580 (class 1259 OID 17605)
-- Name: IDX_cart_billing_address_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_cart_billing_address_id" ON public.cart USING btree (billing_address_id) WHERE ((deleted_at IS NULL) AND (billing_address_id IS NOT NULL));


--
-- TOC entry 4623 (class 1259 OID 17805)
-- Name: IDX_cart_credit_line_reference_reference_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_cart_credit_line_reference_reference_id" ON public.credit_line USING btree (reference, reference_id) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4581 (class 1259 OID 17608)
-- Name: IDX_cart_currency_code; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_cart_currency_code" ON public.cart USING btree (currency_code);


--
-- TOC entry 4582 (class 1259 OID 17603)
-- Name: IDX_cart_customer_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_cart_customer_id" ON public.cart USING btree (customer_id) WHERE ((deleted_at IS NULL) AND (customer_id IS NOT NULL));


--
-- TOC entry 4583 (class 1259 OID 17732)
-- Name: IDX_cart_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_cart_deleted_at" ON public.cart USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 5002 (class 1259 OID 19418)
-- Name: IDX_cart_id_-4a39f6c9; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_cart_id_-4a39f6c9" ON public.cart_payment_collection USING btree (cart_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5038 (class 1259 OID 19497)
-- Name: IDX_cart_id_-71069c16; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_cart_id_-71069c16" ON public.order_cart USING btree (cart_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5008 (class 1259 OID 19431)
-- Name: IDX_cart_id_-a9d4a70b; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_cart_id_-a9d4a70b" ON public.cart_promotion USING btree (cart_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4598 (class 1259 OID 17734)
-- Name: IDX_cart_line_item_adjustment_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_cart_line_item_adjustment_deleted_at" ON public.cart_line_item_adjustment USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4599 (class 1259 OID 17758)
-- Name: IDX_cart_line_item_adjustment_item_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_cart_line_item_adjustment_item_id" ON public.cart_line_item_adjustment USING btree (item_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4592 (class 1259 OID 17752)
-- Name: IDX_cart_line_item_cart_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_cart_line_item_cart_id" ON public.cart_line_item USING btree (cart_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4593 (class 1259 OID 17739)
-- Name: IDX_cart_line_item_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_cart_line_item_deleted_at" ON public.cart_line_item USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4603 (class 1259 OID 17736)
-- Name: IDX_cart_line_item_tax_line_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_cart_line_item_tax_line_deleted_at" ON public.cart_line_item_tax_line USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4604 (class 1259 OID 17764)
-- Name: IDX_cart_line_item_tax_line_item_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_cart_line_item_tax_line_item_id" ON public.cart_line_item_tax_line USING btree (item_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4584 (class 1259 OID 17606)
-- Name: IDX_cart_region_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_cart_region_id" ON public.cart USING btree (region_id) WHERE ((deleted_at IS NULL) AND (region_id IS NOT NULL));


--
-- TOC entry 4585 (class 1259 OID 17607)
-- Name: IDX_cart_sales_channel_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_cart_sales_channel_id" ON public.cart USING btree (sales_channel_id) WHERE ((deleted_at IS NULL) AND (sales_channel_id IS NOT NULL));


--
-- TOC entry 4586 (class 1259 OID 17604)
-- Name: IDX_cart_shipping_address_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_cart_shipping_address_id" ON public.cart USING btree (shipping_address_id) WHERE ((deleted_at IS NULL) AND (shipping_address_id IS NOT NULL));


--
-- TOC entry 4613 (class 1259 OID 17735)
-- Name: IDX_cart_shipping_method_adjustment_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_cart_shipping_method_adjustment_deleted_at" ON public.cart_shipping_method_adjustment USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4614 (class 1259 OID 17771)
-- Name: IDX_cart_shipping_method_adjustment_shipping_method_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_cart_shipping_method_adjustment_shipping_method_id" ON public.cart_shipping_method_adjustment USING btree (shipping_method_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4608 (class 1259 OID 17770)
-- Name: IDX_cart_shipping_method_cart_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_cart_shipping_method_cart_id" ON public.cart_shipping_method USING btree (cart_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4609 (class 1259 OID 17738)
-- Name: IDX_cart_shipping_method_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_cart_shipping_method_deleted_at" ON public.cart_shipping_method USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4618 (class 1259 OID 17737)
-- Name: IDX_cart_shipping_method_tax_line_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_cart_shipping_method_tax_line_deleted_at" ON public.cart_shipping_method_tax_line USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4619 (class 1259 OID 17772)
-- Name: IDX_cart_shipping_method_tax_line_shipping_method_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_cart_shipping_method_tax_line_shipping_method_id" ON public.cart_shipping_method_tax_line USING btree (shipping_method_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4449 (class 1259 OID 16647)
-- Name: IDX_category_handle_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_category_handle_unique" ON public.product_category USING btree (handle) WHERE (deleted_at IS NULL);


--
-- TOC entry 4445 (class 1259 OID 16632)
-- Name: IDX_collection_handle_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_collection_handle_unique" ON public.product_collection USING btree (handle) WHERE (deleted_at IS NULL);


--
-- TOC entry 4624 (class 1259 OID 17803)
-- Name: IDX_credit_line_cart_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_credit_line_cart_id" ON public.credit_line USING btree (cart_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4625 (class 1259 OID 17804)
-- Name: IDX_credit_line_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_credit_line_deleted_at" ON public.credit_line USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4562 (class 1259 OID 17527)
-- Name: IDX_customer_address_customer_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_customer_address_customer_id" ON public.customer_address USING btree (customer_id);


--
-- TOC entry 4563 (class 1259 OID 17569)
-- Name: IDX_customer_address_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_customer_address_deleted_at" ON public.customer_address USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4564 (class 1259 OID 17528)
-- Name: IDX_customer_address_unique_customer_billing; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_customer_address_unique_customer_billing" ON public.customer_address USING btree (customer_id) WHERE (is_default_billing = true);


--
-- TOC entry 4565 (class 1259 OID 17529)
-- Name: IDX_customer_address_unique_customer_shipping; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_customer_address_unique_customer_shipping" ON public.customer_address USING btree (customer_id) WHERE (is_default_shipping = true);


--
-- TOC entry 4558 (class 1259 OID 17568)
-- Name: IDX_customer_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_customer_deleted_at" ON public.customer USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4559 (class 1259 OID 17566)
-- Name: IDX_customer_email_has_account_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_customer_email_has_account_unique" ON public.customer USING btree (email, has_account) WHERE (deleted_at IS NULL);


--
-- TOC entry 4572 (class 1259 OID 17581)
-- Name: IDX_customer_group_customer_customer_group_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_customer_group_customer_customer_group_id" ON public.customer_group_customer USING btree (customer_group_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4573 (class 1259 OID 17550)
-- Name: IDX_customer_group_customer_customer_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_customer_group_customer_customer_id" ON public.customer_group_customer USING btree (customer_id);


--
-- TOC entry 4574 (class 1259 OID 17582)
-- Name: IDX_customer_group_customer_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_customer_group_customer_deleted_at" ON public.customer_group_customer USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4568 (class 1259 OID 17570)
-- Name: IDX_customer_group_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_customer_group_deleted_at" ON public.customer_group USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4569 (class 1259 OID 17567)
-- Name: IDX_customer_group_name_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_customer_group_name_unique" ON public.customer_group USING btree (name) WHERE (deleted_at IS NULL);


--
-- TOC entry 5015 (class 1259 OID 19444)
-- Name: IDX_customer_id_5cb3a0c0; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_customer_id_5cb3a0c0" ON public.customer_account_holder USING btree (customer_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5092 (class 1259 OID 19616)
-- Name: IDX_deleted_at_-1d67bae40; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_deleted_at_-1d67bae40" ON public.publishable_api_key_sales_channel USING btree (deleted_at);


--
-- TOC entry 5020 (class 1259 OID 19459)
-- Name: IDX_deleted_at_-1e5992737; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_deleted_at_-1e5992737" ON public.location_fulfillment_provider USING btree (deleted_at);


--
-- TOC entry 5062 (class 1259 OID 19550)
-- Name: IDX_deleted_at_-31ea43a; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_deleted_at_-31ea43a" ON public.return_fulfillment USING btree (deleted_at);


--
-- TOC entry 5003 (class 1259 OID 19420)
-- Name: IDX_deleted_at_-4a39f6c9; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_deleted_at_-4a39f6c9" ON public.cart_payment_collection USING btree (deleted_at);


--
-- TOC entry 5039 (class 1259 OID 19498)
-- Name: IDX_deleted_at_-71069c16; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_deleted_at_-71069c16" ON public.order_cart USING btree (deleted_at);


--
-- TOC entry 5056 (class 1259 OID 19537)
-- Name: IDX_deleted_at_-71518339; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_deleted_at_-71518339" ON public.order_promotion USING btree (deleted_at);


--
-- TOC entry 5032 (class 1259 OID 19485)
-- Name: IDX_deleted_at_-85069d44; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_deleted_at_-85069d44" ON public.invite_rbac_role USING btree (deleted_at);


--
-- TOC entry 5009 (class 1259 OID 19433)
-- Name: IDX_deleted_at_-a9d4a70b; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_deleted_at_-a9d4a70b" ON public.cart_promotion USING btree (deleted_at);


--
-- TOC entry 5026 (class 1259 OID 19472)
-- Name: IDX_deleted_at_-e88adb96; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_deleted_at_-e88adb96" ON public.location_fulfillment_set USING btree (deleted_at);


--
-- TOC entry 5044 (class 1259 OID 19511)
-- Name: IDX_deleted_at_-e8d2543e; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_deleted_at_-e8d2543e" ON public.order_fulfillment USING btree (deleted_at);


--
-- TOC entry 5074 (class 1259 OID 19576)
-- Name: IDX_deleted_at_17a262437; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_deleted_at_17a262437" ON public.product_shipping_profile USING btree (deleted_at);


--
-- TOC entry 5080 (class 1259 OID 19590)
-- Name: IDX_deleted_at_17b4c4e35; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_deleted_at_17b4c4e35" ON public.product_variant_inventory_item USING btree (deleted_at);


--
-- TOC entry 5098 (class 1259 OID 19629)
-- Name: IDX_deleted_at_1c934dab0; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_deleted_at_1c934dab0" ON public.region_payment_provider USING btree (deleted_at);


--
-- TOC entry 5068 (class 1259 OID 19563)
-- Name: IDX_deleted_at_20b454295; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_deleted_at_20b454295" ON public.product_sales_channel USING btree (deleted_at);


--
-- TOC entry 5104 (class 1259 OID 19642)
-- Name: IDX_deleted_at_26d06f470; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_deleted_at_26d06f470" ON public.sales_channel_stock_location USING btree (deleted_at);


--
-- TOC entry 5086 (class 1259 OID 19603)
-- Name: IDX_deleted_at_52b23597; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_deleted_at_52b23597" ON public.product_variant_price_set USING btree (deleted_at);


--
-- TOC entry 5016 (class 1259 OID 19446)
-- Name: IDX_deleted_at_5cb3a0c0; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_deleted_at_5cb3a0c0" ON public.customer_account_holder USING btree (deleted_at);


--
-- TOC entry 5116 (class 1259 OID 19668)
-- Name: IDX_deleted_at_64ff0c4c; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_deleted_at_64ff0c4c" ON public.user_rbac_role USING btree (deleted_at);


--
-- TOC entry 5110 (class 1259 OID 19655)
-- Name: IDX_deleted_at_ba32fa9c; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_deleted_at_ba32fa9c" ON public.shipping_option_price_set USING btree (deleted_at);


--
-- TOC entry 5050 (class 1259 OID 19524)
-- Name: IDX_deleted_at_f42b9949; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_deleted_at_f42b9949" ON public.order_payment_collection USING btree (deleted_at);


--
-- TOC entry 4905 (class 1259 OID 18949)
-- Name: IDX_fulfillment_address_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_fulfillment_address_deleted_at" ON public.fulfillment_address USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4945 (class 1259 OID 19062)
-- Name: IDX_fulfillment_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_fulfillment_deleted_at" ON public.fulfillment USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 5063 (class 1259 OID 19549)
-- Name: IDX_fulfillment_id_-31ea43a; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_fulfillment_id_-31ea43a" ON public.return_fulfillment USING btree (fulfillment_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5045 (class 1259 OID 19510)
-- Name: IDX_fulfillment_id_-e8d2543e; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_fulfillment_id_-e8d2543e" ON public.order_fulfillment USING btree (fulfillment_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4954 (class 1259 OID 19086)
-- Name: IDX_fulfillment_item_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_fulfillment_item_deleted_at" ON public.fulfillment_item USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4955 (class 1259 OID 19085)
-- Name: IDX_fulfillment_item_fulfillment_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_fulfillment_item_fulfillment_id" ON public.fulfillment_item USING btree (fulfillment_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4956 (class 1259 OID 19084)
-- Name: IDX_fulfillment_item_inventory_item_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_fulfillment_item_inventory_item_id" ON public.fulfillment_item USING btree (inventory_item_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4957 (class 1259 OID 19083)
-- Name: IDX_fulfillment_item_line_item_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_fulfillment_item_line_item_id" ON public.fulfillment_item USING btree (line_item_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4950 (class 1259 OID 19073)
-- Name: IDX_fulfillment_label_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_fulfillment_label_deleted_at" ON public.fulfillment_label USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4951 (class 1259 OID 19072)
-- Name: IDX_fulfillment_label_fulfillment_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_fulfillment_label_fulfillment_id" ON public.fulfillment_label USING btree (fulfillment_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4946 (class 1259 OID 19059)
-- Name: IDX_fulfillment_location_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_fulfillment_location_id" ON public.fulfillment USING btree (location_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4908 (class 1259 OID 19153)
-- Name: IDX_fulfillment_provider_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_fulfillment_provider_deleted_at" ON public.fulfillment_provider USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 5021 (class 1259 OID 19458)
-- Name: IDX_fulfillment_provider_id_-1e5992737; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_fulfillment_provider_id_-1e5992737" ON public.location_fulfillment_provider USING btree (fulfillment_provider_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4911 (class 1259 OID 18968)
-- Name: IDX_fulfillment_set_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_fulfillment_set_deleted_at" ON public.fulfillment_set USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 5027 (class 1259 OID 19471)
-- Name: IDX_fulfillment_set_id_-e88adb96; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_fulfillment_set_id_-e88adb96" ON public.location_fulfillment_set USING btree (fulfillment_set_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4912 (class 1259 OID 18967)
-- Name: IDX_fulfillment_set_name_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_fulfillment_set_name_unique" ON public.fulfillment_set USING btree (name) WHERE (deleted_at IS NULL);


--
-- TOC entry 4947 (class 1259 OID 19061)
-- Name: IDX_fulfillment_shipping_option_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_fulfillment_shipping_option_id" ON public.fulfillment USING btree (shipping_option_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4920 (class 1259 OID 18994)
-- Name: IDX_geo_zone_city; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_geo_zone_city" ON public.geo_zone USING btree (city) WHERE ((deleted_at IS NULL) AND (city IS NOT NULL));


--
-- TOC entry 4921 (class 1259 OID 18992)
-- Name: IDX_geo_zone_country_code; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_geo_zone_country_code" ON public.geo_zone USING btree (country_code) WHERE (deleted_at IS NULL);


--
-- TOC entry 4922 (class 1259 OID 18996)
-- Name: IDX_geo_zone_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_geo_zone_deleted_at" ON public.geo_zone USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4923 (class 1259 OID 18993)
-- Name: IDX_geo_zone_province_code; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_geo_zone_province_code" ON public.geo_zone USING btree (province_code) WHERE ((deleted_at IS NULL) AND (province_code IS NOT NULL));


--
-- TOC entry 4924 (class 1259 OID 18995)
-- Name: IDX_geo_zone_service_zone_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_geo_zone_service_zone_id" ON public.geo_zone USING btree (service_zone_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5093 (class 1259 OID 19613)
-- Name: IDX_id_-1d67bae40; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_id_-1d67bae40" ON public.publishable_api_key_sales_channel USING btree (id);


--
-- TOC entry 5022 (class 1259 OID 19456)
-- Name: IDX_id_-1e5992737; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_id_-1e5992737" ON public.location_fulfillment_provider USING btree (id);


--
-- TOC entry 5064 (class 1259 OID 19547)
-- Name: IDX_id_-31ea43a; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_id_-31ea43a" ON public.return_fulfillment USING btree (id);


--
-- TOC entry 5004 (class 1259 OID 19417)
-- Name: IDX_id_-4a39f6c9; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_id_-4a39f6c9" ON public.cart_payment_collection USING btree (id);


--
-- TOC entry 5040 (class 1259 OID 19495)
-- Name: IDX_id_-71069c16; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_id_-71069c16" ON public.order_cart USING btree (id);


--
-- TOC entry 5057 (class 1259 OID 19534)
-- Name: IDX_id_-71518339; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_id_-71518339" ON public.order_promotion USING btree (id);


--
-- TOC entry 5033 (class 1259 OID 19482)
-- Name: IDX_id_-85069d44; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_id_-85069d44" ON public.invite_rbac_role USING btree (id);


--
-- TOC entry 5010 (class 1259 OID 19430)
-- Name: IDX_id_-a9d4a70b; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_id_-a9d4a70b" ON public.cart_promotion USING btree (id);


--
-- TOC entry 5028 (class 1259 OID 19469)
-- Name: IDX_id_-e88adb96; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_id_-e88adb96" ON public.location_fulfillment_set USING btree (id);


--
-- TOC entry 5046 (class 1259 OID 19508)
-- Name: IDX_id_-e8d2543e; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_id_-e8d2543e" ON public.order_fulfillment USING btree (id);


--
-- TOC entry 5075 (class 1259 OID 19573)
-- Name: IDX_id_17a262437; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_id_17a262437" ON public.product_shipping_profile USING btree (id);


--
-- TOC entry 5081 (class 1259 OID 19587)
-- Name: IDX_id_17b4c4e35; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_id_17b4c4e35" ON public.product_variant_inventory_item USING btree (id);


--
-- TOC entry 5099 (class 1259 OID 19626)
-- Name: IDX_id_1c934dab0; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_id_1c934dab0" ON public.region_payment_provider USING btree (id);


--
-- TOC entry 5069 (class 1259 OID 19560)
-- Name: IDX_id_20b454295; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_id_20b454295" ON public.product_sales_channel USING btree (id);


--
-- TOC entry 5105 (class 1259 OID 19639)
-- Name: IDX_id_26d06f470; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_id_26d06f470" ON public.sales_channel_stock_location USING btree (id);


--
-- TOC entry 5087 (class 1259 OID 19600)
-- Name: IDX_id_52b23597; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_id_52b23597" ON public.product_variant_price_set USING btree (id);


--
-- TOC entry 5017 (class 1259 OID 19443)
-- Name: IDX_id_5cb3a0c0; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_id_5cb3a0c0" ON public.customer_account_holder USING btree (id);


--
-- TOC entry 5117 (class 1259 OID 19665)
-- Name: IDX_id_64ff0c4c; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_id_64ff0c4c" ON public.user_rbac_role USING btree (id);


--
-- TOC entry 5111 (class 1259 OID 19652)
-- Name: IDX_id_ba32fa9c; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_id_ba32fa9c" ON public.shipping_option_price_set USING btree (id);


--
-- TOC entry 5051 (class 1259 OID 19521)
-- Name: IDX_id_f42b9949; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_id_f42b9949" ON public.order_payment_collection USING btree (id);


--
-- TOC entry 4429 (class 1259 OID 16777)
-- Name: IDX_image_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_image_deleted_at" ON public.image USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4430 (class 1259 OID 16836)
-- Name: IDX_image_product_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_image_product_id" ON public.image USING btree (product_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4388 (class 1259 OID 16441)
-- Name: IDX_inventory_item_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_inventory_item_deleted_at" ON public.inventory_item USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 5082 (class 1259 OID 19589)
-- Name: IDX_inventory_item_id_17b4c4e35; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_inventory_item_id_17b4c4e35" ON public.product_variant_inventory_item USING btree (inventory_item_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4389 (class 1259 OID 16529)
-- Name: IDX_inventory_item_sku; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_inventory_item_sku" ON public.inventory_item USING btree (sku) WHERE (deleted_at IS NULL);


--
-- TOC entry 4392 (class 1259 OID 16455)
-- Name: IDX_inventory_level_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_inventory_level_deleted_at" ON public.inventory_level USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4393 (class 1259 OID 16523)
-- Name: IDX_inventory_level_inventory_item_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_inventory_level_inventory_item_id" ON public.inventory_level USING btree (inventory_item_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4394 (class 1259 OID 16524)
-- Name: IDX_inventory_level_location_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_inventory_level_location_id" ON public.inventory_level USING btree (location_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4395 (class 1259 OID 16533)
-- Name: IDX_inventory_level_location_id_inventory_item_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_inventory_level_location_id_inventory_item_id" ON public.inventory_level USING btree (inventory_item_id, location_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4896 (class 1259 OID 18925)
-- Name: IDX_invite_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_invite_deleted_at" ON public.invite USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4897 (class 1259 OID 18938)
-- Name: IDX_invite_email_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_invite_email_unique" ON public.invite USING btree (email) WHERE (deleted_at IS NULL);


--
-- TOC entry 5034 (class 1259 OID 19483)
-- Name: IDX_invite_id_-85069d44; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_invite_id_-85069d44" ON public.invite_rbac_role USING btree (invite_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4898 (class 1259 OID 18924)
-- Name: IDX_invite_token; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_invite_token" ON public.invite USING btree (token) WHERE (deleted_at IS NULL);


--
-- TOC entry 4861 (class 1259 OID 18782)
-- Name: IDX_layout_configuration_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_layout_configuration_deleted_at" ON public.layout_configuration USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4862 (class 1259 OID 18784)
-- Name: IDX_layout_configuration_zone_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_layout_configuration_zone_unique" ON public.layout_configuration USING btree (zone) WHERE ((is_system_default = true) AND (deleted_at IS NULL));


--
-- TOC entry 4863 (class 1259 OID 18783)
-- Name: IDX_layout_configuration_zone_user_id_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_layout_configuration_zone_user_id_unique" ON public.layout_configuration USING btree (zone, user_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4600 (class 1259 OID 17655)
-- Name: IDX_line_item_adjustment_promotion_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_line_item_adjustment_promotion_id" ON public.cart_line_item_adjustment USING btree (promotion_id) WHERE ((deleted_at IS NULL) AND (promotion_id IS NOT NULL));


--
-- TOC entry 4594 (class 1259 OID 17642)
-- Name: IDX_line_item_product_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_line_item_product_id" ON public.cart_line_item USING btree (product_id) WHERE ((deleted_at IS NULL) AND (product_id IS NOT NULL));


--
-- TOC entry 4768 (class 1259 OID 18682)
-- Name: IDX_line_item_product_type_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_line_item_product_type_id" ON public.order_line_item USING btree (product_type_id) WHERE ((deleted_at IS NULL) AND (product_type_id IS NOT NULL));


--
-- TOC entry 4605 (class 1259 OID 17666)
-- Name: IDX_line_item_tax_line_tax_rate_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_line_item_tax_line_tax_rate_id" ON public.cart_line_item_tax_line USING btree (tax_rate_id) WHERE ((deleted_at IS NULL) AND (tax_rate_id IS NOT NULL));


--
-- TOC entry 4595 (class 1259 OID 17643)
-- Name: IDX_line_item_variant_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_line_item_variant_id" ON public.cart_line_item USING btree (variant_id) WHERE ((deleted_at IS NULL) AND (variant_id IS NOT NULL));


--
-- TOC entry 4963 (class 1259 OID 19208)
-- Name: IDX_notification_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_notification_deleted_at" ON public.notification USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4964 (class 1259 OID 19204)
-- Name: IDX_notification_idempotency_key_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_notification_idempotency_key_unique" ON public.notification USING btree (idempotency_key) WHERE (deleted_at IS NULL);


--
-- TOC entry 4960 (class 1259 OID 19207)
-- Name: IDX_notification_provider_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_notification_provider_deleted_at" ON public.notification_provider USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4965 (class 1259 OID 19192)
-- Name: IDX_notification_provider_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_notification_provider_id" ON public.notification USING btree (provider_id);


--
-- TOC entry 4966 (class 1259 OID 19194)
-- Name: IDX_notification_receiver_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_notification_receiver_id" ON public.notification USING btree (receiver_id);


--
-- TOC entry 4424 (class 1259 OID 16588)
-- Name: IDX_option_value_option_id_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_option_value_option_id_unique" ON public.product_option_value USING btree (option_id, value) WHERE (deleted_at IS NULL);


--
-- TOC entry 4712 (class 1259 OID 18171)
-- Name: IDX_order_address_customer_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_address_customer_id" ON public.order_address USING btree (customer_id);


--
-- TOC entry 4713 (class 1259 OID 18619)
-- Name: IDX_order_address_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_address_deleted_at" ON public.order_address USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4716 (class 1259 OID 18654)
-- Name: IDX_order_billing_address_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_billing_address_id" ON public."order" USING btree (billing_address_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4743 (class 1259 OID 18665)
-- Name: IDX_order_change_action_claim_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_change_action_claim_id" ON public.order_change_action USING btree (claim_id) WHERE ((claim_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- TOC entry 4744 (class 1259 OID 18447)
-- Name: IDX_order_change_action_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_change_action_deleted_at" ON public.order_change_action USING btree (deleted_at);


--
-- TOC entry 4745 (class 1259 OID 18666)
-- Name: IDX_order_change_action_exchange_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_change_action_exchange_id" ON public.order_change_action USING btree (exchange_id) WHERE ((exchange_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- TOC entry 4746 (class 1259 OID 18662)
-- Name: IDX_order_change_action_order_change_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_change_action_order_change_id" ON public.order_change_action USING btree (order_change_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4747 (class 1259 OID 18663)
-- Name: IDX_order_change_action_order_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_change_action_order_id" ON public.order_change_action USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4748 (class 1259 OID 18667)
-- Name: IDX_order_change_action_ordering; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_change_action_ordering" ON public.order_change_action USING btree (ordering) WHERE (deleted_at IS NULL);


--
-- TOC entry 4749 (class 1259 OID 18664)
-- Name: IDX_order_change_action_return_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_change_action_return_id" ON public.order_change_action USING btree (return_id) WHERE ((return_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- TOC entry 4732 (class 1259 OID 18436)
-- Name: IDX_order_change_change_type; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_change_change_type" ON public.order_change USING btree (change_type);


--
-- TOC entry 4733 (class 1259 OID 18658)
-- Name: IDX_order_change_claim_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_change_claim_id" ON public.order_change USING btree (claim_id) WHERE ((claim_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- TOC entry 4734 (class 1259 OID 18437)
-- Name: IDX_order_change_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_change_deleted_at" ON public.order_change USING btree (deleted_at);


--
-- TOC entry 4735 (class 1259 OID 18659)
-- Name: IDX_order_change_exchange_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_change_exchange_id" ON public.order_change USING btree (exchange_id) WHERE ((exchange_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- TOC entry 4736 (class 1259 OID 18656)
-- Name: IDX_order_change_order_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_change_order_id" ON public.order_change USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4737 (class 1259 OID 18237)
-- Name: IDX_order_change_order_id_version; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_change_order_id_version" ON public.order_change USING btree (order_id, version);


--
-- TOC entry 4738 (class 1259 OID 18657)
-- Name: IDX_order_change_return_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_change_return_id" ON public.order_change USING btree (return_id) WHERE ((return_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- TOC entry 4739 (class 1259 OID 18660)
-- Name: IDX_order_change_status; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_change_status" ON public.order_change USING btree (status) WHERE (deleted_at IS NULL);


--
-- TOC entry 4740 (class 1259 OID 18661)
-- Name: IDX_order_change_version; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_change_version" ON public.order_change USING btree (order_id, version) WHERE (deleted_at IS NULL);


--
-- TOC entry 4825 (class 1259 OID 18537)
-- Name: IDX_order_claim_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_claim_deleted_at" ON public.order_claim USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4826 (class 1259 OID 18669)
-- Name: IDX_order_claim_display_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_claim_display_id" ON public.order_claim USING btree (display_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4831 (class 1259 OID 18672)
-- Name: IDX_order_claim_item_claim_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_claim_item_claim_id" ON public.order_claim_item USING btree (claim_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4832 (class 1259 OID 18559)
-- Name: IDX_order_claim_item_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_claim_item_deleted_at" ON public.order_claim_item USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4836 (class 1259 OID 18674)
-- Name: IDX_order_claim_item_image_claim_item_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_claim_item_image_claim_item_id" ON public.order_claim_item_image USING btree (claim_item_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4837 (class 1259 OID 18572)
-- Name: IDX_order_claim_item_image_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_claim_item_image_deleted_at" ON public.order_claim_item_image USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4833 (class 1259 OID 18673)
-- Name: IDX_order_claim_item_item_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_claim_item_item_id" ON public.order_claim_item USING btree (item_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4827 (class 1259 OID 18670)
-- Name: IDX_order_claim_order_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_claim_order_id" ON public.order_claim USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4828 (class 1259 OID 18671)
-- Name: IDX_order_claim_return_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_claim_return_id" ON public.order_claim USING btree (return_id) WHERE ((return_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- TOC entry 4840 (class 1259 OID 18630)
-- Name: IDX_order_credit_line_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_credit_line_deleted_at" ON public.order_credit_line USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4841 (class 1259 OID 18675)
-- Name: IDX_order_credit_line_order_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_credit_line_order_id" ON public.order_credit_line USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4842 (class 1259 OID 18711)
-- Name: IDX_order_credit_line_order_id_version; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_credit_line_order_id_version" ON public.order_credit_line USING btree (order_id, version) WHERE (deleted_at IS NULL);


--
-- TOC entry 4717 (class 1259 OID 18652)
-- Name: IDX_order_currency_code; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_currency_code" ON public."order" USING btree (currency_code) WHERE (deleted_at IS NULL);


--
-- TOC entry 4718 (class 1259 OID 18712)
-- Name: IDX_order_custom_display_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_order_custom_display_id" ON public."order" USING btree (custom_display_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4719 (class 1259 OID 18650)
-- Name: IDX_order_customer_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_customer_id" ON public."order" USING btree (customer_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4720 (class 1259 OID 18212)
-- Name: IDX_order_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_deleted_at" ON public."order" USING btree (deleted_at);


--
-- TOC entry 4721 (class 1259 OID 18648)
-- Name: IDX_order_display_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_display_id" ON public."order" USING btree (display_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4814 (class 1259 OID 18504)
-- Name: IDX_order_exchange_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_exchange_deleted_at" ON public.order_exchange USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4815 (class 1259 OID 18676)
-- Name: IDX_order_exchange_display_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_exchange_display_id" ON public.order_exchange USING btree (display_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4820 (class 1259 OID 18516)
-- Name: IDX_order_exchange_item_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_exchange_item_deleted_at" ON public.order_exchange_item USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4821 (class 1259 OID 18679)
-- Name: IDX_order_exchange_item_exchange_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_exchange_item_exchange_id" ON public.order_exchange_item USING btree (exchange_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4822 (class 1259 OID 18680)
-- Name: IDX_order_exchange_item_item_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_exchange_item_item_id" ON public.order_exchange_item USING btree (item_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4816 (class 1259 OID 18677)
-- Name: IDX_order_exchange_order_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_exchange_order_id" ON public.order_exchange USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4817 (class 1259 OID 18678)
-- Name: IDX_order_exchange_return_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_exchange_return_id" ON public.order_exchange USING btree (return_id) WHERE ((return_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- TOC entry 5041 (class 1259 OID 19496)
-- Name: IDX_order_id_-71069c16; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_id_-71069c16" ON public.order_cart USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5058 (class 1259 OID 19535)
-- Name: IDX_order_id_-71518339; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_id_-71518339" ON public.order_promotion USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5047 (class 1259 OID 19509)
-- Name: IDX_order_id_-e8d2543e; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_id_-e8d2543e" ON public.order_fulfillment USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5052 (class 1259 OID 19522)
-- Name: IDX_order_id_f42b9949; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_id_f42b9949" ON public.order_payment_collection USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4722 (class 1259 OID 18655)
-- Name: IDX_order_is_draft_order; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_is_draft_order" ON public."order" USING btree (is_draft_order) WHERE (deleted_at IS NULL);


--
-- TOC entry 4752 (class 1259 OID 18612)
-- Name: IDX_order_item_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_item_deleted_at" ON public.order_item USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4753 (class 1259 OID 18685)
-- Name: IDX_order_item_item_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_item_item_id" ON public.order_item USING btree (item_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4754 (class 1259 OID 18684)
-- Name: IDX_order_item_order_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_item_order_id" ON public.order_item USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4755 (class 1259 OID 18264)
-- Name: IDX_order_item_order_id_version; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_item_order_id_version" ON public.order_item USING btree (order_id, version) WHERE (deleted_at IS NULL);


--
-- TOC entry 4776 (class 1259 OID 18579)
-- Name: IDX_order_line_item_adjustment_item_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_line_item_adjustment_item_id" ON public.order_line_item_adjustment USING btree (item_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4769 (class 1259 OID 18681)
-- Name: IDX_order_line_item_product_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_line_item_product_id" ON public.order_line_item USING btree (product_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4773 (class 1259 OID 18578)
-- Name: IDX_order_line_item_tax_line_item_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_line_item_tax_line_item_id" ON public.order_line_item_tax_line USING btree (item_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4770 (class 1259 OID 18683)
-- Name: IDX_order_line_item_variant_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_line_item_variant_id" ON public.order_line_item USING btree (variant_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4723 (class 1259 OID 18649)
-- Name: IDX_order_region_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_region_id" ON public."order" USING btree (region_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4724 (class 1259 OID 18651)
-- Name: IDX_order_sales_channel_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_sales_channel_id" ON public."order" USING btree (sales_channel_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4725 (class 1259 OID 18653)
-- Name: IDX_order_shipping_address_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_shipping_address_id" ON public."order" USING btree (shipping_address_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4758 (class 1259 OID 18689)
-- Name: IDX_order_shipping_claim_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_shipping_claim_id" ON public.order_shipping USING btree (claim_id) WHERE ((claim_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- TOC entry 4759 (class 1259 OID 18614)
-- Name: IDX_order_shipping_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_shipping_deleted_at" ON public.order_shipping USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4760 (class 1259 OID 18690)
-- Name: IDX_order_shipping_exchange_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_shipping_exchange_id" ON public.order_shipping USING btree (exchange_id) WHERE ((exchange_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- TOC entry 4761 (class 1259 OID 18277)
-- Name: IDX_order_shipping_item_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_shipping_item_id" ON public.order_shipping USING btree (shipping_method_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4782 (class 1259 OID 18577)
-- Name: IDX_order_shipping_method_adjustment_shipping_method_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_shipping_method_adjustment_shipping_method_id" ON public.order_shipping_method_adjustment USING btree (shipping_method_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4783 (class 1259 OID 18733)
-- Name: IDX_order_shipping_method_adjustment_version_shipping_method; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_order_shipping_method_adjustment_version_shipping_method" ON public.order_shipping_method_adjustment USING btree (version, shipping_method_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4779 (class 1259 OID 18573)
-- Name: IDX_order_shipping_method_shipping_option_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_shipping_method_shipping_option_id" ON public.order_shipping_method USING btree (shipping_option_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4786 (class 1259 OID 18576)
-- Name: IDX_order_shipping_method_tax_line_shipping_method_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_shipping_method_tax_line_shipping_method_id" ON public.order_shipping_method_tax_line USING btree (shipping_method_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4762 (class 1259 OID 18687)
-- Name: IDX_order_shipping_order_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_shipping_order_id" ON public.order_shipping USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4763 (class 1259 OID 18276)
-- Name: IDX_order_shipping_order_id_version; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_shipping_order_id_version" ON public.order_shipping USING btree (order_id, version) WHERE (deleted_at IS NULL);


--
-- TOC entry 4764 (class 1259 OID 18688)
-- Name: IDX_order_shipping_return_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_shipping_return_id" ON public.order_shipping USING btree (return_id) WHERE ((return_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- TOC entry 4765 (class 1259 OID 18691)
-- Name: IDX_order_shipping_shipping_method_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_shipping_shipping_method_id" ON public.order_shipping USING btree (shipping_method_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4728 (class 1259 OID 18613)
-- Name: IDX_order_summary_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_summary_deleted_at" ON public.order_summary USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4729 (class 1259 OID 18668)
-- Name: IDX_order_summary_order_id_version; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_summary_order_id_version" ON public.order_summary USING btree (order_id, version) WHERE (deleted_at IS NULL);


--
-- TOC entry 4789 (class 1259 OID 18705)
-- Name: IDX_order_transaction_claim_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_transaction_claim_id" ON public.order_transaction USING btree (claim_id) WHERE ((claim_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- TOC entry 4790 (class 1259 OID 18708)
-- Name: IDX_order_transaction_currency_code; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_transaction_currency_code" ON public.order_transaction USING btree (currency_code) WHERE (deleted_at IS NULL);


--
-- TOC entry 4791 (class 1259 OID 18706)
-- Name: IDX_order_transaction_exchange_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_transaction_exchange_id" ON public.order_transaction USING btree (exchange_id) WHERE ((exchange_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- TOC entry 4792 (class 1259 OID 18702)
-- Name: IDX_order_transaction_order_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_transaction_order_id" ON public.order_transaction USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4793 (class 1259 OID 18703)
-- Name: IDX_order_transaction_order_id_version; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_transaction_order_id_version" ON public.order_transaction USING btree (order_id, version) WHERE (deleted_at IS NULL);


--
-- TOC entry 4794 (class 1259 OID 18707)
-- Name: IDX_order_transaction_reference_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_transaction_reference_id" ON public.order_transaction USING btree (reference_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4795 (class 1259 OID 18704)
-- Name: IDX_order_transaction_return_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_order_transaction_return_id" ON public.order_transaction USING btree (return_id) WHERE ((return_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- TOC entry 4677 (class 1259 OID 18067)
-- Name: IDX_payment_collection_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_payment_collection_deleted_at" ON public.payment_collection USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 5005 (class 1259 OID 19419)
-- Name: IDX_payment_collection_id_-4a39f6c9; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_payment_collection_id_-4a39f6c9" ON public.cart_payment_collection USING btree (payment_collection_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5053 (class 1259 OID 19523)
-- Name: IDX_payment_collection_id_f42b9949; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_payment_collection_id_f42b9949" ON public.order_payment_collection USING btree (payment_collection_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4689 (class 1259 OID 18062)
-- Name: IDX_payment_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_payment_deleted_at" ON public.payment USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4690 (class 1259 OID 18063)
-- Name: IDX_payment_payment_collection_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_payment_payment_collection_id" ON public.payment USING btree (payment_collection_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4691 (class 1259 OID 18115)
-- Name: IDX_payment_payment_session_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_payment_payment_session_id" ON public.payment USING btree (payment_session_id);


--
-- TOC entry 4692 (class 1259 OID 18136)
-- Name: IDX_payment_payment_session_id_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_payment_payment_session_id_unique" ON public.payment USING btree (payment_session_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4680 (class 1259 OID 18122)
-- Name: IDX_payment_provider_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_payment_provider_deleted_at" ON public.payment_provider USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4693 (class 1259 OID 18065)
-- Name: IDX_payment_provider_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_payment_provider_id" ON public.payment USING btree (provider_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5100 (class 1259 OID 19628)
-- Name: IDX_payment_provider_id_1c934dab0; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_payment_provider_id_1c934dab0" ON public.region_payment_provider USING btree (payment_provider_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4685 (class 1259 OID 18114)
-- Name: IDX_payment_session_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_payment_session_deleted_at" ON public.payment_session USING btree (deleted_at);


--
-- TOC entry 4686 (class 1259 OID 18072)
-- Name: IDX_payment_session_payment_collection_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_payment_session_payment_collection_id" ON public.payment_session USING btree (payment_collection_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4479 (class 1259 OID 17190)
-- Name: IDX_price_currency_code; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_price_currency_code" ON public.price USING btree (currency_code) WHERE (deleted_at IS NULL);


--
-- TOC entry 4480 (class 1259 OID 17150)
-- Name: IDX_price_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_price_deleted_at" ON public.price USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4495 (class 1259 OID 17145)
-- Name: IDX_price_list_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_price_list_deleted_at" ON public.price_list USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4496 (class 1259 OID 17244)
-- Name: IDX_price_list_id_status_starts_at_ends_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_price_list_id_status_starts_at_ends_at" ON public.price_list USING btree (id, status, starts_at, ends_at) WHERE ((deleted_at IS NULL) AND (status = 'active'::text));


--
-- TOC entry 4499 (class 1259 OID 17240)
-- Name: IDX_price_list_rule_attribute; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_price_list_rule_attribute" ON public.price_list_rule USING btree (attribute) WHERE (deleted_at IS NULL);


--
-- TOC entry 4500 (class 1259 OID 17162)
-- Name: IDX_price_list_rule_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_price_list_rule_deleted_at" ON public.price_list_rule USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4501 (class 1259 OID 17161)
-- Name: IDX_price_list_rule_price_list_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_price_list_rule_price_list_id" ON public.price_list_rule USING btree (price_list_id) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4502 (class 1259 OID 17245)
-- Name: IDX_price_list_rule_value; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_price_list_rule_value" ON public.price_list_rule USING gin (value) WHERE (deleted_at IS NULL);


--
-- TOC entry 4505 (class 1259 OID 17212)
-- Name: IDX_price_preference_attribute_value; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_price_preference_attribute_value" ON public.price_preference USING btree (attribute, value) WHERE (deleted_at IS NULL);


--
-- TOC entry 4506 (class 1259 OID 17211)
-- Name: IDX_price_preference_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_price_preference_deleted_at" ON public.price_preference USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4481 (class 1259 OID 17149)
-- Name: IDX_price_price_list_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_price_price_list_id" ON public.price USING btree (price_list_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4482 (class 1259 OID 17147)
-- Name: IDX_price_price_set_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_price_price_set_id" ON public.price USING btree (price_set_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4485 (class 1259 OID 17243)
-- Name: IDX_price_rule_attribute; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_price_rule_attribute" ON public.price_rule USING btree (attribute) WHERE (deleted_at IS NULL);


--
-- TOC entry 4486 (class 1259 OID 17241)
-- Name: IDX_price_rule_attribute_value; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_price_rule_attribute_value" ON public.price_rule USING btree (attribute, value) WHERE (deleted_at IS NULL);


--
-- TOC entry 4487 (class 1259 OID 17246)
-- Name: IDX_price_rule_attribute_value_price_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_price_rule_attribute_value_price_id" ON public.price_rule USING btree (attribute, value, price_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4488 (class 1259 OID 17159)
-- Name: IDX_price_rule_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_price_rule_deleted_at" ON public.price_rule USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4489 (class 1259 OID 17215)
-- Name: IDX_price_rule_operator; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_price_rule_operator" ON public.price_rule USING btree (operator);


--
-- TOC entry 4490 (class 1259 OID 17242)
-- Name: IDX_price_rule_operator_value; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_price_rule_operator_value" ON public.price_rule USING btree (operator, value) WHERE (deleted_at IS NULL);


--
-- TOC entry 4491 (class 1259 OID 17239)
-- Name: IDX_price_rule_price_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_price_rule_price_id" ON public.price_rule USING btree (price_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4492 (class 1259 OID 17216)
-- Name: IDX_price_rule_price_id_attribute_operator_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_price_rule_price_id_attribute_operator_unique" ON public.price_rule USING btree (price_id, attribute, operator) WHERE (deleted_at IS NULL);


--
-- TOC entry 4476 (class 1259 OID 17146)
-- Name: IDX_price_set_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_price_set_deleted_at" ON public.price_set USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 5088 (class 1259 OID 19602)
-- Name: IDX_price_set_id_52b23597; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_price_set_id_52b23597" ON public.product_variant_price_set USING btree (price_set_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5112 (class 1259 OID 19654)
-- Name: IDX_price_set_id_ba32fa9c; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_price_set_id_ba32fa9c" ON public.shipping_option_price_set USING btree (price_set_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4450 (class 1259 OID 16776)
-- Name: IDX_product_category_parent_category_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_product_category_parent_category_id" ON public.product_category USING btree (parent_category_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4451 (class 1259 OID 16648)
-- Name: IDX_product_category_path; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_product_category_path" ON public.product_category USING btree (mpath) WHERE (deleted_at IS NULL);


--
-- TOC entry 4446 (class 1259 OID 16633)
-- Name: IDX_product_collection_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_product_collection_deleted_at" ON public.product_collection USING btree (deleted_at);


--
-- TOC entry 4404 (class 1259 OID 16548)
-- Name: IDX_product_collection_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_product_collection_id" ON public.product USING btree (collection_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4405 (class 1259 OID 16549)
-- Name: IDX_product_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_product_deleted_at" ON public.product USING btree (deleted_at);


--
-- TOC entry 4406 (class 1259 OID 16546)
-- Name: IDX_product_handle_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_product_handle_unique" ON public.product USING btree (handle) WHERE (deleted_at IS NULL);


--
-- TOC entry 5076 (class 1259 OID 19574)
-- Name: IDX_product_id_17a262437; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_product_id_17a262437" ON public.product_shipping_profile USING btree (product_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5070 (class 1259 OID 19561)
-- Name: IDX_product_id_20b454295; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_product_id_20b454295" ON public.product_sales_channel USING btree (product_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4431 (class 1259 OID 16838)
-- Name: IDX_product_image_rank; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_product_image_rank" ON public.image USING btree (rank) WHERE (deleted_at IS NULL);


--
-- TOC entry 4432 (class 1259 OID 16840)
-- Name: IDX_product_image_rank_product_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_product_image_rank_product_id" ON public.image USING btree (rank, product_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4433 (class 1259 OID 16599)
-- Name: IDX_product_image_url; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_product_image_url" ON public.image USING btree (url) WHERE (deleted_at IS NULL);


--
-- TOC entry 4434 (class 1259 OID 16839)
-- Name: IDX_product_image_url_rank_product_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_product_image_url_rank_product_id" ON public.image USING btree (url, rank, product_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4420 (class 1259 OID 16578)
-- Name: IDX_product_option_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_product_option_deleted_at" ON public.product_option USING btree (deleted_at);


--
-- TOC entry 4421 (class 1259 OID 17000)
-- Name: IDX_product_option_global_title_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_product_option_global_title_unique" ON public.product_option USING btree (title) WHERE ((deleted_at IS NULL) AND (is_exclusive = false));


--
-- TOC entry 4425 (class 1259 OID 16589)
-- Name: IDX_product_option_value_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_product_option_value_deleted_at" ON public.product_option_value USING btree (deleted_at);


--
-- TOC entry 4426 (class 1259 OID 16787)
-- Name: IDX_product_option_value_option_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_product_option_value_option_id" ON public.product_option_value USING btree (option_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4465 (class 1259 OID 16880)
-- Name: IDX_product_product_option_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_product_product_option_deleted_at" ON public.product_product_option USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4466 (class 1259 OID 16878)
-- Name: IDX_product_product_option_product_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_product_product_option_product_id" ON public.product_product_option USING btree (product_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4467 (class 1259 OID 16879)
-- Name: IDX_product_product_option_product_option_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_product_product_option_product_option_id" ON public.product_product_option USING btree (product_option_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4470 (class 1259 OID 16893)
-- Name: IDX_product_product_option_value_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_product_product_option_value_deleted_at" ON public.product_product_option_value USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4471 (class 1259 OID 16892)
-- Name: IDX_product_product_option_value_product_option_value_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_product_product_option_value_product_option_value_id" ON public.product_product_option_value USING btree (product_option_value_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4472 (class 1259 OID 16891)
-- Name: IDX_product_product_option_value_product_product_option_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_product_product_option_value_product_product_option_id" ON public.product_product_option_value USING btree (product_product_option_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4473 (class 1259 OID 17001)
-- Name: IDX_product_product_option_value_product_product_option_id_fk; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_product_product_option_value_product_product_option_id_fk" ON public.product_product_option_value USING btree (product_product_option_id);


--
-- TOC entry 4407 (class 1259 OID 16841)
-- Name: IDX_product_status; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_product_status" ON public.product USING btree (status) WHERE (deleted_at IS NULL);


--
-- TOC entry 4437 (class 1259 OID 16611)
-- Name: IDX_product_tag_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_product_tag_deleted_at" ON public.product_tag USING btree (deleted_at);


--
-- TOC entry 4441 (class 1259 OID 16622)
-- Name: IDX_product_type_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_product_type_deleted_at" ON public.product_type USING btree (deleted_at);


--
-- TOC entry 4408 (class 1259 OID 16547)
-- Name: IDX_product_type_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_product_type_id" ON public.product USING btree (type_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4411 (class 1259 OID 16565)
-- Name: IDX_product_variant_barcode_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_product_variant_barcode_unique" ON public.product_variant USING btree (barcode) WHERE (deleted_at IS NULL);


--
-- TOC entry 4412 (class 1259 OID 16567)
-- Name: IDX_product_variant_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_product_variant_deleted_at" ON public.product_variant USING btree (deleted_at);


--
-- TOC entry 4413 (class 1259 OID 16562)
-- Name: IDX_product_variant_ean_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_product_variant_ean_unique" ON public.product_variant USING btree (ean) WHERE (deleted_at IS NULL);


--
-- TOC entry 4414 (class 1259 OID 16837)
-- Name: IDX_product_variant_id_product_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_product_variant_id_product_id" ON public.product_variant USING btree (id, product_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4415 (class 1259 OID 16566)
-- Name: IDX_product_variant_product_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_product_variant_product_id" ON public.product_variant USING btree (product_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4460 (class 1259 OID 16858)
-- Name: IDX_product_variant_product_image_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_product_variant_product_image_deleted_at" ON public.product_variant_product_image USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4461 (class 1259 OID 16857)
-- Name: IDX_product_variant_product_image_image_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_product_variant_product_image_image_id" ON public.product_variant_product_image USING btree (image_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4462 (class 1259 OID 16856)
-- Name: IDX_product_variant_product_image_variant_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_product_variant_product_image_variant_id" ON public.product_variant_product_image USING btree (variant_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4416 (class 1259 OID 16564)
-- Name: IDX_product_variant_sku_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_product_variant_sku_unique" ON public.product_variant USING btree (sku) WHERE (deleted_at IS NULL);


--
-- TOC entry 4417 (class 1259 OID 16563)
-- Name: IDX_product_variant_upc_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_product_variant_upc_unique" ON public.product_variant USING btree (upc) WHERE (deleted_at IS NULL);


--
-- TOC entry 4529 (class 1259 OID 17423)
-- Name: IDX_promotion_application_method_currency_code; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_promotion_application_method_currency_code" ON public.promotion_application_method USING btree (currency_code) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4530 (class 1259 OID 17469)
-- Name: IDX_promotion_application_method_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_promotion_application_method_deleted_at" ON public.promotion_application_method USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4531 (class 1259 OID 17477)
-- Name: IDX_promotion_application_method_promotion_id_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_promotion_application_method_promotion_id_unique" ON public.promotion_application_method USING btree (promotion_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4514 (class 1259 OID 17476)
-- Name: IDX_promotion_campaign_budget_campaign_id_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_promotion_campaign_budget_campaign_id_unique" ON public.promotion_campaign_budget USING btree (campaign_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4515 (class 1259 OID 17432)
-- Name: IDX_promotion_campaign_budget_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_promotion_campaign_budget_deleted_at" ON public.promotion_campaign_budget USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4553 (class 1259 OID 17492)
-- Name: IDX_promotion_campaign_budget_usage_attribute_value_budget_id_u; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_promotion_campaign_budget_usage_attribute_value_budget_id_u" ON public.promotion_campaign_budget_usage USING btree (attribute_value, budget_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4554 (class 1259 OID 17490)
-- Name: IDX_promotion_campaign_budget_usage_budget_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_promotion_campaign_budget_usage_budget_id" ON public.promotion_campaign_budget_usage USING btree (budget_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4555 (class 1259 OID 17491)
-- Name: IDX_promotion_campaign_budget_usage_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_promotion_campaign_budget_usage_deleted_at" ON public.promotion_campaign_budget_usage USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4509 (class 1259 OID 17424)
-- Name: IDX_promotion_campaign_campaign_identifier_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_promotion_campaign_campaign_identifier_unique" ON public.promotion_campaign USING btree (campaign_identifier) WHERE (deleted_at IS NULL);


--
-- TOC entry 4510 (class 1259 OID 17425)
-- Name: IDX_promotion_campaign_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_promotion_campaign_deleted_at" ON public.promotion_campaign USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4518 (class 1259 OID 17433)
-- Name: IDX_promotion_campaign_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_promotion_campaign_id" ON public.promotion USING btree (campaign_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4519 (class 1259 OID 17434)
-- Name: IDX_promotion_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_promotion_deleted_at" ON public.promotion USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 5059 (class 1259 OID 19536)
-- Name: IDX_promotion_id_-71518339; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_promotion_id_-71518339" ON public.order_promotion USING btree (promotion_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5011 (class 1259 OID 19432)
-- Name: IDX_promotion_id_-a9d4a70b; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_promotion_id_-a9d4a70b" ON public.cart_promotion USING btree (promotion_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4520 (class 1259 OID 17500)
-- Name: IDX_promotion_is_automatic; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_promotion_is_automatic" ON public.promotion USING btree (is_automatic) WHERE (deleted_at IS NULL);


--
-- TOC entry 4534 (class 1259 OID 17334)
-- Name: IDX_promotion_rule_attribute; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_promotion_rule_attribute" ON public.promotion_rule USING btree (attribute);


--
-- TOC entry 4535 (class 1259 OID 17499)
-- Name: IDX_promotion_rule_attribute_operator; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_promotion_rule_attribute_operator" ON public.promotion_rule USING btree (attribute, operator) WHERE (deleted_at IS NULL);


--
-- TOC entry 4536 (class 1259 OID 17503)
-- Name: IDX_promotion_rule_attribute_operator_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_promotion_rule_attribute_operator_id" ON public.promotion_rule USING btree (operator, attribute, id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4537 (class 1259 OID 17470)
-- Name: IDX_promotion_rule_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_promotion_rule_deleted_at" ON public.promotion_rule USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4538 (class 1259 OID 17335)
-- Name: IDX_promotion_rule_operator; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_promotion_rule_operator" ON public.promotion_rule USING btree (operator);


--
-- TOC entry 4547 (class 1259 OID 17472)
-- Name: IDX_promotion_rule_value_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_promotion_rule_value_deleted_at" ON public.promotion_rule_value USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4548 (class 1259 OID 17471)
-- Name: IDX_promotion_rule_value_promotion_rule_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_promotion_rule_value_promotion_rule_id" ON public.promotion_rule_value USING btree (promotion_rule_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4549 (class 1259 OID 17501)
-- Name: IDX_promotion_rule_value_rule_id_value; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_promotion_rule_value_rule_id_value" ON public.promotion_rule_value USING btree (promotion_rule_id, value) WHERE (deleted_at IS NULL);


--
-- TOC entry 4550 (class 1259 OID 17502)
-- Name: IDX_promotion_rule_value_value; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_promotion_rule_value_value" ON public.promotion_rule_value USING btree (value) WHERE (deleted_at IS NULL);


--
-- TOC entry 4521 (class 1259 OID 17475)
-- Name: IDX_promotion_status; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_promotion_status" ON public.promotion USING btree (status) WHERE (deleted_at IS NULL);


--
-- TOC entry 4522 (class 1259 OID 17304)
-- Name: IDX_promotion_type; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_promotion_type" ON public.promotion USING btree (type);


--
-- TOC entry 4856 (class 1259 OID 18769)
-- Name: IDX_property_label_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_property_label_deleted_at" ON public.property_label USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4857 (class 1259 OID 18771)
-- Name: IDX_property_label_entity; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_property_label_entity" ON public.property_label USING btree (entity) WHERE (deleted_at IS NULL);


--
-- TOC entry 4858 (class 1259 OID 18770)
-- Name: IDX_property_label_entity_property_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_property_label_entity_property_unique" ON public.property_label USING btree (entity, property) WHERE (deleted_at IS NULL);


--
-- TOC entry 4869 (class 1259 OID 18803)
-- Name: IDX_provider_identity_auth_identity_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_provider_identity_auth_identity_id" ON public.provider_identity USING btree (auth_identity_id);


--
-- TOC entry 4870 (class 1259 OID 18813)
-- Name: IDX_provider_identity_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_provider_identity_deleted_at" ON public.provider_identity USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4871 (class 1259 OID 18804)
-- Name: IDX_provider_identity_provider_entity_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_provider_identity_provider_entity_id" ON public.provider_identity USING btree (entity_id, provider);


--
-- TOC entry 5094 (class 1259 OID 19614)
-- Name: IDX_publishable_key_id_-1d67bae40; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_publishable_key_id_-1d67bae40" ON public.publishable_api_key_sales_channel USING btree (publishable_key_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5035 (class 1259 OID 19484)
-- Name: IDX_rbac_role_id_-85069d44; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_rbac_role_id_-85069d44" ON public.invite_rbac_role USING btree (rbac_role_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5118 (class 1259 OID 19667)
-- Name: IDX_rbac_role_id_64ff0c4c; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_rbac_role_id_64ff0c4c" ON public.user_rbac_role USING btree (rbac_role_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4696 (class 1259 OID 18119)
-- Name: IDX_refund_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_refund_deleted_at" ON public.refund USING btree (deleted_at);


--
-- TOC entry 4697 (class 1259 OID 18068)
-- Name: IDX_refund_payment_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_refund_payment_id" ON public.refund USING btree (payment_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4705 (class 1259 OID 18134)
-- Name: IDX_refund_reason_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_refund_reason_deleted_at" ON public.refund_reason USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4698 (class 1259 OID 18135)
-- Name: IDX_refund_refund_reason_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_refund_refund_reason_id" ON public.refund USING btree (refund_reason_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4631 (class 1259 OID 17840)
-- Name: IDX_region_country_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_region_country_deleted_at" ON public.region_country USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4632 (class 1259 OID 17839)
-- Name: IDX_region_country_region_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_region_country_region_id" ON public.region_country USING btree (region_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4633 (class 1259 OID 17831)
-- Name: IDX_region_country_region_id_iso_2_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_region_country_region_id_iso_2_unique" ON public.region_country USING btree (region_id, iso_2);


--
-- TOC entry 4628 (class 1259 OID 17823)
-- Name: IDX_region_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_region_deleted_at" ON public.region USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 5101 (class 1259 OID 19627)
-- Name: IDX_region_id_1c934dab0; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_region_id_1c934dab0" ON public.region_payment_provider USING btree (region_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4398 (class 1259 OID 16468)
-- Name: IDX_reservation_item_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_reservation_item_deleted_at" ON public.reservation_item USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4399 (class 1259 OID 16527)
-- Name: IDX_reservation_item_inventory_item_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_reservation_item_inventory_item_id" ON public.reservation_item USING btree (inventory_item_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4400 (class 1259 OID 16525)
-- Name: IDX_reservation_item_line_item_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_reservation_item_line_item_id" ON public.reservation_item USING btree (line_item_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4401 (class 1259 OID 16526)
-- Name: IDX_reservation_item_location_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_reservation_item_location_id" ON public.reservation_item USING btree (location_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4802 (class 1259 OID 18696)
-- Name: IDX_return_claim_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_return_claim_id" ON public.return USING btree (claim_id) WHERE ((claim_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- TOC entry 4803 (class 1259 OID 18693)
-- Name: IDX_return_display_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_return_display_id" ON public.return USING btree (display_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4804 (class 1259 OID 18695)
-- Name: IDX_return_exchange_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_return_exchange_id" ON public.return USING btree (exchange_id) WHERE ((exchange_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- TOC entry 5065 (class 1259 OID 19548)
-- Name: IDX_return_id_-31ea43a; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_return_id_-31ea43a" ON public.return_fulfillment USING btree (return_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4808 (class 1259 OID 18487)
-- Name: IDX_return_item_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_return_item_deleted_at" ON public.return_item USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4809 (class 1259 OID 18698)
-- Name: IDX_return_item_item_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_return_item_item_id" ON public.return_item USING btree (item_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4810 (class 1259 OID 18699)
-- Name: IDX_return_item_reason_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_return_item_reason_id" ON public.return_item USING btree (reason_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4811 (class 1259 OID 18697)
-- Name: IDX_return_item_return_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_return_item_return_id" ON public.return_item USING btree (return_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4805 (class 1259 OID 18694)
-- Name: IDX_return_order_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_return_order_id" ON public.return USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4798 (class 1259 OID 18701)
-- Name: IDX_return_reason_parent_return_reason_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_return_reason_parent_return_reason_id" ON public.return_reason USING btree (parent_return_reason_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4799 (class 1259 OID 18700)
-- Name: IDX_return_reason_value; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_return_reason_value" ON public.return_reason USING btree (value) WHERE (deleted_at IS NULL);


--
-- TOC entry 4577 (class 1259 OID 17593)
-- Name: IDX_sales_channel_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_sales_channel_deleted_at" ON public.sales_channel USING btree (deleted_at);


--
-- TOC entry 5095 (class 1259 OID 19615)
-- Name: IDX_sales_channel_id_-1d67bae40; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_sales_channel_id_-1d67bae40" ON public.publishable_api_key_sales_channel USING btree (sales_channel_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5071 (class 1259 OID 19562)
-- Name: IDX_sales_channel_id_20b454295; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_sales_channel_id_20b454295" ON public.product_sales_channel USING btree (sales_channel_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5106 (class 1259 OID 19640)
-- Name: IDX_sales_channel_id_26d06f470; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_sales_channel_id_26d06f470" ON public.sales_channel_stock_location USING btree (sales_channel_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4969 (class 1259 OID 19220)
-- Name: IDX_search_index_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_search_index_deleted_at" ON public.search_index USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4970 (class 1259 OID 19221)
-- Name: IDX_search_index_name; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_search_index_name" ON public.search_index USING btree (name) WHERE (deleted_at IS NULL);


--
-- TOC entry 4973 (class 1259 OID 19235)
-- Name: IDX_search_index_sync_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_search_index_sync_deleted_at" ON public.search_index_sync USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4974 (class 1259 OID 19236)
-- Name: IDX_search_index_sync_job_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_search_index_sync_job_id" ON public.search_index_sync USING btree (job_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4975 (class 1259 OID 19266)
-- Name: IDX_search_index_sync_search_index_version_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_search_index_sync_search_index_version_id" ON public.search_index_sync USING btree (search_index_version_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4978 (class 1259 OID 19254)
-- Name: IDX_search_index_version_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_search_index_version_deleted_at" ON public.search_index_version USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4979 (class 1259 OID 19253)
-- Name: IDX_search_index_version_search_index_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_search_index_version_search_index_id" ON public.search_index_version USING btree (search_index_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4980 (class 1259 OID 19255)
-- Name: IDX_search_index_version_search_index_id_version; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_search_index_version_search_index_id_version" ON public.search_index_version USING btree (search_index_id, version) WHERE (deleted_at IS NULL);


--
-- TOC entry 4915 (class 1259 OID 18980)
-- Name: IDX_service_zone_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_service_zone_deleted_at" ON public.service_zone USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4916 (class 1259 OID 18979)
-- Name: IDX_service_zone_fulfillment_set_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_service_zone_fulfillment_set_id" ON public.service_zone USING btree (fulfillment_set_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4917 (class 1259 OID 18978)
-- Name: IDX_service_zone_name_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_service_zone_name_unique" ON public.service_zone USING btree (name) WHERE (deleted_at IS NULL);


--
-- TOC entry 4615 (class 1259 OID 17690)
-- Name: IDX_shipping_method_adjustment_promotion_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_shipping_method_adjustment_promotion_id" ON public.cart_shipping_method_adjustment USING btree (promotion_id) WHERE ((deleted_at IS NULL) AND (promotion_id IS NOT NULL));


--
-- TOC entry 4610 (class 1259 OID 17679)
-- Name: IDX_shipping_method_option_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_shipping_method_option_id" ON public.cart_shipping_method USING btree (shipping_option_id) WHERE ((deleted_at IS NULL) AND (shipping_option_id IS NOT NULL));


--
-- TOC entry 4620 (class 1259 OID 17701)
-- Name: IDX_shipping_method_tax_line_tax_rate_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_shipping_method_tax_line_tax_rate_id" ON public.cart_shipping_method_tax_line USING btree (tax_rate_id) WHERE ((deleted_at IS NULL) AND (tax_rate_id IS NOT NULL));


--
-- TOC entry 4934 (class 1259 OID 19035)
-- Name: IDX_shipping_option_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_shipping_option_deleted_at" ON public.shipping_option USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 5113 (class 1259 OID 19653)
-- Name: IDX_shipping_option_id_ba32fa9c; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_shipping_option_id_ba32fa9c" ON public.shipping_option_price_set USING btree (shipping_option_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4935 (class 1259 OID 19164)
-- Name: IDX_shipping_option_provider_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_shipping_option_provider_id" ON public.shipping_option USING btree (provider_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4941 (class 1259 OID 19047)
-- Name: IDX_shipping_option_rule_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_shipping_option_rule_deleted_at" ON public.shipping_option_rule USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4942 (class 1259 OID 19046)
-- Name: IDX_shipping_option_rule_shipping_option_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_shipping_option_rule_shipping_option_id" ON public.shipping_option_rule USING btree (shipping_option_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4936 (class 1259 OID 19031)
-- Name: IDX_shipping_option_service_zone_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_shipping_option_service_zone_id" ON public.shipping_option USING btree (service_zone_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4937 (class 1259 OID 19175)
-- Name: IDX_shipping_option_shipping_option_type_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_shipping_option_shipping_option_type_id" ON public.shipping_option USING btree (shipping_option_type_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4938 (class 1259 OID 19032)
-- Name: IDX_shipping_option_shipping_profile_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_shipping_option_shipping_profile_id" ON public.shipping_option USING btree (shipping_profile_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4927 (class 1259 OID 19006)
-- Name: IDX_shipping_option_type_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_shipping_option_type_deleted_at" ON public.shipping_option_type USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4930 (class 1259 OID 19017)
-- Name: IDX_shipping_profile_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_shipping_profile_deleted_at" ON public.shipping_profile USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 5077 (class 1259 OID 19575)
-- Name: IDX_shipping_profile_id_17a262437; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_shipping_profile_id_17a262437" ON public.product_shipping_profile USING btree (shipping_profile_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4931 (class 1259 OID 19016)
-- Name: IDX_shipping_profile_name_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_shipping_profile_name_unique" ON public.shipping_profile USING btree (name) WHERE (deleted_at IS NULL);


--
-- TOC entry 4664 (class 1259 OID 17938)
-- Name: IDX_single_default_region; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_single_default_region" ON public.tax_rate USING btree (tax_region_id) WHERE ((is_default = true) AND (deleted_at IS NULL));


--
-- TOC entry 4381 (class 1259 OID 16406)
-- Name: IDX_stock_location_address_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_stock_location_address_deleted_at" ON public.stock_location_address USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4384 (class 1259 OID 16430)
-- Name: IDX_stock_location_address_id_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_stock_location_address_id_unique" ON public.stock_location USING btree (address_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4385 (class 1259 OID 16416)
-- Name: IDX_stock_location_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_stock_location_deleted_at" ON public.stock_location USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 5023 (class 1259 OID 19457)
-- Name: IDX_stock_location_id_-1e5992737; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_stock_location_id_-1e5992737" ON public.location_fulfillment_provider USING btree (stock_location_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5029 (class 1259 OID 19470)
-- Name: IDX_stock_location_id_-e88adb96; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_stock_location_id_-e88adb96" ON public.location_fulfillment_set USING btree (stock_location_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5107 (class 1259 OID 19641)
-- Name: IDX_stock_location_id_26d06f470; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_stock_location_id_26d06f470" ON public.sales_channel_stock_location USING btree (stock_location_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4646 (class 1259 OID 17879)
-- Name: IDX_store_currency_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_store_currency_deleted_at" ON public.store_currency USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4647 (class 1259 OID 17885)
-- Name: IDX_store_currency_store_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_store_currency_store_id" ON public.store_currency USING btree (store_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4643 (class 1259 OID 17868)
-- Name: IDX_store_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_store_deleted_at" ON public.store USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4650 (class 1259 OID 17897)
-- Name: IDX_store_locale_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_store_locale_deleted_at" ON public.store_locale USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4651 (class 1259 OID 17896)
-- Name: IDX_store_locale_store_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_store_locale_store_id" ON public.store_locale USING btree (store_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4438 (class 1259 OID 16610)
-- Name: IDX_tag_value_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_tag_value_unique" ON public.product_tag USING btree (value) WHERE (deleted_at IS NULL);


--
-- TOC entry 4654 (class 1259 OID 17976)
-- Name: IDX_tax_provider_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_tax_provider_deleted_at" ON public.tax_provider USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4665 (class 1259 OID 17937)
-- Name: IDX_tax_rate_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_tax_rate_deleted_at" ON public.tax_rate USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4669 (class 1259 OID 17950)
-- Name: IDX_tax_rate_rule_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_tax_rate_rule_deleted_at" ON public.tax_rate_rule USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4670 (class 1259 OID 17949)
-- Name: IDX_tax_rate_rule_reference_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_tax_rate_rule_reference_id" ON public.tax_rate_rule USING btree (reference_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4671 (class 1259 OID 17948)
-- Name: IDX_tax_rate_rule_tax_rate_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_tax_rate_rule_tax_rate_id" ON public.tax_rate_rule USING btree (tax_rate_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4672 (class 1259 OID 17951)
-- Name: IDX_tax_rate_rule_unique_rate_reference; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_tax_rate_rule_unique_rate_reference" ON public.tax_rate_rule USING btree (tax_rate_id, reference_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4666 (class 1259 OID 17936)
-- Name: IDX_tax_rate_tax_region_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_tax_rate_tax_region_id" ON public.tax_rate USING btree (tax_region_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4657 (class 1259 OID 17923)
-- Name: IDX_tax_region_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_tax_region_deleted_at" ON public.tax_region USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4658 (class 1259 OID 17922)
-- Name: IDX_tax_region_parent_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_tax_region_parent_id" ON public.tax_region USING btree (parent_id);


--
-- TOC entry 4659 (class 1259 OID 17977)
-- Name: IDX_tax_region_provider_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_tax_region_provider_id" ON public.tax_region USING btree (provider_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4660 (class 1259 OID 17973)
-- Name: IDX_tax_region_unique_country_nullable_province; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_tax_region_unique_country_nullable_province" ON public.tax_region USING btree (country_code) WHERE ((province_code IS NULL) AND (deleted_at IS NULL));


--
-- TOC entry 4661 (class 1259 OID 17972)
-- Name: IDX_tax_region_unique_country_province; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_tax_region_unique_country_province" ON public.tax_region USING btree (country_code, province_code) WHERE (deleted_at IS NULL);


--
-- TOC entry 4442 (class 1259 OID 16621)
-- Name: IDX_type_value_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_type_value_unique" ON public.product_type USING btree (value) WHERE (deleted_at IS NULL);


--
-- TOC entry 4523 (class 1259 OID 17478)
-- Name: IDX_unique_promotion_code; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_unique_promotion_code" ON public.promotion USING btree (code) WHERE (deleted_at IS NULL);


--
-- TOC entry 4901 (class 1259 OID 18936)
-- Name: IDX_user_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_user_deleted_at" ON public."user" USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- TOC entry 4902 (class 1259 OID 18939)
-- Name: IDX_user_email_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_user_email_unique" ON public."user" USING btree (email) WHERE (deleted_at IS NULL);


--
-- TOC entry 5119 (class 1259 OID 19666)
-- Name: IDX_user_id_64ff0c4c; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_user_id_64ff0c4c" ON public.user_rbac_role USING btree (user_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4845 (class 1259 OID 18743)
-- Name: IDX_user_preference_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_user_preference_deleted_at" ON public.user_preference USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4846 (class 1259 OID 18745)
-- Name: IDX_user_preference_user_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_user_preference_user_id" ON public.user_preference USING btree (user_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4847 (class 1259 OID 18744)
-- Name: IDX_user_preference_user_id_key_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_user_preference_user_id_key_unique" ON public.user_preference USING btree (user_id, key) WHERE (deleted_at IS NULL);


--
-- TOC entry 5083 (class 1259 OID 19588)
-- Name: IDX_variant_id_17b4c4e35; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_variant_id_17b4c4e35" ON public.product_variant_inventory_item USING btree (variant_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5089 (class 1259 OID 19601)
-- Name: IDX_variant_id_52b23597; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_variant_id_52b23597" ON public.product_variant_price_set USING btree (variant_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4850 (class 1259 OID 18756)
-- Name: IDX_view_configuration_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_view_configuration_deleted_at" ON public.view_configuration USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4851 (class 1259 OID 18758)
-- Name: IDX_view_configuration_entity_is_system_default; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_view_configuration_entity_is_system_default" ON public.view_configuration USING btree (entity, is_system_default) WHERE (deleted_at IS NULL);


--
-- TOC entry 4852 (class 1259 OID 18757)
-- Name: IDX_view_configuration_entity_user_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_view_configuration_entity_user_id" ON public.view_configuration USING btree (entity, user_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4853 (class 1259 OID 18759)
-- Name: IDX_view_configuration_user_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_view_configuration_user_id" ON public.view_configuration USING btree (user_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4985 (class 1259 OID 19380)
-- Name: IDX_workflow_execution_deleted_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_workflow_execution_deleted_at" ON public.workflow_execution USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4986 (class 1259 OID 19381)
-- Name: IDX_workflow_execution_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_workflow_execution_id" ON public.workflow_execution USING btree (id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4987 (class 1259 OID 19393)
-- Name: IDX_workflow_execution_retention_time_updated_at_state; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_workflow_execution_retention_time_updated_at_state" ON public.workflow_execution USING btree (retention_time, updated_at, state) WHERE ((deleted_at IS NULL) AND (retention_time IS NOT NULL));


--
-- TOC entry 4988 (class 1259 OID 19390)
-- Name: IDX_workflow_execution_run_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_workflow_execution_run_id" ON public.workflow_execution USING btree (run_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4989 (class 1259 OID 19384)
-- Name: IDX_workflow_execution_state; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_workflow_execution_state" ON public.workflow_execution USING btree (state) WHERE (deleted_at IS NULL);


--
-- TOC entry 4990 (class 1259 OID 19392)
-- Name: IDX_workflow_execution_state_updated_at; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_workflow_execution_state_updated_at" ON public.workflow_execution USING btree (state, updated_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 4991 (class 1259 OID 19383)
-- Name: IDX_workflow_execution_transaction_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_workflow_execution_transaction_id" ON public.workflow_execution USING btree (transaction_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4992 (class 1259 OID 19394)
-- Name: IDX_workflow_execution_updated_at_retention_time; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_workflow_execution_updated_at_retention_time" ON public.workflow_execution USING btree (updated_at, retention_time) WHERE ((deleted_at IS NULL) AND (retention_time IS NOT NULL) AND ((state)::text = ANY ((ARRAY['done'::character varying, 'failed'::character varying, 'reverted'::character varying])::text[])));


--
-- TOC entry 4993 (class 1259 OID 19382)
-- Name: IDX_workflow_execution_workflow_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_workflow_execution_workflow_id" ON public.workflow_execution USING btree (workflow_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4994 (class 1259 OID 19391)
-- Name: IDX_workflow_execution_workflow_id_transaction_id; Type: INDEX; Schema: public; Owner: commerce
--

CREATE INDEX "IDX_workflow_execution_workflow_id_transaction_id" ON public.workflow_execution USING btree (workflow_id, transaction_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4995 (class 1259 OID 19387)
-- Name: IDX_workflow_execution_workflow_id_transaction_id_run_id_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX "IDX_workflow_execution_workflow_id_transaction_id_run_id_unique" ON public.workflow_execution USING btree (workflow_id, transaction_id, run_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5122 (class 1259 OID 19677)
-- Name: idx_script_name_unique; Type: INDEX; Schema: public; Owner: commerce
--

CREATE UNIQUE INDEX idx_script_name_unique ON public.script_migrations USING btree (script_name);


--
-- TOC entry 5178 (class 2606 OID 17967)
-- Name: tax_rate_rule FK_tax_rate_rule_tax_rate_id; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.tax_rate_rule
    ADD CONSTRAINT "FK_tax_rate_rule_tax_rate_id" FOREIGN KEY (tax_rate_id) REFERENCES public.tax_rate(id) ON DELETE CASCADE;


--
-- TOC entry 5177 (class 2606 OID 17962)
-- Name: tax_rate FK_tax_rate_tax_region_id; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.tax_rate
    ADD CONSTRAINT "FK_tax_rate_tax_region_id" FOREIGN KEY (tax_region_id) REFERENCES public.tax_region(id) ON DELETE CASCADE;


--
-- TOC entry 5175 (class 2606 OID 17957)
-- Name: tax_region FK_tax_region_parent_id; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.tax_region
    ADD CONSTRAINT "FK_tax_region_parent_id" FOREIGN KEY (parent_id) REFERENCES public.tax_region(id) ON DELETE CASCADE;


--
-- TOC entry 5176 (class 2606 OID 17952)
-- Name: tax_region FK_tax_region_provider_id; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.tax_region
    ADD CONSTRAINT "FK_tax_region_provider_id" FOREIGN KEY (provider_id) REFERENCES public.tax_provider(id) ON DELETE SET NULL;


--
-- TOC entry 5156 (class 2606 OID 17402)
-- Name: application_method_buy_rules application_method_buy_rules_application_method_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.application_method_buy_rules
    ADD CONSTRAINT application_method_buy_rules_application_method_id_foreign FOREIGN KEY (application_method_id) REFERENCES public.promotion_application_method(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5157 (class 2606 OID 17407)
-- Name: application_method_buy_rules application_method_buy_rules_promotion_rule_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.application_method_buy_rules
    ADD CONSTRAINT application_method_buy_rules_promotion_rule_id_foreign FOREIGN KEY (promotion_rule_id) REFERENCES public.promotion_rule(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5154 (class 2606 OID 17392)
-- Name: application_method_target_rules application_method_target_rules_application_method_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.application_method_target_rules
    ADD CONSTRAINT application_method_target_rules_application_method_id_foreign FOREIGN KEY (application_method_id) REFERENCES public.promotion_application_method(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5155 (class 2606 OID 17397)
-- Name: application_method_target_rules application_method_target_rules_promotion_rule_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.application_method_target_rules
    ADD CONSTRAINT application_method_target_rules_promotion_rule_id_foreign FOREIGN KEY (promotion_rule_id) REFERENCES public.promotion_rule(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5202 (class 2606 OID 18838)
-- Name: auth_mfa_factor auth_mfa_factor_auth_identity_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.auth_mfa_factor
    ADD CONSTRAINT auth_mfa_factor_auth_identity_id_foreign FOREIGN KEY (auth_identity_id) REFERENCES public.auth_identity(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5203 (class 2606 OID 18843)
-- Name: auth_mfa_recovery_code auth_mfa_recovery_code_auth_identity_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.auth_mfa_recovery_code
    ADD CONSTRAINT auth_mfa_recovery_code_auth_identity_id_foreign FOREIGN KEY (auth_identity_id) REFERENCES public.auth_identity(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5204 (class 2606 OID 18886)
-- Name: auth_password_reset_token auth_password_reset_token_auth_identity_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.auth_password_reset_token
    ADD CONSTRAINT auth_password_reset_token_auth_identity_id_foreign FOREIGN KEY (auth_identity_id) REFERENCES public.auth_identity(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5205 (class 2606 OID 18891)
-- Name: auth_password_reset_token auth_password_reset_token_provider_identity_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.auth_password_reset_token
    ADD CONSTRAINT auth_password_reset_token_provider_identity_id_foreign FOREIGN KEY (provider_identity_id) REFERENCES public.provider_identity(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5206 (class 2606 OID 18908)
-- Name: auth_verification auth_verification_auth_identity_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.auth_verification
    ADD CONSTRAINT auth_verification_auth_identity_id_foreign FOREIGN KEY (auth_identity_id) REFERENCES public.auth_identity(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5184 (class 2606 OID 18093)
-- Name: capture capture_payment_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.capture
    ADD CONSTRAINT capture_payment_id_foreign FOREIGN KEY (payment_id) REFERENCES public.payment(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5163 (class 2606 OID 17636)
-- Name: cart cart_billing_address_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_billing_address_id_foreign FOREIGN KEY (billing_address_id) REFERENCES public.cart_address(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5166 (class 2606 OID 17753)
-- Name: cart_line_item_adjustment cart_line_item_adjustment_item_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.cart_line_item_adjustment
    ADD CONSTRAINT cart_line_item_adjustment_item_id_foreign FOREIGN KEY (item_id) REFERENCES public.cart_line_item(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5165 (class 2606 OID 17747)
-- Name: cart_line_item cart_line_item_cart_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.cart_line_item
    ADD CONSTRAINT cart_line_item_cart_id_foreign FOREIGN KEY (cart_id) REFERENCES public.cart(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5167 (class 2606 OID 17759)
-- Name: cart_line_item_tax_line cart_line_item_tax_line_item_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.cart_line_item_tax_line
    ADD CONSTRAINT cart_line_item_tax_line_item_id_foreign FOREIGN KEY (item_id) REFERENCES public.cart_line_item(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5164 (class 2606 OID 17631)
-- Name: cart cart_shipping_address_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_shipping_address_id_foreign FOREIGN KEY (shipping_address_id) REFERENCES public.cart_address(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5169 (class 2606 OID 17722)
-- Name: cart_shipping_method_adjustment cart_shipping_method_adjustment_shipping_method_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.cart_shipping_method_adjustment
    ADD CONSTRAINT cart_shipping_method_adjustment_shipping_method_id_foreign FOREIGN KEY (shipping_method_id) REFERENCES public.cart_shipping_method(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5168 (class 2606 OID 17765)
-- Name: cart_shipping_method cart_shipping_method_cart_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.cart_shipping_method
    ADD CONSTRAINT cart_shipping_method_cart_id_foreign FOREIGN KEY (cart_id) REFERENCES public.cart(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5170 (class 2606 OID 17727)
-- Name: cart_shipping_method_tax_line cart_shipping_method_tax_line_shipping_method_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.cart_shipping_method_tax_line
    ADD CONSTRAINT cart_shipping_method_tax_line_shipping_method_id_foreign FOREIGN KEY (shipping_method_id) REFERENCES public.cart_shipping_method(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5171 (class 2606 OID 17806)
-- Name: credit_line credit_line_cart_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.credit_line
    ADD CONSTRAINT credit_line_cart_id_foreign FOREIGN KEY (cart_id) REFERENCES public.cart(id) ON UPDATE CASCADE;


--
-- TOC entry 5160 (class 2606 OID 17551)
-- Name: customer_address customer_address_customer_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.customer_address
    ADD CONSTRAINT customer_address_customer_id_foreign FOREIGN KEY (customer_id) REFERENCES public.customer(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5161 (class 2606 OID 17571)
-- Name: customer_group_customer customer_group_customer_customer_group_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.customer_group_customer
    ADD CONSTRAINT customer_group_customer_customer_group_id_foreign FOREIGN KEY (customer_group_id) REFERENCES public.customer_group(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5162 (class 2606 OID 17576)
-- Name: customer_group_customer customer_group_customer_customer_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.customer_group_customer
    ADD CONSTRAINT customer_group_customer_customer_id_foreign FOREIGN KEY (customer_id) REFERENCES public.customer(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5214 (class 2606 OID 19170)
-- Name: fulfillment fulfillment_delivery_address_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.fulfillment
    ADD CONSTRAINT fulfillment_delivery_address_id_foreign FOREIGN KEY (delivery_address_id) REFERENCES public.fulfillment_address(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5218 (class 2606 OID 19142)
-- Name: fulfillment_item fulfillment_item_fulfillment_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.fulfillment_item
    ADD CONSTRAINT fulfillment_item_fulfillment_id_foreign FOREIGN KEY (fulfillment_id) REFERENCES public.fulfillment(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5217 (class 2606 OID 19137)
-- Name: fulfillment_label fulfillment_label_fulfillment_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.fulfillment_label
    ADD CONSTRAINT fulfillment_label_fulfillment_id_foreign FOREIGN KEY (fulfillment_id) REFERENCES public.fulfillment(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5215 (class 2606 OID 19165)
-- Name: fulfillment fulfillment_provider_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.fulfillment
    ADD CONSTRAINT fulfillment_provider_id_foreign FOREIGN KEY (provider_id) REFERENCES public.fulfillment_provider(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5216 (class 2606 OID 19127)
-- Name: fulfillment fulfillment_shipping_option_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.fulfillment
    ADD CONSTRAINT fulfillment_shipping_option_id_foreign FOREIGN KEY (shipping_option_id) REFERENCES public.shipping_option(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5208 (class 2606 OID 19092)
-- Name: geo_zone geo_zone_service_zone_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.geo_zone
    ADD CONSTRAINT geo_zone_service_zone_id_foreign FOREIGN KEY (service_zone_id) REFERENCES public.service_zone(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5132 (class 2606 OID 16771)
-- Name: image image_product_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.image
    ADD CONSTRAINT image_product_id_foreign FOREIGN KEY (product_id) REFERENCES public.product(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5126 (class 2606 OID 16472)
-- Name: inventory_level inventory_level_inventory_item_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.inventory_level
    ADD CONSTRAINT inventory_level_inventory_item_id_foreign FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_item(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5219 (class 2606 OID 19195)
-- Name: notification notification_provider_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_provider_id_foreign FOREIGN KEY (provider_id) REFERENCES public.notification_provider(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5185 (class 2606 OID 18727)
-- Name: order order_billing_address_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public."order"
    ADD CONSTRAINT order_billing_address_id_foreign FOREIGN KEY (billing_address_id) REFERENCES public.order_address(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5189 (class 2606 OID 18386)
-- Name: order_change_action order_change_action_order_change_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_change_action
    ADD CONSTRAINT order_change_action_order_change_id_foreign FOREIGN KEY (order_change_id) REFERENCES public.order_change(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5188 (class 2606 OID 18381)
-- Name: order_change order_change_order_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_change
    ADD CONSTRAINT order_change_order_id_foreign FOREIGN KEY (order_id) REFERENCES public."order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5200 (class 2606 OID 18643)
-- Name: order_credit_line order_credit_line_order_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_credit_line
    ADD CONSTRAINT order_credit_line_order_id_foreign FOREIGN KEY (order_id) REFERENCES public."order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5190 (class 2606 OID 18396)
-- Name: order_item order_item_item_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_item
    ADD CONSTRAINT order_item_item_id_foreign FOREIGN KEY (item_id) REFERENCES public.order_line_item(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5191 (class 2606 OID 18391)
-- Name: order_item order_item_order_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_item
    ADD CONSTRAINT order_item_order_id_foreign FOREIGN KEY (order_id) REFERENCES public."order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5195 (class 2606 OID 18411)
-- Name: order_line_item_adjustment order_line_item_adjustment_item_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_line_item_adjustment
    ADD CONSTRAINT order_line_item_adjustment_item_id_foreign FOREIGN KEY (item_id) REFERENCES public.order_line_item(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5194 (class 2606 OID 18406)
-- Name: order_line_item_tax_line order_line_item_tax_line_item_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_line_item_tax_line
    ADD CONSTRAINT order_line_item_tax_line_item_id_foreign FOREIGN KEY (item_id) REFERENCES public.order_line_item(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5193 (class 2606 OID 18401)
-- Name: order_line_item order_line_item_totals_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_line_item
    ADD CONSTRAINT order_line_item_totals_id_foreign FOREIGN KEY (totals_id) REFERENCES public.order_item(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5186 (class 2606 OID 18722)
-- Name: order order_shipping_address_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public."order"
    ADD CONSTRAINT order_shipping_address_id_foreign FOREIGN KEY (shipping_address_id) REFERENCES public.order_address(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5196 (class 2606 OID 18421)
-- Name: order_shipping_method_adjustment order_shipping_method_adjustment_shipping_method_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_shipping_method_adjustment
    ADD CONSTRAINT order_shipping_method_adjustment_shipping_method_id_foreign FOREIGN KEY (shipping_method_id) REFERENCES public.order_shipping_method(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5197 (class 2606 OID 18426)
-- Name: order_shipping_method_tax_line order_shipping_method_tax_line_shipping_method_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_shipping_method_tax_line
    ADD CONSTRAINT order_shipping_method_tax_line_shipping_method_id_foreign FOREIGN KEY (shipping_method_id) REFERENCES public.order_shipping_method(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5192 (class 2606 OID 18416)
-- Name: order_shipping order_shipping_order_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_shipping
    ADD CONSTRAINT order_shipping_order_id_foreign FOREIGN KEY (order_id) REFERENCES public."order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5187 (class 2606 OID 18637)
-- Name: order_summary order_summary_order_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_summary
    ADD CONSTRAINT order_summary_order_id_foreign FOREIGN KEY (order_id) REFERENCES public."order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5198 (class 2606 OID 18431)
-- Name: order_transaction order_transaction_order_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.order_transaction
    ADD CONSTRAINT order_transaction_order_id_foreign FOREIGN KEY (order_id) REFERENCES public."order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5179 (class 2606 OID 18149)
-- Name: payment_collection_payment_providers payment_collection_payment_providers_payment_col_aa276_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.payment_collection_payment_providers
    ADD CONSTRAINT payment_collection_payment_providers_payment_col_aa276_foreign FOREIGN KEY (payment_collection_id) REFERENCES public.payment_collection(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5180 (class 2606 OID 18154)
-- Name: payment_collection_payment_providers payment_collection_payment_providers_payment_pro_2d555_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.payment_collection_payment_providers
    ADD CONSTRAINT payment_collection_payment_providers_payment_pro_2d555_foreign FOREIGN KEY (payment_provider_id) REFERENCES public.payment_provider(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5182 (class 2606 OID 18129)
-- Name: payment payment_payment_collection_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_payment_collection_id_foreign FOREIGN KEY (payment_collection_id) REFERENCES public.payment_collection(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5181 (class 2606 OID 18124)
-- Name: payment_session payment_session_payment_collection_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.payment_session
    ADD CONSTRAINT payment_session_payment_collection_id_foreign FOREIGN KEY (payment_collection_id) REFERENCES public.payment_collection(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5148 (class 2606 OID 17180)
-- Name: price_list_rule price_list_rule_price_list_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.price_list_rule
    ADD CONSTRAINT price_list_rule_price_list_id_foreign FOREIGN KEY (price_list_id) REFERENCES public.price_list(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5145 (class 2606 OID 17165)
-- Name: price price_price_list_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.price
    ADD CONSTRAINT price_price_list_id_foreign FOREIGN KEY (price_list_id) REFERENCES public.price_list(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5146 (class 2606 OID 17061)
-- Name: price price_price_set_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.price
    ADD CONSTRAINT price_price_set_id_foreign FOREIGN KEY (price_set_id) REFERENCES public.price_set(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5147 (class 2606 OID 17191)
-- Name: price_rule price_rule_price_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.price_rule
    ADD CONSTRAINT price_rule_price_id_foreign FOREIGN KEY (price_id) REFERENCES public.price(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5133 (class 2606 OID 16743)
-- Name: product_category product_category_parent_category_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product_category
    ADD CONSTRAINT product_category_parent_category_id_foreign FOREIGN KEY (parent_category_id) REFERENCES public.product_category(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5136 (class 2606 OID 16738)
-- Name: product_category_product product_category_product_product_category_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product_category_product
    ADD CONSTRAINT product_category_product_product_category_id_foreign FOREIGN KEY (product_category_id) REFERENCES public.product_category(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5137 (class 2606 OID 16733)
-- Name: product_category_product product_category_product_product_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product_category_product
    ADD CONSTRAINT product_category_product_product_id_foreign FOREIGN KEY (product_id) REFERENCES public.product(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5128 (class 2606 OID 16678)
-- Name: product product_collection_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_collection_id_foreign FOREIGN KEY (collection_id) REFERENCES public.product_collection(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5131 (class 2606 OID 16698)
-- Name: product_option_value product_option_value_option_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product_option_value
    ADD CONSTRAINT product_option_value_option_id_foreign FOREIGN KEY (option_id) REFERENCES public.product_option(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5141 (class 2606 OID 16868)
-- Name: product_product_option product_product_option_product_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product_product_option
    ADD CONSTRAINT product_product_option_product_id_foreign FOREIGN KEY (product_id) REFERENCES public.product(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5142 (class 2606 OID 16873)
-- Name: product_product_option product_product_option_product_option_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product_product_option
    ADD CONSTRAINT product_product_option_product_option_id_foreign FOREIGN KEY (product_option_id) REFERENCES public.product_option(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5143 (class 2606 OID 16899)
-- Name: product_product_option_value product_product_option_value_product_option_value_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product_product_option_value
    ADD CONSTRAINT product_product_option_value_product_option_value_id_foreign FOREIGN KEY (product_option_value_id) REFERENCES public.product_option_value(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5144 (class 2606 OID 16894)
-- Name: product_product_option_value product_product_option_value_product_product_option_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product_product_option_value
    ADD CONSTRAINT product_product_option_value_product_product_option_id_foreign FOREIGN KEY (product_product_option_id) REFERENCES public.product_product_option(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5134 (class 2606 OID 16723)
-- Name: product_tags product_tags_product_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product_tags
    ADD CONSTRAINT product_tags_product_id_foreign FOREIGN KEY (product_id) REFERENCES public.product(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5135 (class 2606 OID 16728)
-- Name: product_tags product_tags_product_tag_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product_tags
    ADD CONSTRAINT product_tags_product_tag_id_foreign FOREIGN KEY (product_tag_id) REFERENCES public.product_tag(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5129 (class 2606 OID 16683)
-- Name: product product_type_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_type_id_foreign FOREIGN KEY (type_id) REFERENCES public.product_type(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5138 (class 2606 OID 16708)
-- Name: product_variant_option product_variant_option_option_value_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product_variant_option
    ADD CONSTRAINT product_variant_option_option_value_id_foreign FOREIGN KEY (option_value_id) REFERENCES public.product_option_value(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5139 (class 2606 OID 16703)
-- Name: product_variant_option product_variant_option_variant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product_variant_option
    ADD CONSTRAINT product_variant_option_variant_id_foreign FOREIGN KEY (variant_id) REFERENCES public.product_variant(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5130 (class 2606 OID 16688)
-- Name: product_variant product_variant_product_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product_variant
    ADD CONSTRAINT product_variant_product_id_foreign FOREIGN KEY (product_id) REFERENCES public.product(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5140 (class 2606 OID 16851)
-- Name: product_variant_product_image product_variant_product_image_image_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.product_variant_product_image
    ADD CONSTRAINT product_variant_product_image_image_id_foreign FOREIGN KEY (image_id) REFERENCES public.image(id) ON DELETE CASCADE;


--
-- TOC entry 5151 (class 2606 OID 17377)
-- Name: promotion_application_method promotion_application_method_promotion_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.promotion_application_method
    ADD CONSTRAINT promotion_application_method_promotion_id_foreign FOREIGN KEY (promotion_id) REFERENCES public.promotion(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5149 (class 2606 OID 17426)
-- Name: promotion_campaign_budget promotion_campaign_budget_campaign_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.promotion_campaign_budget
    ADD CONSTRAINT promotion_campaign_budget_campaign_id_foreign FOREIGN KEY (campaign_id) REFERENCES public.promotion_campaign(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5159 (class 2606 OID 17493)
-- Name: promotion_campaign_budget_usage promotion_campaign_budget_usage_budget_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.promotion_campaign_budget_usage
    ADD CONSTRAINT promotion_campaign_budget_usage_budget_id_foreign FOREIGN KEY (budget_id) REFERENCES public.promotion_campaign_budget(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5150 (class 2606 OID 17417)
-- Name: promotion promotion_campaign_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.promotion
    ADD CONSTRAINT promotion_campaign_id_foreign FOREIGN KEY (campaign_id) REFERENCES public.promotion_campaign(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5152 (class 2606 OID 17382)
-- Name: promotion_promotion_rule promotion_promotion_rule_promotion_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.promotion_promotion_rule
    ADD CONSTRAINT promotion_promotion_rule_promotion_id_foreign FOREIGN KEY (promotion_id) REFERENCES public.promotion(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5153 (class 2606 OID 17387)
-- Name: promotion_promotion_rule promotion_promotion_rule_promotion_rule_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.promotion_promotion_rule
    ADD CONSTRAINT promotion_promotion_rule_promotion_rule_id_foreign FOREIGN KEY (promotion_rule_id) REFERENCES public.promotion_rule(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5158 (class 2606 OID 17412)
-- Name: promotion_rule_value promotion_rule_value_promotion_rule_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.promotion_rule_value
    ADD CONSTRAINT promotion_rule_value_promotion_rule_id_foreign FOREIGN KEY (promotion_rule_id) REFERENCES public.promotion_rule(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5201 (class 2606 OID 18805)
-- Name: provider_identity provider_identity_auth_identity_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.provider_identity
    ADD CONSTRAINT provider_identity_auth_identity_id_foreign FOREIGN KEY (auth_identity_id) REFERENCES public.auth_identity(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5183 (class 2606 OID 18098)
-- Name: refund refund_payment_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.refund
    ADD CONSTRAINT refund_payment_id_foreign FOREIGN KEY (payment_id) REFERENCES public.payment(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5172 (class 2606 OID 17832)
-- Name: region_country region_country_region_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.region_country
    ADD CONSTRAINT region_country_region_id_foreign FOREIGN KEY (region_id) REFERENCES public.region(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5127 (class 2606 OID 16477)
-- Name: reservation_item reservation_item_inventory_item_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.reservation_item
    ADD CONSTRAINT reservation_item_inventory_item_id_foreign FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_item(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5199 (class 2606 OID 18365)
-- Name: return_reason return_reason_parent_return_reason_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.return_reason
    ADD CONSTRAINT return_reason_parent_return_reason_id_foreign FOREIGN KEY (parent_return_reason_id) REFERENCES public.return_reason(id);


--
-- TOC entry 5220 (class 2606 OID 19261)
-- Name: search_index_sync search_index_sync_search_index_version_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.search_index_sync
    ADD CONSTRAINT search_index_sync_search_index_version_id_foreign FOREIGN KEY (search_index_version_id) REFERENCES public.search_index_version(id) ON UPDATE CASCADE;


--
-- TOC entry 5221 (class 2606 OID 19256)
-- Name: search_index_version search_index_version_search_index_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.search_index_version
    ADD CONSTRAINT search_index_version_search_index_id_foreign FOREIGN KEY (search_index_id) REFERENCES public.search_index(id) ON UPDATE CASCADE;


--
-- TOC entry 5207 (class 2606 OID 19087)
-- Name: service_zone service_zone_fulfillment_set_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.service_zone
    ADD CONSTRAINT service_zone_fulfillment_set_id_foreign FOREIGN KEY (fulfillment_set_id) REFERENCES public.fulfillment_set(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5209 (class 2606 OID 19154)
-- Name: shipping_option shipping_option_provider_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.shipping_option
    ADD CONSTRAINT shipping_option_provider_id_foreign FOREIGN KEY (provider_id) REFERENCES public.fulfillment_provider(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5213 (class 2606 OID 19117)
-- Name: shipping_option_rule shipping_option_rule_shipping_option_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.shipping_option_rule
    ADD CONSTRAINT shipping_option_rule_shipping_option_id_foreign FOREIGN KEY (shipping_option_id) REFERENCES public.shipping_option(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5210 (class 2606 OID 19097)
-- Name: shipping_option shipping_option_service_zone_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.shipping_option
    ADD CONSTRAINT shipping_option_service_zone_id_foreign FOREIGN KEY (service_zone_id) REFERENCES public.service_zone(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5211 (class 2606 OID 19159)
-- Name: shipping_option shipping_option_shipping_option_type_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.shipping_option
    ADD CONSTRAINT shipping_option_shipping_option_type_id_foreign FOREIGN KEY (shipping_option_type_id) REFERENCES public.shipping_option_type(id) ON UPDATE CASCADE;


--
-- TOC entry 5212 (class 2606 OID 19102)
-- Name: shipping_option shipping_option_shipping_profile_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.shipping_option
    ADD CONSTRAINT shipping_option_shipping_profile_id_foreign FOREIGN KEY (shipping_profile_id) REFERENCES public.shipping_profile(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5125 (class 2606 OID 16422)
-- Name: stock_location stock_location_address_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.stock_location
    ADD CONSTRAINT stock_location_address_id_foreign FOREIGN KEY (address_id) REFERENCES public.stock_location_address(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5173 (class 2606 OID 17880)
-- Name: store_currency store_currency_store_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.store_currency
    ADD CONSTRAINT store_currency_store_id_foreign FOREIGN KEY (store_id) REFERENCES public.store(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5174 (class 2606 OID 17898)
-- Name: store_locale store_locale_store_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: commerce
--

ALTER TABLE ONLY public.store_locale
    ADD CONSTRAINT store_locale_store_id_foreign FOREIGN KEY (store_id) REFERENCES public.store(id) ON UPDATE CASCADE ON DELETE CASCADE;


-- Completed on 2026-10-17 22:08:53

--
-- PostgreSQL database dump complete
--

\unrestrict 8SvbeGhN8H4vAweIqwtbzXQgcZZBssU5er7SGBMk7hsrtwLkEJbE5oFjv2khAg1

--
-- Database "postgres" dump
--

\connect postgres

--
-- PostgreSQL database dump
--

\restrict xO7RU5Dk1QdA5j3uBSVkPHipHrsbtJecPDm9vrlhUsuhi9p2t1QjZHFOLXjUkPO

-- Dumped from database version 16.15
-- Dumped by pg_dump version 18.4

-- Started on 2026-10-17 22:08:53

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Completed on 2026-10-17 22:08:53

--
-- PostgreSQL database dump complete
--

\unrestrict xO7RU5Dk1QdA5j3uBSVkPHipHrsbtJecPDm9vrlhUsuhi9p2t1QjZHFOLXjUkPO

-- Completed on 2026-10-17 22:08:53

--
-- PostgreSQL database cluster dump complete
--
