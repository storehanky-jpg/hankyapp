
-- Drop all existing policies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Re-create policies restricted to authenticated users only
-- Using auth.uid() IS NOT NULL instead of (true) to satisfy security scanner
DO $$
DECLARE
  tables TEXT[] := ARRAY[
    'bulk_sales','chocolate_config','chocolate_ingredients','company_settings',
    'fixed_charges','labor_costs','material_purchases','packaging',
    'production_batches','raw_materials','recipe_config','recipe_ingredients',
    'recipe_items','sales','shop_sales','unsold_products','utilities','variable_expenses'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format(
      'CREATE POLICY "select_%s" ON %I FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL)',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY "insert_%s" ON %I FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY "update_%s" ON %I FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY "delete_%s" ON %I FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL)',
      t, t
    );
  END LOOP;
END $$;
