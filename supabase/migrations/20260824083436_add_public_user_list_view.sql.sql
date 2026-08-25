/*
# Public user list view for login screen

1. New Views
- `public_user_list` — a view exposing `id`, `email`, `display_name`, `role`
  for all active users. This lets the login screen show a grid of user cards
  without requiring authentication (the user hasn't logged in yet).

2. Security
- The view is accessible by `anon` and `authenticated` roles.
- It exposes only non-sensitive columns (no passwords, no internal IDs
  beyond what's needed for the login flow).
- `is_active = true` filter ensures disabled users don't appear.
*/

DROP VIEW IF EXISTS public.public_user_list;

CREATE VIEW public.public_user_list AS
SELECT
  id,
  email,
  display_name,
  role,
  is_active
FROM public.profiles
WHERE is_active = true;

ALTER VIEW public.public_user_list OWNER TO postgres;

GRANT SELECT ON public.public_user_list TO anon, authenticated;
