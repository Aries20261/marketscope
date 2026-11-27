import 'server-only';
import { requireToken, pesanErrorApify } from '@/lib/env';
import type { Ulasan } from '@/lib/ulasan-map';

const ACTOR = 'zen-studio~shopee-product-reviews-scraper';
const URL_SHOPEE = /^https:\/\/shopee\.co\.id\/[^\s]*-i\.\d+\.\d+/;

/** Hanya URL produk Shopee Indonesia yang diterima, agar aktor berbayar tidak bisa diarahkan ke alamat lain. */
export const urlProdukValid = (u: string) => URL_SHOPEE.test(u);

/**
 * Menarik ulasan bintang 1 (dengan komentar) untuk beberapa produk lewat aktor Apify berbayar per ulasan
 * (sekitar US$3,99 per 1.000 ulasan pada paket Free). Token dari APIFY_TOKEN.
 */
export async function ambilUlasanBintang1(urls: string[], maksPerProduk: number): Promise<Ulasan[]> {
  const token = requireToken('APIFY_TOKEN');
  const aman = urls.filter(urlProdukValid).slice(0, 5);
  if (aman.length === 0) throw new Error('Tidak ada URL produk Shopee yang valid.');
  const res = await fetch(`https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?timeout=240`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({
      startUrls: aman.map((url) => ({ url })),
      maxReviewsPerProduct: Math.min(Math.max(maksPerProduk, 1), 100),
      starFilter: '1',
      contentFilter: 'with comments'
    }),
    signal: AbortSignal.timeout(280_000)
  });
  if (!res.ok) { const d = await pesanErrorApify(res); throw new Error(`Apify menolak permintaan ulasan (HTTP ${res.status})${d ? `: ${d}` : ""}.`); }
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) throw new Error('Format hasil Apify tidak dikenali.');
  return (data as Record<string, unknown>[])
    .filter((d) => d && d.itemId !== undefined && typeof d.comment === 'string')
    .map((d) => ({ itemId: String(d.itemId), comment: String(d.comment) }));
}
