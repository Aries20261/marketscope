-- Riset suplier: data diisi manual atau diimpor (CSV), tidak diambil otomatis dari situs suplier.

create table public.suplier (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  lokasi text,
  produk text,
  harga_modal bigint not null check (harga_modal >= 0),
  moq integer check (moq >= 0),
  respons_menit integer check (respons_menit >= 0),
  skor integer check (skor between 0 and 100),
  kontak text,
  catatan text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index suplier_lokasi_idx on public.suplier (lokasi);

alter table public.suplier enable row level security;

-- Semua pengguna aktif membaca. Analis ke atas menambah; mengubah dan menghapus hanya pembuatnya atau admin.
create policy suplier_select on public.suplier for select using (public.is_active_user());
create policy suplier_insert on public.suplier for insert
  with check (public.can_write_data() and created_by = auth.uid());
create policy suplier_update on public.suplier for update
  using (public.can_write_data() and (created_by = auth.uid() or public.is_staff_admin()))
  with check (public.can_write_data() and (created_by = auth.uid() or public.is_staff_admin()));
create policy suplier_delete on public.suplier for delete
  using (public.can_write_data() and (created_by = auth.uid() or public.is_staff_admin()));
