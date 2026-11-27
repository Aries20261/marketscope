'use server';

import { requireUser } from '@/lib/session';
import { apifyAktif } from '@/lib/riset-apify';
import { cariShopee, MAX_KATA, type HasilCari } from '@/lib/cari';

export interface CariState { error?: string; hasil?: HasilCari[]; kata?: string[] }

export async function cariAction(kata: string[]): Promise<CariState> {
  const me = await requireUser();
  if (me.role === 'viewer') return { error: 'Peran viewer tidak dapat menjalankan pencarian.' };
  const bersih = [...new Set(kata.map((k) => String(k).trim().toLowerCase().slice(0, 80)).filter(Boolean))].slice(0, MAX_KATA);
  if (bersih.length === 0) return { error: 'Tambahkan minimal satu kata kunci.' };
  if (!apifyAktif()) return { error: 'Pencarian belum aktif: APIFY_TOKEN belum diisi di server.' };
  try {
    return { hasil: await cariShopee(bersih), kata: bersih };
  } catch (e) {
    return { error: e instanceof Error ? e.message.slice(0, 200) : 'Pencarian gagal. Coba lagi.' };
  }
}
