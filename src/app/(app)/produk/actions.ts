'use server';

import { requireUser } from '@/lib/session';
import { apifyAktif } from '@/lib/riset-apify';
import { terlarisShopee, type HasilCari } from '@/lib/cari';

export interface ProdukState { error?: string; kata?: string; terlaris?: HasilCari[] }

/** Langkah 1 alur Buat produk: ambil produk terlaris Shopee untuk satu kata kunci (Apify, urutan penjualan). */
export async function ambilTerlarisAction(kata: string): Promise<ProdukState> {
  const me = await requireUser();
  if (me.role === 'viewer') return { error: 'Peran viewer tidak dapat menjalankan pengambilan data.' };
  const k = String(kata ?? '').trim().toLowerCase().slice(0, 80);
  if (!k) return { error: 'Ketik kata kunci produk dulu.' };
  if (!apifyAktif()) return { error: 'Pengambilan data belum aktif: APIFY_TOKEN belum diisi di server.' };
  try {
    const terlaris = await terlarisShopee(k, 5);
    if (terlaris.length === 0) return { error: 'Sumber tidak mengembalikan produk untuk kata kunci ini.' };
    return { kata: k, terlaris };
  } catch (e) {
    return { error: e instanceof Error ? e.message.slice(0, 200) : 'Pengambilan data gagal. Coba lagi.' };
  }
}
