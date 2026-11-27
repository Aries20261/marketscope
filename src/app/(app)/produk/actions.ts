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

export interface UlasanState {
  error?: string;
  jumlahUlasan?: number;
  tema?: { nama: string; perProduk: number[]; total: number }[];
}



/** Langkah 3: tarik ulasan bintang 1 untuk produk terlaris (aktor Apify berbayar per ulasan), lalu kelompokkan per tema keluhan. */
export async function tarikUlasanAction(produk: { key: string; url: string | null }[]): Promise<UlasanState> {
  const me = await requireUser();
  if (me.role === 'viewer') return { error: 'Peran viewer tidak dapat menarik ulasan.' };
  if (!apifyAktif()) return { error: 'Pengambilan data belum aktif: APIFY_TOKEN belum diisi di server.' };
  const { ambilUlasanBintang1, urlProdukValid } = await import('@/lib/apify-ulasan');
  const { analisisTema, MAKS_ULASAN_PER_PRODUK } = await import('@/lib/ulasan-map');
  const valid = (produk ?? []).filter((p) => p && typeof p.url === 'string' && urlProdukValid(p.url)).slice(0, 5);
  if (valid.length === 0) return { error: 'Tidak ada produk dengan tautan Shopee yang valid.' };
  try {
    const ulasan = await ambilUlasanBintang1(valid.map((p) => p.url as string), MAKS_ULASAN_PER_PRODUK);
    if (ulasan.length === 0) return { error: 'Sumber tidak mengembalikan ulasan bintang 1 untuk produk ini. Aktor ulasan kadang kosong; coba lagi nanti.' };
    const h = analisisTema(ulasan, valid.map((p) => p.key));
    return { jumlahUlasan: h.jumlahUlasan, tema: h.tema };
  } catch (e) {
    return { error: e instanceof Error ? e.message.slice(0, 200) : 'Penarikan ulasan gagal. Coba lagi.' };
  }
}
