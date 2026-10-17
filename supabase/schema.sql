-- QR Dine schema. Run this whole file once in Supabase -> SQL Editor.

create extension if not exists "pgcrypto";

-- ---------- Tables ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'waiter'
    check (role in ('kitchen','waiter','accountant','manager','owner'))
);

create table if not exists dining_tables (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  seats int not null default 4,
  link_group uuid            -- tables sharing a link_group are billed together
);

create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  name jsonb not null,        -- {"en":"Paneer Tikka","hi":"...","bn":"..."}
  description jsonb,
  price numeric(10,2) not null check (price >= 0),
  category text not null default 'Main',
  in_stock boolean not null default true,
  stock_qty int not null default 50
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references dining_tables(id),
  status text not null default 'placed'
    check (status in ('placed','preparing','ready','served','paid')),
  customer_phone text,
  payment_method text,
  total numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id),
  name text not null,
  qty int not null check (qty > 0),
  price numeric(10,2) not null
);

create table if not exists service_requests (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references dining_tables(id),
  kind text not null check (kind in ('water','napkin','bill','help','other')),
  status text not null default 'open' check (status in ('open','resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- ---------- Helper: is the caller staff? ----------
create or replace function is_staff() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from profiles where id = auth.uid());
$$;

-- ---------- Row Level Security ----------
alter table profiles         enable row level security;
alter table dining_tables    enable row level security;
alter table menu_items       enable row level security;
alter table orders           enable row level security;
alter table order_items      enable row level security;
alter table service_requests enable row level security;

-- profiles: a user can read their own profile
create policy "own profile" on profiles for select using (id = auth.uid());

-- customers (anon) can read the menu and tables
create policy "public read menu"   on menu_items    for select using (true);
create policy "public read tables" on dining_tables for select using (true);

-- staff manage everything operational
create policy "staff menu"    on menu_items       for all using (is_staff()) with check (is_staff());
create policy "staff tables"  on dining_tables    for all using (is_staff()) with check (is_staff());
create policy "staff orders"  on orders           for all using (is_staff()) with check (is_staff());
create policy "staff items"   on order_items      for all using (is_staff()) with check (is_staff());
create policy "staff service" on service_requests for all using (is_staff()) with check (is_staff());

-- customers can raise service requests (no read access)
create policy "anon create request" on service_requests
  for insert to anon, authenticated with check (status = 'open');

-- ---------- RPC: place an order (server-side price + stock check) ----------
create or replace function place_order(p_table uuid, p_items jsonb, p_phone text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_order uuid;
  v_total numeric := 0;
  r record;
  v_item menu_items;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty';
  end if;
  if not exists (select 1 from dining_tables where id = p_table) then
    raise exception 'Unknown table';
  end if;

  insert into orders(table_id, customer_phone) values (p_table, p_phone)
  returning id into v_order;

  for r in
    select (e->>'id')::uuid as id, (e->>'qty')::int as qty
    from jsonb_array_elements(p_items) e
  loop
    if r.qty < 1 or r.qty > 20 then raise exception 'Invalid quantity'; end if;

    select * into v_item from menu_items where id = r.id for update;
    if not found or not v_item.in_stock or v_item.stock_qty < r.qty then
      raise exception 'Item not available: %', coalesce(v_item.name->>'en', 'unknown');
    end if;

    update menu_items
       set stock_qty = stock_qty - r.qty,
           in_stock  = (stock_qty - r.qty) > 0
     where id = r.id;

    insert into order_items(order_id, menu_item_id, name, qty, price)
    values (v_order, v_item.id, v_item.name->>'en', r.qty, v_item.price);

    v_total := v_total + v_item.price * r.qty;
  end loop;

  update orders set total = v_total where id = v_order;
  return v_order;
end $$;

-- ---------- RPC: customer reads their own order by its id ----------
create or replace function get_order(p_id uuid)
returns json language sql security definer set search_path = public stable as $$
  select json_build_object(
    'id', o.id, 'status', o.status, 'total', o.total,
    'created_at', o.created_at, 'table', t.label, 'payment_method', o.payment_method,
    'items', coalesce((
      select json_agg(json_build_object('name', i.name, 'qty', i.qty, 'price', i.price))
      from order_items i where i.order_id = o.id), '[]'::json)
  )
  from orders o join dining_tables t on t.id = o.table_id
  where o.id = p_id;
$$;

grant execute on function place_order(uuid, jsonb, text) to anon, authenticated;
grant execute on function get_order(uuid) to anon, authenticated;

-- ---------- Realtime ----------
alter publication supabase_realtime add table orders, menu_items, service_requests;

-- ---------- Seed data ----------
insert into dining_tables(label, seats) values
  ('Table 1',2),('Table 2',2),('Table 3',4),('Table 4',4),('Table 5',4),('Table 6',6);

insert into menu_items(name, description, price, category, stock_qty) values
 ('{"en":"Paneer Butter Masala","hi":"पनीर बटर मसाला","bn":"পনির বাটার মসলা","ta":"பன்னீர் பட்டர் மசாலா","te":"పనీర్ బటర్ మసాలా"}',
  '{"en":"Creamy tomato gravy with soft paneer"}', 240, 'Main', 30),
 ('{"en":"Dal Tadka","hi":"दाल तड़का","bn":"ডাল তড়কা","ta":"தால் தட்கா","te":"దాల్ తడ్కా"}',
  '{"en":"Yellow lentils tempered with ghee and cumin"}', 160, 'Main', 40),
 ('{"en":"Veg Biryani","hi":"वेज बिरयानी","bn":"ভেজ বিরিয়ানি","ta":"வெஜ் பிரியாணி","te":"వెజ్ బిర్యానీ"}',
  '{"en":"Fragrant basmati rice with vegetables"}', 200, 'Main', 25),
 ('{"en":"Butter Naan","hi":"बटर नान","bn":"বাটার নান","ta":"பட்டர் நான்","te":"బటర్ నాన్"}',
  '{"en":"Tandoor baked flatbread"}', 50, 'Breads', 80),
 ('{"en":"Masala Dosa","hi":"मसाला डोसा","bn":"মসলা ডোসা","ta":"மசாலா தோசை","te":"మసాలా దోశ"}',
  '{"en":"Crisp crepe with spiced potato filling"}', 120, 'South Indian', 35),
 ('{"en":"Sweet Lassi","hi":"मीठी लस्सी","bn":"মিষ্টি লাচ্ছি","ta":"இனிப்பு லஸ்ஸி","te":"స్వీట్ లస్సీ"}',
  '{"en":"Chilled yogurt drink"}', 70, 'Drinks', 60),
 ('{"en":"Gulab Jamun","hi":"गुलाब जामुन","bn":"গোলাপ জামুন","ta":"குலாப் ஜாமூன்","te":"గులాబ్ జామూన్"}',
  '{"en":"Warm milk dumplings in sugar syrup"}', 80, 'Dessert', 3);

-- ---------- After you sign up your first staff user ----------
-- Create the user in Supabase -> Authentication -> Users, then run:
-- insert into profiles(id, full_name, role)
-- values ('PASTE-USER-UUID-HERE', 'Manager One', 'manager');
