-- Add amount_paid (versement) and payment tracking to sales tables
ALTER TABLE bulk_sales ADD COLUMN IF NOT EXISTS amount_paid numeric DEFAULT 0;
ALTER TABLE bulk_sales ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE bulk_sales ADD COLUMN IF NOT EXISTS invoice_number text;
ALTER TABLE bulk_sales ADD COLUMN IF NOT EXISTS order_number text;

ALTER TABLE sales ADD COLUMN IF NOT EXISTS amount_paid numeric DEFAULT 0;
ALTER TABLE shop_sales ADD COLUMN IF NOT EXISTS amount_paid numeric DEFAULT 0;
ALTER TABLE shop_sales ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE shop_sales ADD COLUMN IF NOT EXISTS invoice_number text;
ALTER TABLE shop_sales ADD COLUMN IF NOT EXISTS order_number text;

-- Fiscal info table (single row, company coordinates for invoices)
CREATE TABLE company_fiscal_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT 'Hanky Macarons',
  address text,
  city text,
  phone text,
  email text,
  rc text,
  nif text,
  ai text,
  nis text,
  rib text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE company_fiscal_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_fiscal_info" ON company_fiscal_info FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "insert_fiscal_info" ON company_fiscal_info FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "update_fiscal_info" ON company_fiscal_info FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "delete_fiscal_info" ON company_fiscal_info FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- Insert default row
INSERT INTO company_fiscal_info (company_name) VALUES ('Hanky Macarons');

-- Suppliers table
CREATE TABLE suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  phone text,
  address text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_suppliers" ON suppliers FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "insert_suppliers" ON suppliers FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "update_suppliers" ON suppliers FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "delete_suppliers" ON suppliers FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- Supplier purchases (separate from material_purchases, tracks purchases per supplier)
CREATE TABLE supplier_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  item_name text NOT NULL,
  quantity numeric DEFAULT 1,
  unit text DEFAULT 'unité',
  unit_cost numeric DEFAULT 0,
  total_amount numeric DEFAULT 0,
  amount_paid numeric DEFAULT 0,
  invoice_number text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE supplier_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_supplier_purchases" ON supplier_purchases FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "insert_supplier_purchases" ON supplier_purchases FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "update_supplier_purchases" ON supplier_purchases FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "delete_supplier_purchases" ON supplier_purchases FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE INDEX idx_supplier_purchases_supplier ON supplier_purchases(supplier_id);
