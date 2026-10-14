-- Run this ONCE in Supabase: SQL Editor > New query > paste > Run.
-- It is safe to run even if you already ran order-approval.sql.
-- Adds delivery details to orders, updates the order lookup, and adds the delivery address to your phone alert.

alter table public.orders add column if not exists delivery_method text not null default 'collect';
alter table public.orders add column if not exists delivery_address text not null default '';
alter table public.orders add column if not exists notes text not null default '';

drop function if exists public.get_order(text, text);
create function public.get_order(p_receipt text, p_phone text)
returns table (receipt_no text, customer_name text, phone text, items jsonb, total numeric, mpesa_code text, status text, created_at timestamptz,
               delivery_method text, delivery_address text, notes text)
language sql security definer set search_path = public as $$
  select o.receipt_no, o.customer_name, o.phone, o.items, o.total, o.mpesa_code, o.status, o.created_at,
         o.delivery_method, o.delivery_address, o.notes
  from public.orders o
  where upper(o.receipt_no) = upper(trim(p_receipt))
    and right(regexp_replace(o.phone, '\D', '', 'g'), 9) = right(regexp_replace(p_phone, '\D', '', 'g'), 9)
  limit 1;
$$;
grant execute on function public.get_order(text, text) to anon, authenticated;

create extension if not exists pg_net with schema extensions;

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
        'message', new.customer_name || ' ordered KES ' || new.total::text || '. M-Pesa code: ' || new.mpesa_code || '. '
                   || case when new.delivery_method = 'send' then 'SEND TO: ' || new.delivery_address || ' (customer pays shipping). ' else 'Will collect from shop. ' end
                   || 'Open the admin area to approve.',
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

notify pgrst, 'reload schema';
