-- KERAMO ART catalog — Supabase schema
-- გაეშვება მხოლოდ KERAMO ART-ის ცალკე Supabase პროექტში.

-- ---------- admins ----------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email   text not null,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

drop policy if exists "admins read self" on public.admins;
create policy "admins read self" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- ---------- categories ----------
create table if not exists public.categories (
  id    text primary key,
  label text not null,
  sort  int  not null default 0
);
alter table public.categories enable row level security;

drop policy if exists "categories public read" on public.categories;
create policy "categories public read" on public.categories
  for select to anon, authenticated using (true);
drop policy if exists "categories admin write" on public.categories;
create policy "categories admin write" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- products ----------
create table if not exists public.products (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique,
  name       text not null,
  category   text references public.categories(id) on update cascade on delete set null,
  material   text,
  color      text,
  size       text,            -- დამატებითი შენიშვნა ზომაზე (არასავალდებულო)
  length_cm  int,             -- სიგრძე, სმ (ფასი ამით გამოითვლება)
  depth_cm   int,             -- სიღრმე, სმ
  height_cm  int,             -- სიმაღლე, სმ (პოსტამენტურისთვის)
  price      int,             -- ხელით მითითებული ფასი (ცარიელი = ავტომატური)
  washer     boolean not null default false,
  featured   boolean not null default false,
  note       text,
  images     text[]  not null default '{}',
  sort       int     not null default 0,
  published  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products
  for select to anon, authenticated using (published or public.is_admin());
drop policy if exists "products admin write" on public.products;
create policy "products admin write" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- settings (კონტაქტები და ა.შ.) ----------
create table if not exists public.settings (
  key   text primary key,
  value text
);
alter table public.settings enable row level security;

drop policy if exists "settings public read" on public.settings;
create policy "settings public read" on public.settings
  for select to anon, authenticated using (true);
drop policy if exists "settings admin write" on public.settings;
create policy "settings admin write" on public.settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.settings (key, value) values
  ('phone',    '+995 597 32 32 95'),
  ('email',    'keramoartcollection@gmail.com'),
  ('facebook', 'https://www.facebook.com/profile.php?id=61551452274576'),
  ('hours',    'ყოველდღე, 24 საათი — კვირის ყველა დღე'),
  ('area',     'მთელი საქართველო'),
  ('price_tier1', '850'),   -- 1.2 მ-მდე
  ('price_tier2', '1250'),  -- 1.2–1.6 მ
  ('price_wall',  '150')    -- კედელზე მიყენება
on conflict (key) do nothing;

-- ---------- storage: product photos ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('products', 'products', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "product photos admin insert" on storage.objects;
create policy "product photos admin insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'products' and public.is_admin());
drop policy if exists "product photos admin update" on storage.objects;
create policy "product photos admin update" on storage.objects
  for update to authenticated using (bucket_id = 'products' and public.is_admin());
drop policy if exists "product photos admin delete" on storage.objects;
create policy "product photos admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'products' and public.is_admin());

-- ---------- admin: keramoartcollection@gmail.com ----------
-- ჯერ შექმენით მომხმარებელი Authentication → Users → Add user, შემდეგ:
insert into public.admins (user_id, email)
select id, email from auth.users where lower(email) = 'keramoartcollection@gmail.com'
on conflict (user_id) do nothing;
