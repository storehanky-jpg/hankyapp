
-- Drop all existing policies (both old and new from migration 006)
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

-- Recreate all policies restricted to authenticated role only
-- This removes anon access entirely, eliminating all security warnings

-- bulk_sales
CREATE POLICY "select_bulk_sales" ON bulk_sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_bulk_sales" ON bulk_sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_bulk_sales" ON bulk_sales FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_bulk_sales" ON bulk_sales FOR DELETE TO authenticated USING (true);

-- chocolate_config
CREATE POLICY "select_chocolate_config" ON chocolate_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_chocolate_config" ON chocolate_config FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_chocolate_config" ON chocolate_config FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_chocolate_config" ON chocolate_config FOR DELETE TO authenticated USING (true);

-- chocolate_ingredients
CREATE POLICY "select_chocolate_ingredients" ON chocolate_ingredients FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_chocolate_ingredients" ON chocolate_ingredients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_chocolate_ingredients" ON chocolate_ingredients FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_chocolate_ingredients" ON chocolate_ingredients FOR DELETE TO authenticated USING (true);

-- company_settings
CREATE POLICY "select_company_settings" ON company_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_company_settings" ON company_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_company_settings" ON company_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_company_settings" ON company_settings FOR DELETE TO authenticated USING (true);

-- fixed_charges
CREATE POLICY "select_fixed_charges" ON fixed_charges FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_fixed_charges" ON fixed_charges FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_fixed_charges" ON fixed_charges FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_fixed_charges" ON fixed_charges FOR DELETE TO authenticated USING (true);

-- labor_costs
CREATE POLICY "select_labor_costs" ON labor_costs FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_labor_costs" ON labor_costs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_labor_costs" ON labor_costs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_labor_costs" ON labor_costs FOR DELETE TO authenticated USING (true);

-- material_purchases
CREATE POLICY "select_material_purchases" ON material_purchases FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_material_purchases" ON material_purchases FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_material_purchases" ON material_purchases FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_material_purchases" ON material_purchases FOR DELETE TO authenticated USING (true);

-- packaging
CREATE POLICY "select_packaging" ON packaging FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_packaging" ON packaging FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_packaging" ON packaging FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_packaging" ON packaging FOR DELETE TO authenticated USING (true);

-- production_batches
CREATE POLICY "select_production_batches" ON production_batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_production_batches" ON production_batches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_production_batches" ON production_batches FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_production_batches" ON production_batches FOR DELETE TO authenticated USING (true);

-- raw_materials
CREATE POLICY "select_raw_materials" ON raw_materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_raw_materials" ON raw_materials FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_raw_materials" ON raw_materials FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_raw_materials" ON raw_materials FOR DELETE TO authenticated USING (true);

-- recipe_config
CREATE POLICY "select_recipe_config" ON recipe_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_recipe_config" ON recipe_config FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_recipe_config" ON recipe_config FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_recipe_config" ON recipe_config FOR DELETE TO authenticated USING (true);

-- recipe_ingredients
CREATE POLICY "select_recipe_ingredients" ON recipe_ingredients FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_recipe_ingredients" ON recipe_ingredients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_recipe_ingredients" ON recipe_ingredients FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_recipe_ingredients" ON recipe_ingredients FOR DELETE TO authenticated USING (true);

-- recipe_items
CREATE POLICY "select_recipe_items" ON recipe_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_recipe_items" ON recipe_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_recipe_items" ON recipe_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_recipe_items" ON recipe_items FOR DELETE TO authenticated USING (true);

-- sales
CREATE POLICY "select_sales" ON sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_sales" ON sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_sales" ON sales FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_sales" ON sales FOR DELETE TO authenticated USING (true);

-- shop_sales
CREATE POLICY "select_shop_sales" ON shop_sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_shop_sales" ON shop_sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_shop_sales" ON shop_sales FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_shop_sales" ON shop_sales FOR DELETE TO authenticated USING (true);

-- unsold_products
CREATE POLICY "select_unsold_products" ON unsold_products FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_unsold_products" ON unsold_products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_unsold_products" ON unsold_products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_unsold_products" ON unsold_products FOR DELETE TO authenticated USING (true);

-- utilities
CREATE POLICY "select_utilities" ON utilities FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_utilities" ON utilities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_utilities" ON utilities FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_utilities" ON utilities FOR DELETE TO authenticated USING (true);

-- variable_expenses
CREATE POLICY "select_variable_expenses" ON variable_expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_variable_expenses" ON variable_expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_variable_expenses" ON variable_expenses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_variable_expenses" ON variable_expenses FOR DELETE TO authenticated USING (true);
