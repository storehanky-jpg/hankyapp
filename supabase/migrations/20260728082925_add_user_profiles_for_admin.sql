/*
# Add profiles table for admin user management

1. New Tables
- `profiles`
  - `id` (uuid, primary key, references auth.users ON DELETE CASCADE)
  - `email` (text, the user's email)
  - `display_name` (text, optional friendly name)
  - `role` (text, 'admin' or 'user', default 'user')
  - `is_active` (boolean, default true — admin can deactivate a user to block access)
  - `created_at` (timestamptz)

2. Automation
- A trigger `handle_new_user_profile` creates a profile row automatically
  whenever a new user signs up via Supabase Auth, with role='user' and is_active=true.

3. Security
- RLS enabled on `profiles`.
- Any authenticated user can read all profiles (so the admin page can list users).
- Users can update only their own profile row (e.g. display name).
- Insert is handled by the trigger via a SECURITY DEFINER function, so no
  direct INSERT policy is needed for the frontend.
- DELETE is not exposed via RLS — user removal is done through the edge
  function which uses the service role key.

4. Notes
- The admin role is assigned manually via SQL for the designated admin email.
- The edge function `admin-manage-users` uses the service role key to create
  users, reset passwords, and toggle is_active.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated user to read profiles (needed for admin page user list)
DROP POLICY IF EXISTS "read_all_profiles" ON profiles;
CREATE POLICY "read_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);

-- Allow users to update only their own profile
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Function to auto-create a profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role, is_active)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), 'user', true)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Backfill profiles for existing auth users
INSERT INTO public.profiles (id, email, role, is_active)
SELECT id, email, 'user', true FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
