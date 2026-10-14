-- Run this ONCE in Supabase: SQL Editor > New query > paste > Run.
-- 1) Lets a customer look up their own order (needs order number + phone) to see the status and download the receipt.
-- 2) Sends a phone alert to you (through the free ntfy app) whenever a new order is placed.
-- 3) Turns on live updates for the Orders list in your admin area.

create or replace function public.get_order(p_receipt text, p_phone text)
returns table (receipt_no text, customer_name text, phone text, items jsonb, total numeric, mpesa_code text, status text, created_at timestamptz)
language sql security definer set search_path = public as $$
  select o.receipt_no, o.customer_name, o.phone, o.items, o.total, o.mpesa_code, o.status, o.created_at
  from public.orders o
  where upper(o.receipt_no) = upper(trim(p_receipt))
    and right(regexp_replace(o.phone, '\D', '', 'g'), 9) = right(regexp_replace(p_phone, '\D', '', 'g'), 9)
  limit 1;
$$;
grant execute on function public.get_order(text, text) to anon, authenticated;

create extension if not exists pg_net with schema extensions;

-- The alert goes to the ntfy topic below. Keep this name private. You can change it to anything long and random,
-- but then subscribe to the same name in the ntfy app.
create or replace function public.notify_new_order() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  begin
    perform net.http_post(
      url := 'https://ntfy.sh/',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'topic', 'jaymba-orders-1fpmwdl5e8zj',
        'title', 'New order ' || new.receipt_no,
        'message', new.customer_name || ' ordered KES ' || new.total::text || '. M-Pesa code: ' || new.mpesa_code || '. Open the admin area to approve.',
        'priority', 4,
        'tags', jsonb_build_array('moneybag')
      )
    );
  exception when others then
    null; -- never block an order because the alert failed
  end;
  return new;
end $$;

drop trigger if exists on_new_order on public.orders;
create trigger on_new_order after insert on public.orders for each row execute function public.notify_new_order();

do $$ begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null;
end $$;
