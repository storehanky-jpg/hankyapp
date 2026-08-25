CREATE TABLE shop_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_date date NOT NULL DEFAULT CURRENT_DATE,
  quantity integer NOT NULL DEFAULT 0,
  price_per_piece numeric NOT NULL DEFAULT 40,
  total_amount numeric NOT NULL DEFAULT 0,
  is_paid boolean NOT NULL DEFAULT true,
  customer_name text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shop_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_shop_sales" ON shop_sales FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_shop_sales" ON shop_sales FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_shop_sales" ON shop_sales FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_shop_sales" ON shop_sales FOR DELETE
  TO authenticated USING (true);

CREATE POLICY "anon_select_shop_sales" ON shop_sales FOR SELECT
  TO anon USING (true);
CREATE POLICY "anon_insert_shop_sales" ON shop_sales FOR INSERT
  TO anon WITH CHECK (true);
CREATE POLICY "anon_update_shop_sales" ON shop_sales FOR UPDATE
  TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_shop_sales" ON shop_sales FOR DELETE
  TO anon USING (true);
