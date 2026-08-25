-- Table clients
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Prix personnalises par client et par taille de boite
CREATE TABLE customer_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  box_size integer NOT NULL,
  unit_price numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(customer_id, box_size)
);

-- Lier les ventes aux clients
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_access_customers" ON customers FOR ALL USING (true);
CREATE POLICY "public_access_customer_prices" ON customer_prices FOR ALL USING (true);
