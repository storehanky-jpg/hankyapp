/*
# Add creation date to public user list view

1. View change
- Add `created_at` to `public_user_list` so the login profile cards keep a stable creation order.

2. Security
- The view remains limited to active users and exposes no password or credential data.
*/

DROP VIEW IF EXISTS public.public_user_list;

CREATE VIEW public.public_user_list AS
SELECT
  id,
  email,
  display_name,
  role,
  is_active,
  created_at
FROM public.profiles
WHERE is_active = true;

ALTER VIEW public.public_user_list OWNER TO postgres;
GRANT SELECT ON public.public_user_list TO anon, authenticated;
