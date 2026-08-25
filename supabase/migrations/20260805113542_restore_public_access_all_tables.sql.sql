-- Restore anon access to all data tables (no-login mode)
-- The app works without authentication; anon role needs read/write access

-- Helper: replace policies for a table to allow anon+authenticated full access

-- sales
DROP POLICY IF EXISTS select_sales ON sales;
DROP POLICY IF EXISTS insert_sales ON sales;
DROP POLICY IF EXISTS update_sales ON sales;
DROP POLICY IF EXISTS delete_sales ON sales;
CREATE POLICY select_sales ON sales FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY insert_sales ON sales FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY update_sales ON sales FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY delete_sales ON sales FOR DELETE TO anon, authenticated USING (true);

-- bulk_sales
DROP POLICY IF EXISTS select_bulk_sales ON bulk_sales;
DROP POLICY IF EXISTS insert_bulk_sales ON bulk_sales;
DROP POLICY IF EXISTS update_bulk_sales ON bulk_sales;
DROP POLICY IF EXISTS delete_bulk_sales ON bulk_sales;
CREATE POLICY select_bulk_sales ON bulk_sales FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY insert_bulk_sales ON bulk_sales FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY update_bulk_sales ON bulk_sales FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY delete_bulk_sales ON bulk_sales FOR DELETE TO anon, authenticated USING (true);

-- material_purchases
DROP POLICY IF EXISTS select_material_purchases ON material_purchases;
DROP POLICY IF EXISTS insert_material_purchases ON material_purchases;
DROP POLICY IF EXISTS update_material_purchases ON material_purchases;
DROP POLICY IF EXISTS delete_material_purchases ON material_purchases;
CREATE POLICY select_material_purchases ON material_purchases FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY insert_material_purchases ON material_purchases FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY update_material_purchases ON material_purchases FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY delete_material_purchases ON material_purchases FOR DELETE TO anon, authenticated USING (true);

-- fixed_charges
DROP POLICY IF EXISTS select_fixed_charges ON fixed_charges;
DROP POLICY IF EXISTS insert_fixed_charges ON fixed_charges;
DROP POLICY IF EXISTS update_fixed_charges ON fixed_charges;
DROP POLICY IF EXISTS delete_fixed_charges ON fixed_charges;
CREATE POLICY select_fixed_charges ON fixed_charges FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY insert_fixed_charges ON fixed_charges FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY update_fixed_charges ON fixed_charges FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY delete_fixed_charges ON fixed_charges FOR DELETE TO anon, authenticated USING (true);

-- variable_expenses
DROP POLICY IF EXISTS select_variable_expenses ON variable_expenses;
DROP POLICY IF EXISTS insert_variable_expenses ON variable_expenses;
DROP POLICY IF EXISTS update_variable_expenses ON variable_expenses;
DROP POLICY IF EXISTS delete_variable_expenses ON variable_expenses;
CREATE POLICY select_variable_expenses ON variable_expenses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY insert_variable_expenses ON variable_expenses FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY update_variable_expenses ON variable_expenses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY delete_variable_expenses ON variable_expenses FOR DELETE TO anon, authenticated USING (true);

-- utilities
DROP POLICY IF EXISTS select_utilities ON utilities;
DROP POLICY IF EXISTS insert_utilities ON utilities;
DROP POLICY IF EXISTS update_utilities ON utilities;
DROP POLICY IF EXISTS delete_utilities ON utilities;
CREATE POLICY select_utilities ON utilities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY insert_utilities ON utilities FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY update_utilities ON utilities FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY delete_utilities ON utilities FOR DELETE TO anon, authenticated USING (true);

-- labor_costs
DROP POLICY IF EXISTS select_labor_costs ON labor_costs;
DROP POLICY IF EXISTS insert_labor_costs ON labor_costs;
DROP POLICY IF EXISTS update_labor_costs ON labor_costs;
DROP POLICY IF EXISTS delete_labor_costs ON labor_costs;
CREATE POLICY select_labor_costs ON labor_costs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY insert_labor_costs ON labor_costs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY update_labor_costs ON labor_costs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY delete_labor_costs ON labor_costs FOR DELETE TO anon, authenticated USING (true);

