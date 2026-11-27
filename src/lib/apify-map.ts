// Pemetaan murni hasil aktor Apify `xtracto/shopee-scraper` (mode keyword) ke baris kolektor MarketScope.
// Tanpa dependensi supaya bisa diuji di tests/apify-map.test.ts.

export interface ApifyShopeeItem {
  shop_id?: number | string | null;
  item_id?: number | string | null;
  name?: string | null;
  title?: string | null;
  url?: string | null;
  price?: number | string | null;
  original_price?: number | string | null;
  rating_count?: number | string | null;
  rating?: number | string | null;
  rating_star?: number | string | null;
  sold_count?: number | string | null;
  location?: string | null;
  shop_location?: string | null;
  shop?: { name?: string | null; location?: string | null } | null;
}

export interface KolektorRow {
  marketplace: 'Shopee';
  shop_id: string;
  toko: string;
  item_id: string;
  produk: string;
  harga: number;
  harga_coret: number | null;
  jumlah_ulasan: number | null;
  terjual_tampil: string;
  tanggal: string;
  kota: string | null;
  kategori: string | null;
  rating: number | null;
  url: string | null;
}

const present = (v: unknown) => v !== null && v !== undefined && String(v).trim() !== '';

/**
 * Aktor tidak lagi mengirim jumlah terjual, stok, dan statistik penjual. Jika `sold_count` kosong,
 * `terjual_tampil` dikosongkan (bukan 0) agar dashboard tidak menghitung omzet palsu.
 */
export function mapApifyItem(raw: ApifyShopeeItem, tanggal: string, kategori: string | null): KolektorRow | null {
  const shop_id = present(raw.shop_id) ? String(raw.shop_id) : '';
  const item_id = present(raw.item_id) ? String(raw.item_id) : '';
  const produk = String(raw.name ?? raw.title ?? '').trim();
  const harga = present(raw.price) ? Number(raw.price) : NaN;
  if (!shop_id || !item_id || !produk || !Number.isFinite(harga) || harga < 0) return null;
  const rating = Number(raw.rating ?? raw.rating_star);
  const coret = present(raw.original_price) ? Number(raw.original_price) : NaN;
  const ulasan = present(raw.rating_count) ? Number(raw.rating_count) : NaN;
  return {
    marketplace: 'Shopee',
    shop_id,
    toko: String(raw.shop?.name ?? '').trim() || `Toko ${shop_id}`,
    item_id,
    produk,
    harga,
    harga_coret: Number.isFinite(coret) && coret >= 0 ? Math.round(coret) : null,
    jumlah_ulasan: Number.isFinite(ulasan) && ulasan >= 0 ? Math.round(ulasan) : null,
    terjual_tampil: present(raw.sold_count) ? String(raw.sold_count) : '',
    tanggal,
    kota: String(raw.location ?? raw.shop_location ?? raw.shop?.location ?? '').trim() || null,
    kategori,
    rating: present(raw.rating ?? raw.rating_star) && Number.isFinite(rating) ? rating : null,
    url: present(raw.url) ? String(raw.url) : null
  };
}

export function mapApifyItems(items: ApifyShopeeItem[], tanggal: string, kategori: string | null): KolektorRow[] {
  const seen = new Set<string>();
  const out: KolektorRow[] = [];
  for (const it of items) {
    const r = mapApifyItem(it, tanggal, kategori);
    if (!r || seen.has(r.item_id)) continue;
    seen.add(r.item_id);
    out.push(r);
  }
  return out;
}
