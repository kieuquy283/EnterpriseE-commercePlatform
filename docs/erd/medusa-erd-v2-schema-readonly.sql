-- Schema survey for ERD v2: PostgreSQL catalog metadata only.
-- Does not read customer, payment-provider payloads, or application row data.
-- Run against the application's database, not the documentation schema.
-- The result is one JSON object containing columns, constraints and indexes.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;

WITH targets(table_name) AS (
  VALUES
    ('cart'), ('cart_line_item'),
    ('order'), ('order_item'), ('order_line_item'), ('order_summary'),
    ('order_cart'),
    ('payment_collection'), ('payment_session'), ('payment'),
    ('capture'), ('refund'), ('refund_reason'), ('payment_provider'),
    ('payment_collection_payment_providers'), ('region_payment_provider'),
    ('cart_payment_collection'), ('order_payment_collection'),
    ('inventory_item'), ('inventory_level'), ('reservation_item'),
    ('stock_location'), ('product_variant_inventory_item'), ('product_variant')
), table_metadata AS (
  SELECT
    target.table_name,
    relation.oid AS relation_oid,
    relation.oid IS NOT NULL AS present
  FROM targets target
  LEFT JOIN pg_namespace namespace ON namespace.nspname = 'public'
  LEFT JOIN pg_class relation
    ON relation.relnamespace = namespace.oid
    AND relation.relname = target.table_name
    AND relation.relkind IN ('r', 'p')
)
SELECT jsonb_build_object(
  'database_name', current_database(),
  'schema_name', 'public',
  'captured_at', statement_timestamp(),
  'server_version', current_setting('server_version'),
  'transaction_read_only', current_setting('transaction_read_only'),
  'scope', 'Catalog metadata only; no application rows',
  'tables', (
    SELECT jsonb_agg(jsonb_build_object(
      'table_name', metadata.table_name,
      'present', metadata.present,
      'columns', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'ordinal_position', column_info.ordinal_position,
          'column_name', column_info.column_name,
          'data_type', column_info.data_type,
          'udt_name', column_info.udt_name,
          'is_nullable', column_info.is_nullable,
          'column_default', column_info.column_default
        ) ORDER BY column_info.ordinal_position)
        FROM information_schema.columns column_info
        WHERE column_info.table_schema = 'public'
          AND column_info.table_name = metadata.table_name
      ), '[]'::jsonb),
      'constraints', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'constraint_name', constraint_info.conname,
          'constraint_type', constraint_info.contype,
          'definition', pg_get_constraintdef(constraint_info.oid, true)
        ) ORDER BY constraint_info.contype, constraint_info.conname)
        FROM pg_constraint constraint_info
        WHERE constraint_info.conrelid = metadata.relation_oid
      ), '[]'::jsonb),
      'indexes', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'index_name', index_relation.relname,
          'is_primary', index_info.indisprimary,
          'is_unique', index_info.indisunique,
          'definition', pg_get_indexdef(index_info.indexrelid)
        ) ORDER BY index_relation.relname)
        FROM pg_index index_info
        JOIN pg_class index_relation ON index_relation.oid = index_info.indexrelid
        WHERE index_info.indrelid = metadata.relation_oid
      ), '[]'::jsonb)
    ) ORDER BY metadata.table_name)
    FROM table_metadata metadata
  ),
  'enum_values', COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'type_name', enum_type.typname,
      'sort_order', enum_value.enumsortorder,
      'value', enum_value.enumlabel
    ) ORDER BY enum_type.typname, enum_value.enumsortorder)
    FROM pg_type enum_type
    JOIN pg_namespace namespace ON namespace.oid = enum_type.typnamespace
    JOIN pg_enum enum_value ON enum_value.enumtypid = enum_type.oid
    WHERE namespace.nspname = 'public'
      AND enum_type.typname IN (
        SELECT DISTINCT column_info.udt_name
        FROM information_schema.columns column_info
        JOIN targets target ON target.table_name = column_info.table_name
        WHERE column_info.table_schema = 'public'
          AND column_info.data_type = 'USER-DEFINED'
      )
  ), '[]'::jsonb),
  'related_table_names', (
    SELECT jsonb_agg(table_info.table_name ORDER BY table_info.table_name)
    FROM information_schema.tables table_info
    WHERE table_info.table_schema = 'public'
      AND table_info.table_type = 'BASE TABLE'
      AND (
        table_info.table_name IN ('order', 'payment', 'capture', 'refund', 'credit_line')
        OR table_info.table_name LIKE 'cart\_%' ESCAPE '\'
        OR table_info.table_name LIKE 'order\_%' ESCAPE '\'
        OR table_info.table_name LIKE 'payment\_%' ESCAPE '\'
        OR table_info.table_name LIKE 'inventory\_%' ESCAPE '\'
        OR table_info.table_name LIKE 'reservation\_%' ESCAPE '\'
        OR table_info.table_name LIKE 'stock\_%' ESCAPE '\'
        OR table_info.table_name LIKE 'refund\_%' ESCAPE '\'
      )
  )
);

COMMIT;
