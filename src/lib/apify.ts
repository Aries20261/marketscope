import 'server-only';
import { requireToken, pesanErrorApify } from '@/lib/env';
import { mapApifyItems, type ApifyShopeeItem, type KolektorRow } from '@/lib/apify-map';

const ACTOR = 'xtracto~shopee-scraper';

export interface KeywordOptions {
  country?: string;
  maxProducts?: number;
  sort?: 'relevancy' | 'sales' | 'newest' | 'price_asc' | 'price_desc';
  minPrice?: number;
  maxPrice?: number;
  fetchDetail?: boolean;
}

/**
 * Menjalankan aktor Apify untuk satu kata kunci dan menunggu hasilnya (run-sync-get-dataset-items).
 * Token dibaca dari APIFY_TOKEN dan hanya dikirim lewat header Authorization.
 */
export async function scrapeShopeeKeyword(
  keyword: string, opts: KeywordOptions = {}, tanggal: string
): Promise<KolektorRow[]> {
  const token = requireToken('APIFY_TOKEN');
  const input: Record<string, unknown> = {
    mode: 'keyword',
    keyword,
    country: opts.country ?? 'id',
    maxProducts: Math.min(Math.max(opts.maxProducts ?? 40, 1), 200)
  };
  if (opts.sort) input.sort = opts.sort;
  if (opts.minPrice != null) input.minPrice = opts.minPrice;
  if (opts.maxPrice != null) input.maxPrice = opts.maxPrice;
  if (opts.fetchDetail) input.fetchDetail = true;

  const res = await fetch(`https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?timeout=240`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(280_000)
  });
  if (res.status === 401) throw new Error('Apify menolak token (HTTP 401): periksa nilai APIFY_TOKEN di Vercel (tanpa tanda kutip atau spasi), lalu redeploy.');
  if (!res.ok) {
    const d = await pesanErrorApify(res);
    const hint = res.status === 400
      ? 'Aktor gagal dijalankan, kemungkinan Shopee memblokir permintaan (cek tab Runs di Apify Console untuk alasannya; biaya run tetap terpakai)'
      : `Apify menolak permintaan (HTTP ${res.status})`;
    throw new Error(`${hint}${d ? `: ${d}` : ''}.`);
  }
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) throw new Error('Format hasil Apify tidak dikenali.');
  return mapApifyItems(data as ApifyShopeeItem[], tanggal, keyword);
}
