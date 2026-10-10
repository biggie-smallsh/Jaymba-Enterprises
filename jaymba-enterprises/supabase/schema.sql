-- Run this whole file once in Supabase: SQL Editor > New query > Run.
-- STEP 1: replace YOUR_ADMIN_EMAIL below with the email you will sign in with.

create table if not exists public.admins (email text primary key);
insert into public.admins (email) values ('YOUR_ADMIN_EMAIL') on conflict do nothing;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where email = (auth.jwt() ->> 'email'));
$$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Other',
  price numeric not null default 0,
  description text not null default '',
  image_url text,
  in_stock boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  id int primary key default 1,
  phone text not null default '254740253121',
  location text not null default '',
  hours text not null default '6:30am - 6:00pm',
  announcement text not null default '',
  constraint single_row check (id = 1)
);
insert into public.settings (id, phone, location, hours) values (1, '254740253121', 'Nairobi, Nyamakima. New Nyamakima Electrical Point building, next to Mololine. Ground floor, shop number G11.', '6:30am - 6:00pm') on conflict do nothing;

alter table public.admins enable row level security;
alter table public.products enable row level security;
alter table public.settings enable row level security;

drop policy if exists "public read products" on public.products;
drop policy if exists "admin write products" on public.products;
drop policy if exists "public read settings" on public.settings;
drop policy if exists "admin write settings" on public.settings;

create policy "public read products" on public.products for select using (true);
create policy "admin write products" on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "public read settings" on public.settings for select using (true);
create policy "admin write settings" on public.settings for all using (public.is_admin()) with check (public.is_admin());

-- Image storage
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true) on conflict do nothing;

drop policy if exists "public read images" on storage.objects;
drop policy if exists "admin write images" on storage.objects;
create policy "public read images" on storage.objects for select using (bucket_id = 'product-images');
create policy "admin write images" on storage.objects for all
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

-- Optional sample products (delete these from the admin area later)
insert into public.products (name, category, price, description, in_stock) values
 ('Twin & Earth Cable 2.5mm (100m)', 'Wires & Cables', 9500, 'Copper twin and earth cable for general wiring.', true),
 ('13A Double Socket', 'Sockets', 650, 'Switched double socket outlet, white finish.', true),
 ('1-Gang 2-Way Switch', 'Switches', 220, 'Standard wall switch, flush mount.', true),
 ('LED Bulb 9W (Warm White)', 'Bulbs & Lighting', 180, 'Energy saving LED bulb, B22 cap.', true);

-- ===== Orders (added) =====
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  receipt_no text not null,
  customer_name text not null,
  phone text not null,
  items jsonb not null,
  total numeric not null,
  mpesa_code text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
alter table public.orders enable row level security;
drop policy if exists "anyone can place order" on public.orders;
drop policy if exists "admin manage orders" on public.orders;
create policy "anyone can place order" on public.orders for insert with check (status = 'pending');
create policy "admin manage orders" on public.orders for all using (public.is_admin()) with check (public.is_admin());
