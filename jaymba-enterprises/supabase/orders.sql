-- Run in Supabase SQL Editor (after schema.sql). Adds customer orders.
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
