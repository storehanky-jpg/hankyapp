/*
# Fix insecure RLS policies on customers and customer_prices

## Problem
Both `public.customers` and `public.customer_prices` had a single `FOR ALL`
policy with `USING (true)` and no `WITH CHECK`. That policy allowed
unrestricted access to every row for every role, effectively bypassing
row-level security entirely.

## Changes
1. Removed the open `public_access_customers` (FOR ALL, USING true) policy
   from `customers` and replaced it with four separate authenticated-only
   policies (SELECT / INSERT / UPDATE / DELETE), each guarded by
   `auth.uid() IS NOT NULL`. This matches the pattern already used by every
   other table in the database (bulk_sales, chocolate_config, etc.).
2. Removed the open `public_access_customer_prices` (FOR ALL, USING true)
   policy from `customer_prices` and replaced it with the same four
   authenticated-only policies.

## Security
- Both tables already had RLS enabled; it was being bypassed by the
  permissive `FOR ALL` policies. After this migration, only authenticated
  users can read or modify rows, consistent with the rest of the schema.
- No data is altered or deleted — only policies are dropped and recreated.

## Notes
1. Policies are dropped first (DROP POLICY IF EXISTS) then recreated so the
   migration is safe to re-run if the tool times out after committing.
2. The ownership predicate used is `auth.uid() IS NOT NULL` to match the
   existing convention across all other tables in this project.
3. `customer_prices.customer_id` references `customers.id` via a foreign key;
   both tables are secured the same way, so a caller authorized to read
   customers is also authorized to read their prices.
*/

-- customers: replace open FOR ALL policy with four authenticated policies
DROP POLICY IF EXISTS "public_access_customers" ON customers;

DROP POLICY IF EXISTS "select_customers" ON customers;
CREATE POLICY "select_customers" ON customers
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "insert_customers" ON customers;
CREATE POLICY "insert_customers" ON customers
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "update_customers" ON customers;
CREATE POLICY "update_customers" ON customers
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "delete_customers" ON customers;
CREATE POLICY "delete_customers" ON customers
  FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- customer_prices: replace open FOR ALL policy with four authenticated policies
DROP POLICY IF EXISTS "public_access_customer_prices" ON customer_prices;

DROP POLICY IF EXISTS "select_customer_prices" ON customer_prices;
CREATE POLICY "select_customer_prices" ON customer_prices
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "insert_customer_prices" ON customer_prices;
CREATE POLICY "insert_customer_prices" ON customer_prices
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "update_customer_prices" ON customer_prices;
CREATE POLICY "update_customer_prices" ON customer_prices
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "delete_customer_prices" ON customer_prices;
CREATE POLICY "delete_customer_prices" ON customer_prices
  FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);
