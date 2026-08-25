CREATE TABLE chocolate_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  yield_g numeric NOT NULL DEFAULT 1000,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE chocolate_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid REFERENCES chocolate_config(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity_g numeric NOT NULL DEFAULT 0,
  unit_cost_per_kg numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chocolate_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE chocolate_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_access_chocolate_config" ON chocolate_config FOR ALL USING (true);
CREATE POLICY "public_access_chocolate_ingredients" ON chocolate_ingredients FOR ALL USING (true);
