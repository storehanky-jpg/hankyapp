/*
# Create orders table for dashboard command tracking

1. New Tables
- `orders` — stores customer orders with delivery/pickup dates and status
  - `id` (uuid, primary key)
  - `customer_name` (text, not null) — name of the customer
  - `customer_phone` (text, nullable) — phone number
  - `product_description` (text, not null) — products and quantities requested
  - `expected_date` (date, not null) — expected delivery or pickup date
  - `notes` (text, nullable) — additional notes
  - `status` (text, not null, default 'pending') — one of: pending, delivered, cancelled
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `orders`.
- Allow anon + authenticated CRUD since the app uses shared data (no per-user isolation for orders).
*/

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_phone text,
  product_description text NOT NULL,
  expected_date date NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_orders" ON orders;
CREATE POLICY "anon_delete_orders" ON orders FOR DELETE
  TO anon, authenticated USING (true);
