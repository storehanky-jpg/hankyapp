-- Drop the partial unique index that doesn't work with Supabase onConflict
DROP INDEX IF EXISTS customer_prices_customer_product_type_key;

-- Create a regular unique constraint on (customer_id, product_type)
-- This allows upserts to work correctly via Supabase's onConflict
ALTER TABLE customer_prices ADD CONSTRAINT customer_prices_customer_product_type_key UNIQUE (customer_id, product_type);
