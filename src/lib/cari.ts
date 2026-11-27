import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { scrapeShopeeKeyword } from '@/lib/apify';
import { normalize, simpanItems, type Item } from '@/lib/riset-ingest';
import type { KolektorRow } from '@/lib/apify-map';

export interface HasilCari {
  key: string;
  kata: string;
  nama: string;
  toko: string;
  kota: string | null;
  harga: number;
  hargaCoret: number | null;
  ulasan: number | null;
  rating: number | null;
  url: string | null;
  /** Harga per tanggal pengambilan (terlama ke terbaru), maksimal 30 titik. */
  riwayat: { tanggal: string; harga: number }[];
}

export const MAX_KATA = 4;
export const MAX_PRODUK = 40;

function chunk<T>(xs: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n));
  return out;
}

/**
 * Pencarian Shopee langsung lewat Apify untuk beberapa kata kunci, hasilnya disimpan sebagai snapshot harian
 * (membentuk riwayat harga dari pencarian berulang) dan dikembalikan beserta riwayatnya.
 */
export async function cariShopee(kataKunci: string[], opts: { sort?: 'sales'; maxProducts?: number } = {}): Promise<HasilCari[]> {
  const tanggal = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  const kata = kataKunci.slice(0, MAX_KATA);
  const perKata = await Promise.all(kata.map((k) => scrapeShopeeKeyword(k, { country: 'id', maxProducts: opts.maxProducts ?? MAX_PRODUK, sort: opts.sort }, tanggal)));

  const byItem = new Map<string, { row: KolektorRow; kata: string }>();
  perKata.forEach((rows, i) => rows.forEach((r) => { if (!byItem.has(r.item_id)) byItem.set(r.item_id, { row: r, kata: kata[i] }); }));

  const items: Item[] = [];
  for (const { row } of byItem.values()) {
    const n = normalize(row as unknown as Record<string, unknown>, tanggal);
    if (typeof n !== 'string') items.push(n);
  }
  if (items.length === 0) return [];

  const sb = supabaseAdmin();
  const saved = await simpanItems(sb, items);
  if (!saved.ok) throw new Error(saved.message);
  const idByItem = new Map(saved.prodRows.map((p) => [p.item_id, p.id]));

  const hist = new Map<string, { tanggal: string; harga: number }[]>();
  const ids = [...idByItem.values()];
  for (const part of chunk(ids, 150)) {
    const { data } = await sb.from('snapshots').select('product_id,tanggal,harga').in('product_id', part).order('tanggal', { ascending: true }).limit(5000);
    for (const s of (data ?? []) as { product_id: string; tanggal: string; harga: number }[]) {
      const arr = hist.get(s.product_id) ?? [];
      arr.push({ tanggal: s.tanggal, harga: Number(s.harga) });
      hist.set(s.product_id, arr);
    }
  }

  return items.map((i) => {
    const pid = idByItem.get(i.item_id);
    return {
      key: i.item_id, kata: byItem.get(i.item_id)?.kata ?? '', nama: i.produk, toko: i.toko, kota: i.kota, harga: i.harga, hargaCoret: i.harga_coret && i.harga_coret > i.harga ? i.harga_coret : null, ulasan: i.jumlah_ulasan,
      rating: i.rating, url: i.url, riwayat: ((pid && hist.get(pid)) || []).slice(-30)
    };
  });
}

/** Produk terlaris untuk satu kata kunci (urutan penjualan dari Shopee lewat aktor Apify), diambil n teratas. */
export async function terlarisShopee(kata: string, n = 5): Promise<HasilCari[]> {
  return (await cariShopee([kata], { sort: 'sales', maxProducts: 20 })).slice(0, n);
}
