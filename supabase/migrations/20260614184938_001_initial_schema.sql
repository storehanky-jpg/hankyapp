-- Matières premières
CREATE TABLE raw_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unit text NOT NULL,
  unit_cost numeric NOT NULL,
  last_purchase_date date,
  supplier text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Achats de matières premières
CREATE TABLE material_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid REFERENCES raw_materials(id) ON DELETE CASCADE,
  quantity numeric NOT NULL,
  unit_cost numeric NOT NULL,
  total_cost numeric NOT NULL,
  purchase_date date NOT NULL,
  invoice_number text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Charges fixes
CREATE TABLE fixed_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  amount numeric NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  category text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Charges variables
CREATE TABLE variable_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  amount numeric NOT NULL,
  date date NOT NULL,
  category text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Gaz et électricité
CREATE TABLE utilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('gas', 'electricity')),
  amount numeric NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  consumption numeric,
  unit text,
  created_at timestamptz DEFAULT now()
);

-- Main-d'œuvre
CREATE TABLE labor_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name text NOT NULL,
  daily_wage numeric NOT NULL,
  worked_days integer NOT NULL,
  period_month integer NOT NULL,
  period_year integer NOT NULL,
  total_cost numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Emballages
CREATE TABLE packaging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  box_size integer NOT NULL,
  unit_cost numeric NOT NULL,
  stock_quantity integer DEFAULT 0,
  supplier text,
  created_at timestamptz DEFAULT now()
);

-- Production
CREATE TABLE production_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_date date NOT NULL,
  planned_quantity integer NOT NULL,
  produced_quantity integer NOT NULL,
  lost_quantity integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Composition des macarons (recette)
CREATE TABLE recipe_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid REFERENCES raw_materials(id) ON DELETE CASCADE,
  quantity_per_kg numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Ventes
CREATE TABLE sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_date date NOT NULL,
  box_size integer NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  total_amount numeric NOT NULL,
  customer_name text,
  notes text,
  production_batch_id uuid REFERENCES production_batches(id),
  created_at timestamptz DEFAULT now()
);

-- Ventes non réalisées (pertes ou invendus)
CREATE TABLE unsold_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  quantity integer NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- Paramètres de l'entreprise
CREATE TABLE company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text DEFAULT 'Hanky Macarons',
  currency text DEFAULT 'DZD',
  profit_margin numeric DEFAULT 30,
  default_recipe_cost_per_kg numeric,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE variable_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE packaging ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE unsold_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (public access for this app - single user)
CREATE POLICY "public_access_raw_materials" ON raw_materials FOR ALL USING (true);
CREATE POLICY "public_access_material_purchases" ON material_purchases FOR ALL USING (true);
CREATE POLICY "public_access_fixed_charges" ON fixed_charges FOR ALL USING (true);
CREATE POLICY "public_access_variable_expenses" ON variable_expenses FOR ALL USING (true);
CREATE POLICY "public_access_utilities" ON utilities FOR ALL USING (true);
CREATE POLICY "public_access_labor_costs" ON labor_costs FOR ALL USING (true);
CREATE POLICY "public_access_packaging" ON packaging FOR ALL USING (true);
CREATE POLICY "public_access_production_batches" ON production_batches FOR ALL USING (true);
CREATE POLICY "public_access_recipe_ingredients" ON recipe_ingredients FOR ALL USING (true);
CREATE POLICY "public_access_sales" ON sales FOR ALL USING (true);
CREATE POLICY "public_access_unsold_products" ON unsold_products FOR ALL USING (true);
CREATE POLICY "public_access_company_settings" ON company_settings FOR ALL USING (true);