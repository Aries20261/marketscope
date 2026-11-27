-- Riset permintaan: kata kunci + wilayah atau toko, hasil berupa dashboard.

alter table public.products
  add column kota text,
  add column provinsi text,
  add column satuan_harga text,
  add column kategori_riset text;

alter table public.snapshots
  add column terjual_label text,
  add column terjual_exact boolean not null default false;

create type public.riset_status as enum ('antre', 'berjalan', 'selesai', 'gagal');

create table public.riset_permintaan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  judul text not null,
  kata_kunci text[] not null default '{}',
  provinsi text,
  kota text[] not null default '{}',
  toko text[] not null default '{}',
  marketplace text not null default 'Shopee',
  status public.riset_status not null default 'antre',
  catatan text,
  dibuat timestamptz not null default now(),
  selesai timestamptz,
  check (cardinality(kata_kunci) > 0 or cardinality(toko) > 0)
);
create index riset_permintaan_user_idx on public.riset_permintaan (user_id, dibuat desc);

create table public.riset_item (
  request_id uuid not null references public.riset_permintaan (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  primary key (request_id, product_id)
);

alter table public.riset_permintaan enable row level security;
alter table public.riset_item enable row level security;

-- Pengguna membaca permintaannya sendiri; admin membaca semua. Pembuatan hanya untuk analis ke atas
-- dan selalu berstatus antre. Perubahan status dan hasil hanya lewat server (service role).
create policy riset_select on public.riset_permintaan for select
  using (user_id = auth.uid() or public.is_staff_admin());
create policy riset_insert on public.riset_permintaan for insert
  with check (user_id = auth.uid() and status = 'antre' and public.can_write_data());

create policy riset_item_select on public.riset_item for select
  using (exists (
    select 1 from public.riset_permintaan r
    where r.id = request_id and (r.user_id = auth.uid() or public.is_staff_admin())
  ));

-- Penjualan bulanan dari selisih snapshot. Hanya selisih antara dua titik yang sama-sama eksak
-- (bukan "10RB+") yang dihitung. Selisih dicatat pada bulan titik yang lebih baru.
create or replace function public.penjualan_bulanan(p_request uuid)
returns table (bulan date, unit bigint, omzet_min bigint)
language sql stable
set search_path = public
as $$
  with d as (
    select s.tanggal, s.harga,
      s.terjual - lag(s.terjual) over w as delta,
      (s.terjual_exact and lag(s.terjual_exact) over w) as exact
    from public.snapshots s
    join public.riset_item ri on ri.product_id = s.product_id and ri.request_id = p_request
    window w as (partition by s.product_id order by s.tanggal)
  )
  select date_trunc('month', tanggal)::date as bulan,
         sum(delta)::bigint as unit,
         sum(delta * harga)::bigint as omzet_min
  from d
  where delta >= 0 and exact
  group by 1
  order by 1
$$;
