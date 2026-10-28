-- Run this ONLY AFTER you have set up the authenticator app and can sign in to the admin area with a code.
-- It makes the DATABASE itself refuse admin changes unless the sign-in used the 6-digit code,
-- so even a stolen password cannot change products, orders or settings.
--
-- Run it in Supabase: SQL Editor > Create a new snippet > paste > Run.

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where email = (auth.jwt() ->> 'email'))
     and (auth.jwt() ->> 'aal') = 'aal2';
$$;

-- TO UNDO (if you are ever locked out), run this instead:
-- create or replace function public.is_admin() returns boolean
-- language sql stable security definer set search_path = public as $$
--   select exists (select 1 from public.admins where email = (auth.jwt() ->> 'email'));
-- $$;

-- IF YOU LOSE YOUR PHONE: run this, then sign in again and set up the authenticator app on the new phone.
-- delete from auth.mfa_factors where user_id = (select id from auth.users where email = 'jaymbaenterprice@gmail.com');
