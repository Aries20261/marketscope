-- MarketScope: skema awal. Aman dijalankan sekali pada proyek kosong.

create type public.app_role as enum ('superadmin', 'admin', 'analis', 'viewer');
create type public.app_plan as enum ('gratis', 'bulanan', 'empat_bulan', 'lifetime');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  nama text not null default '',
  role public.app_role not null default 'viewer',
  plan public.app_plan not null default 'gratis',
  plan_expires_at timestamptz,
  aktif boolean not null default true,
  verifikasi text not null default 'disetujui' check (verifikasi in ('menunggu', 'disetujui', 'ditolak')),
  must_change_password boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Fungsi bantu (security definer agar RLS pada profiles tidak berulang).
create or replace function public.current_app_role() returns public.app_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and aktif
$$;

create or replace function public.is_staff_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_app_role() in ('superadmin', 'admin'), false)
$$;

create or replace function public.can_write_data() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_app_role() in ('superadmin', 'admin', 'analis'), false)
$$;

create or replace function public.is_active_user() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and aktif)
$$;

alter table public.profiles enable row level security;
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_staff_admin());
-- Tidak ada policy insert/update/delete: perubahan profil hanya lewat server (service role).

create table public.audit_log (
  id bigint generated always as identity primary key,
  waktu timestamptz not null default now(),
  user_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  detail jsonb not null default '{}'::jsonb
);
alter table public.audit_log enable row level security;
create policy audit_select on public.audit_log for select using (public.is_staff_admin());

create table public.shops (
  id uuid primary key default gen_random_uuid(),
  marketplace text not null,
  shop_id text not null,
  nama text not null,
  lokasi text,
  jenis text,
  pengikut integer,
  rating_toko numeric(3,2),
  created_at timestamptz not null default now(),
  unique (marketplace, shop_id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  marketplace text not null,
  item_id text not null,
  shop_ref uuid references public.shops (id) on delete set null,
  nama text not null,
  kategori text,
  url text,
  dipantau boolean not null default false,
  created_at timestamptz not null default now(),
  unique (marketplace, item_id)
);

create table public.snapshots (
  id bigint generated always as identity primary key,
  product_id uuid not null references public.products (id) on delete cascade,
  tanggal date not null,
  harga bigint not null check (harga >= 0),
  harga_coret bigint check (harga_coret >= 0),
  stok integer,
  terjual integer,
  rating numeric(2,1),
  jumlah_ulasan integer,
  flash_sale boolean not null default false,
  unique (product_id, tanggal)
);
create index snapshots_product_tanggal_idx on public.snapshots (product_id, tanggal desc);

create table public.keywords (
  id uuid primary key default gen_random_uuid(),
  marketplace text not null,
  kata text not null,
  kategori text,
  aktif boolean not null default true,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (marketplace, kata)
);

create table public.watchlist (
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  harga_target bigint check (harga_target >= 0),
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.imports (
  id uuid primary key default gen_random_uuid(),
  file_nama text not null,
  sumber text,
  jumlah_baris integer not null default 0,
  diterima integer not null default 0,
  ditolak integer not null default 0,
  catatan text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

-- RLS data riset: semua pengguna aktif boleh membaca; analis ke atas boleh menulis.
do $$
declare t text;
begin
  foreach t in array array['shops', 'products', 'snapshots', 'keywords', 'imports'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select using (public.is_active_user())', t || '_select', t);
    execute format('create policy %I on public.%I for insert with check (public.can_write_data())', t || '_insert', t);
    execute format('create policy %I on public.%I for update using (public.can_write_data()) with check (public.can_write_data())', t || '_update', t);
  end loop;
end $$;

alter table public.watchlist enable row level security;
create policy watchlist_own on public.watchlist for all
  using (user_id = auth.uid() and public.is_active_user())
  with check (user_id = auth.uid() and public.is_active_user());
