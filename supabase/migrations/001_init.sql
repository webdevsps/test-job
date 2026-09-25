-- ============================================================
-- SHAMSY DEMO — Database Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================
create type user_role as enum ('owner', 'adviser');
create type order_status as enum ('draft', 'confirmed', 'cancelled');
create type discount_status as enum ('none', 'sand', 'red', 'blocked');

-- ============================================================
-- TABLES
-- ============================================================

-- Configurable settings — thresholds live here, never in code
create table settings (
  key text primary key,
  value integer not null check (value >= 0),
  updated_at timestamptz not null default now()
);

-- Product catalogue
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_usd_cents integer not null check (price_usd_cents > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Customers / dealers
create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  created_at timestamptz not null default now()
);

-- User profiles — extends auth.users
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'adviser',
  full_name text,
  created_at timestamptz not null default now()
);

-- Orders — rate_sdg is IMMUTABLE after creation
create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id),
  adviser_id uuid not null references profiles(id),
  rate_sdg integer not null check (rate_sdg > 0),
  status order_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Order lines — price_usd_cents is a snapshot taken at creation time
create table order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity integer not null check (quantity > 0),
  price_usd_cents integer not null check (price_usd_cents > 0),
  discount_usd_cents integer not null default 0 check (discount_usd_cents >= 0),
  discount_status discount_status not null default 'none',
  owner_approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- is_owner(): security definer avoids RLS recursion on profiles table
create or replace function is_owner()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'owner'
  )
$$;

-- Auto-update updated_at on orders and settings
create or replace function update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_updated_at
  before update on orders
  for each row execute function update_updated_at();

create trigger settings_updated_at
  before update on settings
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table settings      enable row level security;
alter table products      enable row level security;
alter table customers     enable row level security;
alter table profiles      enable row level security;
alter table orders        enable row level security;
alter table order_lines   enable row level security;

-- Settings: all authenticated users can read; only owners can write
create policy "settings_select" on settings
  for select to authenticated using (true);

create policy "settings_update" on settings
  for update to authenticated using (is_owner());

-- Products: all authenticated users can read; only owners can write
create policy "products_select" on products
  for select to authenticated using (true);

create policy "products_insert" on products
  for insert to authenticated with check (is_owner());

create policy "products_update" on products
  for update to authenticated using (is_owner());

-- Customers: all authenticated users can read and create
create policy "customers_select" on customers
  for select to authenticated using (true);

create policy "customers_insert" on customers
  for insert to authenticated with check (auth.uid() is not null);

-- Profiles: users see own; owners see all
create policy "profiles_select" on profiles
  for select to authenticated using (
    id = auth.uid() or is_owner()
  );

create policy "profiles_insert" on profiles
  for insert to authenticated with check (id = auth.uid());

-- Orders: advisers see own; owners see all
create policy "orders_select" on orders
  for select to authenticated using (
    adviser_id = auth.uid() or is_owner()
  );

create policy "orders_insert" on orders
  for insert to authenticated with check (adviser_id = auth.uid());

create policy "orders_update" on orders
  for update to authenticated using (
    adviser_id = auth.uid() or is_owner()
  );

-- Order lines: follow parent order's access rules
create policy "order_lines_select" on order_lines
  for select to authenticated using (
    exists (
      select 1 from orders
      where orders.id = order_lines.order_id
        and (orders.adviser_id = auth.uid() or is_owner())
    )
  );

create policy "order_lines_insert" on order_lines
  for insert to authenticated with check (
    exists (
      select 1 from orders
      where orders.id = order_lines.order_id
        and orders.adviser_id = auth.uid()
    )
  );

-- Only owners can approve (update) order lines
create policy "order_lines_update" on order_lines
  for update to authenticated using (is_owner());

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGN-UP
-- Reads 'role' and 'full_name' from user metadata set by seed script
-- ============================================================
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, role, full_name)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'adviser'),
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- GRANTS — allow service_role full access (used by seed script)
-- ============================================================
grant all on all tables    in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all functions in schema public to service_role;

-- ============================================================
-- GRANTS — allow authenticated users to use the tables
-- RLS policies above control WHICH rows; these grants allow
-- the role to access the tables at all.
-- ============================================================
grant select on public.settings     to authenticated;
grant select on public.products     to authenticated;
grant select, insert on public.customers to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.orders to authenticated;
grant select, insert, update on public.order_lines to authenticated;
grant usage on all sequences in schema public to authenticated;
