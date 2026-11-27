-- Aturan peringatan Pemantauan per pengguna. Stok dan flash sale belum disimpan karena sumber data (Apify) tidak menyediakannya.

create table public.aturan_pantau (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  turun_persen integer not null default 8 check (turun_persen between 1 and 90),
  updated_at timestamptz not null default now()
);

alter table public.aturan_pantau enable row level security;
create policy aturan_pantau_own on public.aturan_pantau for all
  using (user_id = auth.uid() and public.is_active_user())
  with check (user_id = auth.uid() and public.is_active_user());
