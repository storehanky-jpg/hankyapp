/*
# Admin: permissions, login history, action logs

1. New Tables
- `user_permissions`
  - `user_id` (uuid FK -> profiles.id ON DELETE CASCADE, primary key)
  - One column per app page: dashboard, recipe, chocolat, materials, charges,
    production, customers, bulksales, pricing, reports, history, settings, admin
  - Each column is text with values: 'full' (read+write), 'read' (read-only),
    or 'none' (no access). Default 'none'.
- `admin_login_history`
  - `id` (uuid pk)
  - `user_id` (uuid FK -> profiles.id ON DELETE CASCADE)
  - `email` (text)
  - `login_time` (timestamptz)
  - `device_info` (text — user agent / device label)
  - `ip_address` (text, nullable)
- `admin_action_logs`
  - `id` (uuid pk)
  - `user_id` (uuid FK -> profiles.id ON DELETE CASCADE)
  - `user_email` (text)
  - `action_type` (text: 'login','logout','create','update','delete','sale','price_change', etc.)
  - `action_detail` (text, human-readable description)
  - `page` (text, which page the action happened on)
  - `created_at` (timestamptz default now())

2. Security
- RLS enabled on all three tables.
- user_permissions: any authenticated user can read their own permissions;
  only admin can read all and update (checked via profiles.role).
- admin_login_history: only admin can read; insert by the edge function
  (service role) — no direct insert policy for frontend.
- admin_action_logs: only admin can read; insert via edge function (service role).

3. Notes
- The edge function `admin-manage-users` uses the service role key to insert
  login history and action logs, bypassing RLS.
- Permissions are checked client-side via the profiles + user_permissions tables.
*/

-- ── user_permissions ──
CREATE TABLE IF NOT EXISTS user_permissions (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  dashboard text NOT NULL DEFAULT 'none' CHECK (dashboard IN ('full','read','none')),
  recipe text NOT NULL DEFAULT 'none' CHECK (recipe IN ('full','read','none')),
  chocolat text NOT NULL DEFAULT 'none' CHECK (chocolat IN ('full','read','none')),
  materials text NOT NULL DEFAULT 'none' CHECK (materials IN ('full','read','none')),
  charges text NOT NULL DEFAULT 'none' CHECK (charges IN ('full','read','none')),
  production text NOT NULL DEFAULT 'none' CHECK (production IN ('full','read','none')),
  customers text NOT NULL DEFAULT 'none' CHECK (customers IN ('full','read','none')),
  bulksales text NOT NULL DEFAULT 'none' CHECK (bulksales IN ('full','read','none')),
  pricing text NOT NULL DEFAULT 'none' CHECK (pricing IN ('full','read','none')),
  reports text NOT NULL DEFAULT 'none' CHECK (reports IN ('full','read','none')),
  history text NOT NULL DEFAULT 'none' CHECK (history IN ('full','read','none')),
  settings text NOT NULL DEFAULT 'none' CHECK (settings IN ('full','read','none')),
  admin text NOT NULL DEFAULT 'none' CHECK (admin IN ('full','read','none')),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read their own permissions
DROP POLICY IF EXISTS "read_own_permissions" ON user_permissions;
CREATE POLICY "read_own_permissions" ON user_permissions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- Admin can read all permissions
DROP POLICY IF EXISTS "admin_read_all_permissions" ON user_permissions;
CREATE POLICY "admin_read_all_permissions" ON user_permissions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Admin can update permissions
DROP POLICY IF EXISTS "admin_update_permissions" ON user_permissions;
CREATE POLICY "admin_update_permissions" ON user_permissions FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Admin can insert permissions
DROP POLICY IF EXISTS "admin_insert_permissions" ON user_permissions;
CREATE POLICY "admin_insert_permissions" ON user_permissions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- ── admin_login_history ──
CREATE TABLE IF NOT EXISTS admin_login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  login_time timestamptz DEFAULT now(),
  device_info text,
  ip_address text
);

ALTER TABLE admin_login_history ENABLE ROW LEVEL SECURITY;

-- Only admin can read login history
DROP POLICY IF EXISTS "admin_read_login_history" ON admin_login_history;
CREATE POLICY "admin_read_login_history" ON admin_login_history FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- ── admin_action_logs ──
CREATE TABLE IF NOT EXISTS admin_action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  action_type text NOT NULL,
  action_detail text,
  page text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_action_logs ENABLE ROW LEVEL SECURITY;

-- Only admin can read action logs
DROP POLICY IF EXISTS "admin_read_action_logs" ON admin_action_logs;
CREATE POLICY "admin_read_action_logs" ON admin_action_logs FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Any authenticated user can insert their own action logs (for tracking)
DROP POLICY IF EXISTS "insert_own_action_logs" ON admin_action_logs;
CREATE POLICY "insert_own_action_logs" ON admin_action_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ── Backfill: give admin full permissions on all pages ──
INSERT INTO user_permissions (user_id, dashboard, recipe, chocolat, materials, charges, production, customers, bulksales, pricing, reports, history, settings, admin)
SELECT id, 'full', 'full', 'full', 'full', 'full', 'full', 'full', 'full', 'full', 'full', 'full', 'full', 'full'
FROM profiles
WHERE role = 'admin'
ON CONFLICT (user_id) DO NOTHING;

-- ── Backfill: give existing non-admin users default vendor permissions ──
INSERT INTO user_permissions (user_id, dashboard, recipe, chocolat, materials, charges, production, customers, bulksales, pricing, reports, history, settings, admin)
SELECT id, 'full', 'none', 'none', 'read', 'none', 'none', 'none', 'full', 'none', 'none', 'read', 'none', 'none'
FROM profiles
WHERE role = 'user'
ON CONFLICT (user_id) DO NOTHING;
