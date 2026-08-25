-- Add product_type column to customer_prices to support all 5 product types
ALTER TABLE customer_prices ADD COLUMN IF NOT EXISTS product_type text;
ALTER TABLE customer_prices ADD COLUMN IF NOT EXISTS unit_label text DEFAULT 'pcs';

-- Backfill existing rows: box_size 6 → boite6, 10 → boite10, 20 → boite20
UPDATE customer_prices SET product_type = 'boite' || box_size WHERE product_type IS NULL AND box_size IS NOT NULL;

-- Add unique constraint on (customer_id, product_type) so we can upsert
CREATE UNIQUE INDEX IF NOT EXISTS customer_prices_customer_product_type_key 
  ON customer_prices (customer_id, product_type) WHERE product_type IS NOT NULL;
