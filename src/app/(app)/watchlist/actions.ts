'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { parseTarget } from '@/lib/watchlist';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Simpan atau hapus produk dari watchlist pengguna. RLS (watchlist_own) membatasi ke milik sendiri. */
export async function toggleWatchlistAction(produkId: string): Promise<{ error?: string; tersimpan?: boolean }> {
  const me = await requireUser();
  if (me.role === 'viewer') return { error: 'Peran viewer tidak dapat memakai watchlist.' };
  if (!UUID.test(produkId)) return { error: 'Produk tidak dikenali.' };
  const sb = await supabaseServer();
  const { data: ada } = await sb.from('watchlist').select('product_id').eq('user_id', me.id).eq('product_id', produkId).maybeSingle();
  if (ada) {
    const { error } = await sb.from('watchlist').delete().eq('user_id', me.id).eq('product_id', produkId);
    if (error) return { error: 'Tidak dapat menghapus dari watchlist.' };
    revalidatePath('/watchlist');
    return { tersimpan: false };
  }
  const { error } = await sb.from('watchlist').insert({ user_id: me.id, product_id: produkId });
  if (error) return { error: 'Tidak dapat menyimpan ke watchlist.' };
  revalidatePath('/watchlist');
  return { tersimpan: true };
}

export async function setTargetAction(fd: FormData): Promise<void> {
  const me = await requireUser();
  const id = String(fd.get('id') ?? '');
  if (me.role === 'viewer' || !UUID.test(id)) return;
  const t = parseTarget(fd.get('target'));
  if (t === undefined) return;
  const sb = await supabaseServer();
  await sb.from('watchlist').update({ harga_target: t }).eq('user_id', me.id).eq('product_id', id);
  revalidatePath('/watchlist');
}

export async function hapusWatchlistAction(fd: FormData): Promise<void> {
  const me = await requireUser();
  const id = String(fd.get('id') ?? '');
  if (!UUID.test(id)) return;
  const sb = await supabaseServer();
  await sb.from('watchlist').delete().eq('user_id', me.id).eq('product_id', id);
  revalidatePath('/watchlist');
}
