'use server';

import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';

export interface RisetFormState { error?: string }

const list = (v: FormDataEntryValue | null, max: number) =>
  String(v ?? '').split(/[,\n]/).map((x) => x.trim()).filter(Boolean).map((x) => x.slice(0, 80)).slice(0, max);

export async function createRisetAction(_p: RisetFormState, fd: FormData): Promise<RisetFormState> {
  const me = await requireUser();
  if (me.role === 'viewer') return { error: 'Peran viewer tidak dapat membuat permintaan.' };

  const kata = list(fd.get('kata_kunci'), 10);
  const toko = list(fd.get('toko'), 10);
  const kota = list(fd.get('kota'), 10);
  const provinsi = String(fd.get('provinsi') ?? '').trim().slice(0, 60) || null;
  if (kata.length === 0 && toko.length === 0) return { error: 'Isi minimal satu kata kunci atau satu nama toko.' };
  const judul = String(fd.get('judul') ?? '').trim().slice(0, 120) || [...kata, ...toko].join(', ').slice(0, 120);

  const sb = await supabaseServer();
  const { data, error } = await sb
    .from('riset_permintaan')
    .insert({ user_id: me.id, judul, kata_kunci: kata, toko, kota, provinsi, marketplace: 'Shopee', status: 'antre' })
    .select('id')
    .single();
  if (error || !data) return { error: 'Permintaan tidak dapat disimpan. Coba lagi.' };
  redirect(`/riset/${data.id}`);
}
