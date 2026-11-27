'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { parseCsv } from '@/lib/riset-calc';
import { normalisasiSuplier } from '@/lib/suplier';

export interface SuplierState { error?: string; ok?: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (s: string) => UUID.test(s);
const MAX_BARIS = 500;
const MAX_BYTES = 500_000;

async function izinTulis() {
  const me = await requireUser();
  return me.role === 'viewer' ? null : me;
}

/** Tambah (tanpa id) atau ubah (dengan id) satu suplier. RLS membatasi siapa yang boleh mengubah. */
export async function simpanSuplierAction(_p: SuplierState, fd: FormData): Promise<SuplierState> {
  const me = await izinTulis();
  if (!me) return { error: 'Peran viewer tidak dapat mengubah data suplier.' };
  const raw = Object.fromEntries([...fd.entries()].map(([k, v]) => [k, typeof v === 'string' ? v : '']));
  const n = normalisasiSuplier(raw);
  if (typeof n === 'string') return { error: `Data tidak valid: ${n}.` };
  const sb = await supabaseServer();
  const id = String(raw.id ?? '');
  if (id) {
    if (!isUuid(id)) return { error: 'Suplier tidak ditemukan.' };
    const { data, error } = await sb.from('suplier').update({ ...n, updated_at: new Date().toISOString() }).eq('id', id).select('id');
    if (error || !data?.length) return { error: 'Tidak dapat mengubah suplier ini. Hanya pembuatnya atau admin yang boleh.' };
  } else {
    const { error } = await sb.from('suplier').insert({ ...n, created_by: me.id });
    if (error) return { error: 'Suplier tidak dapat disimpan. Coba lagi.' };
  }
  revalidatePath('/suplier');
  redirect('/suplier');
}

export async function hapusSuplierAction(fd: FormData): Promise<void> {
  const me = await izinTulis();
  const id = String(fd.get('id') ?? '');
  if (!me || !isUuid(id)) return;
  const sb = await supabaseServer();
  await sb.from('suplier').delete().eq('id', id);
  revalidatePath('/suplier');
}

/** Impor CSV (kolom: nama, harga_modal wajib; opsional lokasi, produk, moq, respons, skor, kontak, catatan). */
export async function imporSuplierAction(_p: SuplierState, fd: FormData): Promise<SuplierState> {
  const me = await izinTulis();
  if (!me) return { error: 'Peran viewer tidak dapat mengimpor data suplier.' };
  const file = fd.get('file');
  const text = file instanceof File && file.size > 0 ? await file.text() : String(fd.get('csv') ?? '');
  if (!text.trim()) return { error: 'Pilih file CSV atau tempel isinya.' };
  if (text.length > MAX_BYTES) return { error: 'Isi terlalu besar (maks 500 KB).' };
  const raws = parseCsv(text);
  if (raws.length === 0 || raws.length > MAX_BARIS) return { error: `Kirim 1 sampai ${MAX_BARIS} baris data setelah baris judul.` };

  const rows: (ReturnType<typeof normalisasiSuplier> & object)[] = [];
  const galat: string[] = [];
  raws.forEach((r, i) => {
    const n = normalisasiSuplier(r);
    if (typeof n === 'string') galat.push(`baris ${i + 1}: ${n}`);
    else rows.push(n);
  });
  if (rows.length === 0) return { error: `Tidak ada baris valid. ${galat.slice(0, 3).join('; ')}` };
  const sb = await supabaseServer();
  const { error } = await sb.from('suplier').insert(rows.map((r) => ({ ...r, created_by: me.id })));
  if (error) return { error: 'Impor gagal disimpan. Coba lagi.' };
  revalidatePath('/suplier');
  return { ok: `${rows.length} suplier diimpor${galat.length ? `, ${galat.length} baris dilewati (${galat.slice(0, 3).join('; ')})` : ''}.` };
}
