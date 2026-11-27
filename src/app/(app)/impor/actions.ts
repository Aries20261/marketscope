'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { normalize, simpanItems, type Item } from '@/lib/riset-ingest';
import { bacaImpor, kolomHilang, MAX_BARIS_IMPOR, MAX_KARAKTER_IMPOR } from '@/lib/impor';

export interface BarisPratinjau { baris: number; produk: string; harga: string; tanggal: string; ok: boolean; alasan?: string }
export interface Pratinjau {
  error?: string;
  total?: number; valid?: number; galat?: number;
  contoh?: BarisPratinjau[];
  hilang?: string[];
}
export interface SimpanState { error?: string; ok?: string }

function hariIni() { return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }); }

function proses(teks: string, namaFile: string): { rows: Record<string, unknown>[]; items: Item[]; hasil: BarisPratinjau[] } | { error: string } {
  if (teks.length > MAX_KARAKTER_IMPOR) return { error: 'File terlalu besar (maks 900 KB).' };
  let rows: Record<string, unknown>[];
  try { rows = bacaImpor(teks, namaFile); } catch (e) { return { error: e instanceof Error ? e.message : 'File tidak dapat dibaca.' }; }
  if (rows.length === 0) return { error: 'File kosong atau tidak ada baris data.' };
  if (rows.length > MAX_BARIS_IMPOR) return { error: `Maksimal ${MAX_BARIS_IMPOR} baris per impor.` };
  const items: Item[] = [];
  const hasil: BarisPratinjau[] = [];
  rows.forEach((r, i) => {
    const n = normalize(r, hariIni());
    const produk = String(r.nama ?? r.produk ?? '').slice(0, 80);
    const base = { baris: i + 1, produk, harga: String(r.harga ?? ''), tanggal: String(r.tanggal ?? '') };
    if (typeof n === 'string') hasil.push({ ...base, ok: false, alasan: n });
    else { items.push(n); hasil.push({ ...base, ok: true }); }
  });
  return { rows, items, hasil };
}

/** Pratinjau: membaca dan memeriksa file tanpa menyimpan apa pun. */
export async function pratinjauImporAction(teks: string, namaFile: string): Promise<Pratinjau> {
  const me = await requireUser();
  if (me.role === 'viewer') return { error: 'Peran viewer tidak dapat mengimpor data.' };
  const p = proses(String(teks ?? ''), String(namaFile ?? ''));
  if ('error' in p) return { error: p.error };
  const valid = p.hasil.filter((h) => h.ok).length;
  return { total: p.rows.length, valid, galat: p.rows.length - valid, hilang: kolomHilang(p.rows),
    contoh: [...p.hasil.filter((h) => !h.ok).slice(0, 5), ...p.hasil.filter((h) => h.ok).slice(0, 5)].sort((a, b) => a.baris - b.baris) };
}

/** Menyimpan baris valid lewat jalur ingest yang sama dengan kolektor (toko, produk, snapshot harian) dan mencatat riwayat impor. */
export async function simpanImporAction(teks: string, namaFile: string): Promise<SimpanState> {
  const me = await requireUser();
  if (me.role === 'viewer') return { error: 'Peran viewer tidak dapat mengimpor data.' };
  const p = proses(String(teks ?? ''), String(namaFile ?? ''));
  if ('error' in p) return { error: p.error };
  if (p.items.length === 0) return { error: 'Tidak ada baris valid untuk disimpan.' };
  const saved = await simpanItems(supabaseAdmin(), p.items);
  if (!saved.ok) return { error: saved.message };
  const ditolak = p.rows.length - p.items.length;
  const sb = await supabaseServer();
  await sb.from('imports').insert({
    file_nama: String(namaFile).slice(0, 200) || 'impor', sumber: 'impor-ui', jumlah_baris: p.rows.length,
    diterima: p.items.length, ditolak, catatan: null, created_by: me.id
  });
  revalidatePath('/impor');
  return { ok: `${p.items.length} baris disimpan${ditolak ? `, ${ditolak} baris dilewati` : ''}.` };
}
