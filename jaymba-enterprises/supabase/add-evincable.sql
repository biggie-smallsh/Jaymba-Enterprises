-- Optional: run in Supabase SQL Editor to add the Evin Cable product.
-- (You can also add it from the admin area with a photo upload.)
insert into public.products (name, category, price, description, image_url, in_stock) values
 ('Evin Cable 1.5mm Twin with Earth', 'Wires & Cables', 5500,
  'EVINCABLE 1.5mm² twin with earth, 100% copper, PVC insulated, 300/500V. 90 metres per roll.',
  '/products/evincable-1-5mm.jpg', true);