-- shop_sales
DROP POLICY IF EXISTS select_shop_sales ON shop_sales;
DROP POLICY IF EXISTS insert_shop_sales ON shop_sales;
DROP POLICY IF EXISTS update_shop_sales ON shop_sales;
DROP POLICY IF EXISTS delete_shop_sales ON shop_sales;
CREATE POLICY select_shop_sales ON shop_sales FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY insert_shop_sales ON shop_sales FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY update_shop_sales ON shop_sales FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY delete_shop_sales ON shop_sales FOR DELETE TO anon, authenticated USING (true);

-- raw_materials
DROP POLICY IF EXISTS select_raw_materials ON raw_materials;
DROP POLICY IF EXISTS insert_raw_materials ON raw_materials;
DROP POLICY IF EXISTS update_raw_materials ON raw_materials;
DROP POLICY IF EXISTS delete_raw_materials ON raw_materials;
CREATE POLICY select_raw_materials ON raw_materials FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY insert_raw_materials ON raw_materials FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY update_raw_materials ON raw_materials FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY delete_raw_materials ON raw_materials FOR DELETE TO anon, authenticated USING (true);

-- packaging
DROP POLICY IF EXISTS select_packaging ON packaging;
DROP POLICY IF EXISTS insert_packaging ON packaging;
DROP POLICY IF EXISTS update_packaging ON packaging;
DROP POLICY IF EXISTS delete_packaging ON packaging;
CREATE POLICY select_packaging ON packaging FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY insert_packaging ON packaging FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY update_packaging ON packaging FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY delete_packaging ON packaging FOR DELETE TO anon, authenticated USING (true);

-- production_batches
DROP POLICY IF EXISTS select_production_batches ON production_batches;
DROP POLICY IF EXISTS insert_production_batches ON production_batches;
DROP POLICY IF EXISTS update_production_batches ON production_batches;
DROP POLICY IF EXISTS delete_production_batches ON production_batches;
CREATE POLICY select_production_batches ON production_batches FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY insert_production_batches ON production_batches FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY update_production_batches ON production_batches FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY delete_production_batches ON production_batches FOR DELETE TO anon, authenticated USING (true);

-- unsold_products
DROP POLICY IF EXISTS select_unsold_products ON unsold_products;
DROP POLICY IF EXISTS insert_unsold_products ON unsold_products;
DROP POLICY IF EXISTS update_unsold_products ON unsold_products;
DROP POLICY IF EXISTS delete_unsold_products ON unsold_products;
CREATE POLICY select_unsold_products ON unsold_products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY insert_unsold_products ON unsold_products FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY update_unsold_products ON unsold_products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY delete_unsold_products ON unsold_products FOR DELETE TO anon, authenticated USING (true);

-- recipe_config
DROP POLICY IF EXISTS select_recipe_config ON recipe_config;
DROP POLICY IF EXISTS insert_recipe_config ON recipe_config;
DROP POLICY IF EXISTS update_recipe_config ON recipe_config;
DROP POLICY IF EXISTS delete_recipe_config ON recipe_config;
CREATE POLICY select_recipe_config ON recipe_config FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY insert_recipe_config ON recipe_config FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY update_recipe_config ON recipe_config FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY delete_recipe_config ON recipe_config FOR DELETE TO anon, authenticated USING (true);

-- recipe_items
DROP POLICY IF EXISTS select_recipe_items ON recipe_items;
DROP POLICY IF EXISTS insert_recipe_items ON recipe_items;
DROP POLICY IF EXISTS update_recipe_items ON recipe_items;
DROP POLICY IF EXISTS delete_recipe_items ON recipe_items;
CREATE POLICY select_recipe_items ON recipe_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY insert_recipe_items ON recipe_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY update_recipe_items ON recipe_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY delete_recipe_items ON recipe_items FOR DELETE TO anon, authenticated USING (true);

-- chocolate_config
DROP POLICY IF EXISTS select_chocolate_config ON chocolate_config;
DROP POLICY IF EXISTS insert_chocolate_config ON chocolate_config;
DROP POLICY IF EXISTS update_chocolate_config ON chocolate_config;
DROP POLICY IF EXISTS delete_chocolate_config ON chocolate_config;
CREATE POLICY select_chocolate_config ON chocolate_config FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY insert_chocolate_config ON chocolate_config FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY update_chocolate_config ON chocolate_config FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY delete_chocolate_config ON chocolate_config FOR DELETE TO anon, authenticated USING (true);

