'use server';

import { requireUser } from '@/lib/session';
import { apifyAktif } from '@/lib/riset-apify';
import { cariShopee } from '@/lib/cari';
import { analisisKata, type AnalisisKata } from '@/lib/riset-calc';

export interface AnalisisState { error?: string; kata?: string; hasil?: AnalisisKata }

/** Analisis cepat satu kata kunci dari hasil pencarian Shopee (Apify). Hasil ikut disimpan sebagai snapshot harga. */
export async function analisisAction(kata: string): Promise<AnalisisState> {
  const me = await requireUser();
  if (me.role === 'viewer') return { error: 'Peran viewer tidak dapat menjalankan analisis.' };
  const k = String(kata ?? '').trim().toLowerCase().slice(0, 80);
  if (!k) return { error: 'Ketik kata kunci dulu.' };
  if (!apifyAktif()) return { error: 'Analisis belum aktif: APIFY_TOKEN belum diisi di server.' };
  try {
    const rows = await cariShopee([k]);
    const hasil = analisisKata(rows);
    if (!hasil) return { error: 'Sumber tidak mengembalikan produk untuk kata kunci ini.' };
    return { kata: k, hasil };
  } catch (e) {
    return { error: e instanceof Error ? e.message.slice(0, 200) : 'Analisis gagal. Coba lagi.' };
  }
}
