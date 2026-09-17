/*
# Add payment status, production materials, customer fiscal info, sales grouping

## 1. Material Purchases — Payment Status
- Add `payment_status` column to `material_purchases` (values: 'paid', 'unpaid', 'partial')
- Add `amount_paid` column for partial payments
- Defaults: payment_status='unpaid', amount_paid=0

## 2. Production Batches — Materials Used & Profit
- Add `produced_quantity` column (already exists as produced_quantity, but add `quantity_produced` for kg/pieces)
- Add `production_cost` column (calculated cost of materials used)
- Add `production_value` column (value of produced quantity)
- Add `profit` column (production_value - production_cost)
- New table `production_materials` to track raw materials used per batch

## 3. Customers — Fiscal Coordinates
- Add columns to `customers`: legal_name, fiscal_address, rc, nif, nis, ai, fiscal_phone

## 4. Sales — Grouping support
- Add `sale_group_id` column to `sales` to group multi-product sales under one transaction
*/

-- 1. Material Purchases payment status
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='material_purchases' AND column_name='payment_status') THEN
    ALTER TABLE material_purchases ADD COLUMN payment_status text NOT NULL DEFAULT 'unpaid';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='material_purchases' AND column_name='amount_paid') THEN
    ALTER TABLE material_purchases ADD COLUMN amount_paid numeric NOT NULL DEFAULT 0;
  END IF;
END $$;

-- 2. Production Batches — extra fields
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='production_batches' AND column_name='quantity_produced') THEN
    ALTER TABLE production_batches ADD COLUMN quantity_produced numeric;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='production_batches' AND column_name='production_cost') THEN
    ALTER TABLE production_batches ADD COLUMN production_cost numeric DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='production_batches' AND column_name='production_value') THEN
    ALTER TABLE production_batches ADD COLUMN production_value numeric DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='production_batches' AND column_name='profit') THEN
    ALTER TABLE production_batches ADD COLUMN profit numeric DEFAULT 0;
  END IF;
END $$;

-- New table: production_materials (raw materials used per batch)
CREATE TABLE IF NOT EXISTS production_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 0,
  unit_cost numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE production_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_production_materials" ON production_materials;
CREATE POLICY "anon_select_production_materials" ON production_materials FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_production_materials" ON production_materials;
CREATE POLICY "anon_insert_production_materials" ON production_materials FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_production_materials" ON production_materials;
CREATE POLICY "anon_update_production_materials" ON production_materials FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_production_materials" ON production_materials;
CREATE POLICY "anon_delete_production_materials" ON production_materials FOR DELETE
  TO anon, authenticated USING (true);

-- 3. Customers — fiscal coordinates
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='legal_name') THEN
    ALTER TABLE customers ADD COLUMN legal_name text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='fiscal_address') THEN
    ALTER TABLE customers ADD COLUMN fiscal_address text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='rc') THEN
    ALTER TABLE customers ADD COLUMN rc text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='nif') THEN
    ALTER TABLE customers ADD COLUMN nif text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='nis') THEN
    ALTER TABLE customers ADD COLUMN nis text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='ai') THEN
    ALTER TABLE customers ADD COLUMN ai text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='fiscal_phone') THEN
    ALTER TABLE customers ADD COLUMN fiscal_phone text;
  END IF;
END $$;

-- 4. Sales — grouping support
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='sale_group_id') THEN
    ALTER TABLE sales ADD COLUMN sale_group_id text;
  END IF;
END $$;
