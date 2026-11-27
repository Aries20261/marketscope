'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';

export interface AturanState { error?: string; ok?: string }

export async function simpanAturanAction(_p: AturanState, fd: FormData): Promise<AturanState> {
  const me = await requireUser();
  if (me.role === 'viewer') return { error: 'Peran viewer tidak dapat menyimpan aturan.' };
  const n = Number(String(fd.get('turun_persen') ?? '').trim().replace(',', '.'));
  if (!Number.isInteger(n) || n < 1 || n > 90) return { error: 'Isi persen penurunan dengan bilangan bulat 1 sampai 90.' };
  const sb = await supabaseServer();
  const { error } = await sb.from('aturan_pantau').upsert({ user_id: me.id, turun_persen: n, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) return { error: 'Aturan belum bisa disimpan. Pastikan migrasi 0004_aturan_pantau sudah dijalankan di Supabase.' };
  revalidatePath('/pantau');
  return { ok: 'Aturan disimpan.' };
}
