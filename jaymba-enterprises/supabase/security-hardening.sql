-- Run ONCE in Supabase: SQL Editor > Create a new snippet > paste > Run.
-- Run it AFTER order-delivery.sql. Delete any test orders first (Table Editor > orders).

-- 1. Reject nonsense, oversized or fake-status orders (applies to new orders)
alter table public.orders drop constraint if exists orders_sane;
alter table public.orders add constraint orders_sane check (
  char_length(customer_name) between 2 and 100
  and char_length(phone) between 9 and 20
  and char_length(mpesa_code) between 8 and 20
  and char_length(delivery_address) <= 500
  and char_length(notes) <= 500
  and total > 0 and total < 10000000
  and jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 100
  and status in ('pending', 'confirmed', 'rejected')
) not valid;

-- 2. The same M-Pesa code cannot be used for two orders (stops payment fraud by re-using a code)
create unique index if not exists orders_mpesa_code_unique on public.orders (upper(mpesa_code));

-- 3. Product photos: images only, 5 MB maximum
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'product-images';

notify pgrst, 'reload schema';

-- 4. Check that row security is ON for every table (every row should say true). Run this line on its own:
-- select tablename, rowsecurity from pg_tables where schemaname = 'public';