-- chocolate_ingredients
DROP POLICY IF EXISTS select_chocolate_ingredients ON chocolate_ingredients;
DROP POLICY IF EXISTS insert_chocolate_ingredients ON chocolate_ingredients;
DROP POLICY IF EXISTS update_chocolate_ingredients ON chocolate_ingredients;
DROP POLICY IF EXISTS delete_chocolate_ingredients ON chocolate_ingredients;
CREATE POLICY select_chocolate_ingredients ON chocolate_ingredients FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY insert_chocolate_ingredients ON chocolate_ingredients FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY update_chocolate_ingredients ON chocolate_ingredients FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY delete_chocolate_ingredients ON chocolate_ingredients FOR DELETE TO anon, authenticated USING (true);

-- company_settings
DROP POLICY IF EXISTS select_company_settings ON company_settings;
DROP POLICY IF EXISTS insert_company_settings ON company_settings;
DROP POLICY IF EXISTS update_company_settings ON company_settings;
DROP POLICY IF EXISTS delete_company_settings ON company_settings;
CREATE POLICY select_company_settings ON company_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY insert_company_settings ON company_settings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY update_company_settings ON company_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY delete_company_settings ON company_settings FOR DELETE TO anon, authenticated USING (true);

-- customers
DROP POLICY IF EXISTS select_customers ON customers;
DROP POLICY IF EXISTS insert_customers ON customers;
DROP POLICY IF EXISTS update_customers ON customers;
DROP POLICY IF EXISTS delete_customers ON customers;
CREATE POLICY select_customers ON customers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY insert_customers ON customers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY update_customers ON customers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY delete_customers ON customers FOR DELETE TO anon, authenticated USING (true);

-- customer_prices
DROP POLICY IF EXISTS select_customer_prices ON customer_prices;
DROP POLICY IF EXISTS insert_customer_prices ON customer_prices;
DROP POLICY IF EXISTS update_customer_prices ON customer_prices;
DROP POLICY IF EXISTS delete_customer_prices ON customer_prices;
CREATE POLICY select_customer_prices ON customer_prices FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY insert_customer_prices ON customer_prices FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY update_customer_prices ON customer_prices FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY delete_customer_prices ON customer_prices FOR DELETE TO anon, authenticated USING (true);

-- customer_products
DROP POLICY IF EXISTS select_customer_products ON customer_products;
DROP POLICY IF EXISTS insert_customer_products ON customer_products;
DROP POLICY IF EXISTS update_customer_products ON customer_products;
DROP POLICY IF EXISTS delete_customer_products ON customer_products;
CREATE POLICY select_customer_products ON customer_products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY insert_customer_products ON customer_products FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY update_customer_products ON customer_products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY delete_customer_products ON customer_products FOR DELETE TO anon, authenticated USING (true);

-- suppliers
DROP POLICY IF EXISTS select_suppliers ON suppliers;
DROP POLICY IF EXISTS insert_suppliers ON suppliers;
DROP POLICY IF EXISTS update_suppliers ON suppliers;
DROP POLICY IF EXISTS delete_suppliers ON suppliers;
CREATE POLICY select_suppliers ON suppliers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY insert_suppliers ON suppliers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY update_suppliers ON suppliers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY delete_suppliers ON suppliers FOR DELETE TO anon, authenticated USING (true);

-- supplier_purchases
DROP POLICY IF EXISTS select_supplier_purchases ON supplier_purchases;
DROP POLICY IF EXISTS insert_supplier_purchases ON supplier_purchases;
DROP POLICY IF EXISTS update_supplier_purchases ON supplier_purchases;
DROP POLICY IF EXISTS delete_supplier_purchases ON supplier_purchases;
CREATE POLICY select_supplier_purchases ON supplier_purchases FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY insert_supplier_purchases ON supplier_purchases FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY update_supplier_purchases ON supplier_purchases FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY delete_supplier_purchases ON supplier_purchases FOR DELETE TO anon, authenticated USING (true);

-- company_fiscal_info
DROP POLICY IF EXISTS select_company_fiscal_info ON company_fiscal_info;
DROP POLICY IF EXISTS insert_company_fiscal_info ON company_fiscal_info;
DROP POLICY IF EXISTS update_company_fiscal_info ON company_fiscal_info;
DROP POLICY IF EXISTS delete_company_fiscal_info ON company_fiscal_info;
CREATE POLICY select_company_fiscal_info ON company_fiscal_info FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY insert_company_fiscal_info ON company_fiscal_info FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY update_company_fiscal_info ON company_fiscal_info FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY delete_company_fiscal_info ON company_fiscal_info FOR DELETE TO anon, authenticated USING (true);