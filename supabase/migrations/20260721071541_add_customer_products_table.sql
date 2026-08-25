-- Customer products: generalizes customer_prices to support all product types
-- (vrac, boites, magasin coques) with custom prices and paid/unpaid status.
CREATE TABLE customer_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_type text NOT NULL CHECK (product_type IN ('vrac', 'boite', 'magasin')),
  label text NOT NULL,
  unit_label text NOT NULL DEFAULT 'pcs',
  unit_price numeric NOT NULL DEFAULT 0,
  is_paid boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_customer_products_customer ON customer_products(customer_id);

ALTER TABLE customer_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_customer_products" ON customer_products
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "insert_customer_products" ON customer_products
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "update_customer_products" ON customer_products
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "delete_customer_products" ON customer_products
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_products_updated_at
  BEFORE UPDATE ON customer_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();