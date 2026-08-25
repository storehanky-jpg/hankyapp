-- Vente en vrac
CREATE TABLE bulk_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_date date NOT NULL,
  quantity_kg numeric NOT NULL,
  price_per_kg numeric NOT NULL,
  total_amount numeric NOT NULL,
  customer_name text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Recette de base
CREATE TABLE recipe_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Macaron Classique',
  batch_size_kg numeric DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Ingrédients de la recette (liés aux matières premières)
CREATE TABLE recipe_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid REFERENCES recipe_config(id) ON DELETE CASCADE,
  material_id uuid REFERENCES raw_materials(id) ON DELETE CASCADE,
  quantity_per_batch numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE bulk_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "public_access_bulk_sales" ON bulk_sales FOR ALL USING (true);
CREATE POLICY "public_access_recipe_config" ON recipe_config FOR ALL USING (true);
CREATE POLICY "public_access_recipe_items" ON recipe_items FOR ALL USING (true);