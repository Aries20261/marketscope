import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { parseTerjual } from '@/lib/riset-calc';

export interface Item {
  marketplace: string; shop_id: string; toko: string; item_id: string; produk: string; harga: number; terjual_tampil: string;
  tanggal: string; kota: string | null; provinsi: string | null; kategori: string | null; satuan: string | null;
  rating: number | null; url: string | null; harga_coret: number | null; jumlah_ulasan: number | null; stok: number | null;
}

const s = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);
const nOrNull = (v: unknown) => { const n = Number(v); return v === '' || v == null || !Number.isFinite(n) ? null : n; };

export function normalize(raw: Record<string, unknown>, fallbackDate: string): Item | string {
  const harga = Number(raw.harga);
  const terjual = s(raw.terjual_tampil ?? raw.terjual, 20);
  const tanggal = s(raw.tanggal, 10) || fallbackDate;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) return 'tanggal harus yyyy-MM-dd';
  if (!Number.isFinite(harga) || harga < 0) return 'harga tidak valid';
  // Kosong = sumber tidak menyediakan jumlah terjual (mis. aktor Apify). Isi yang tidak terbaca tetap ditolak.
  if (terjual && !parseTerjual(terjual)) return 'terjual_tampil tidak terbaca';
  const item_id = s(raw.item_id, 40), shop_id = s(raw.shop_id, 40);
  if (!item_id || !shop_id) return 'item_id dan shop_id wajib';
  const produk = s(raw.produk ?? raw.nama, 200);
  if (!produk) return 'produk wajib';
  return {
    marketplace: s(raw.marketplace, 30) || 'Shopee', shop_id, toko: s(raw.toko, 120) || shop_id, item_id, produk, harga: Math.round(harga),
    terjual_tampil: terjual, tanggal, kota: s(raw.kota, 80) || null, provinsi: s(raw.provinsi, 60) || null,
    kategori: s(raw.kategori, 60) || null, satuan: s(raw.satuan, 60) || null, rating: nOrNull(raw.rating),
    url: s(raw.url, 300) || null,
    harga_coret: nOrNull(raw.harga_coret) === null ? null : Math.max(0, Math.round(Number(raw.harga_coret))),
    jumlah_ulasan: nOrNull(raw.jumlah_ulasan) === null ? null : Math.max(0, Math.round(Number(raw.jumlah_ulasan))),
    stok: nOrNull(raw.stok) === null ? null : Math.max(0, Math.round(Number(raw.stok)))
  };
}


type Sb = ReturnType<typeof supabaseAdmin>;

/** Menyimpan toko, produk, dan snapshot harian dari baris yang sudah dinormalisasi. */
export async function simpanItems(sb: Sb, items: Item[]):
  Promise<{ ok: true; prodRows: { id: string; marketplace: string; item_id: string }[] } | { ok: false; message: string }> {
  // Toko -> produk -> snapshot -> tautan ke permintaan.
  const shops = new Map<string, Item>();
  items.forEach((i) => shops.set(`${i.marketplace}|${i.shop_id}`, i));
  const { data: shopRows, error: e1 } = await sb.from('shops').upsert(
    [...shops.values()].map((i) => ({ marketplace: i.marketplace, shop_id: i.shop_id, nama: i.toko, lokasi: i.kota })),
    { onConflict: 'marketplace,shop_id' }
  ).select('id,marketplace,shop_id');
  if (e1 || !shopRows) return { ok: false, message: 'Gagal menyimpan toko.' };
  const shopRef = new Map(shopRows.map((r: { id: string; marketplace: string; shop_id: string }) => [`${r.marketplace}|${r.shop_id}`, r.id]));

  const prods = new Map<string, Item>();
  items.forEach((i) => prods.set(`${i.marketplace}|${i.item_id}`, i));
  const { data: prodRows, error: e2 } = await sb.from('products').upsert(
    [...prods.values()].map((i) => ({
      marketplace: i.marketplace, item_id: i.item_id, shop_ref: shopRef.get(`${i.marketplace}|${i.shop_id}`), nama: i.produk,
      kategori_riset: i.kategori, kota: i.kota, provinsi: i.provinsi, satuan_harga: i.satuan, url: i.url
    })),
    { onConflict: 'marketplace,item_id' }
  ).select('id,marketplace,item_id');
  if (e2 || !prodRows) return { ok: false, message: 'Gagal menyimpan produk.' };
  const prodRef = new Map(prodRows.map((r: { id: string; marketplace: string; item_id: string }) => [`${r.marketplace}|${r.item_id}`, r.id]));

  const snaps = items.map((i) => {
    const t = i.terjual_tampil ? parseTerjual(i.terjual_tampil) : null;
    return {
      product_id: prodRef.get(`${i.marketplace}|${i.item_id}`), tanggal: i.tanggal, harga: i.harga, terjual: t?.min ?? null,
      terjual_label: t ? i.terjual_tampil : null, terjual_exact: t?.exact ?? false, rating: i.rating,
      harga_coret: i.harga_coret, jumlah_ulasan: i.jumlah_ulasan, stok: i.stok
    };
  });
  const { error: e3 } = await sb.from('snapshots').upsert(snaps, { onConflict: 'product_id,tanggal' });
  if (e3) return { ok: false, message: 'Gagal menyimpan snapshot.' };

  return { ok: true, prodRows };
}

export type IngestResult =
  | { ok: true; diterima: number; ditolak: number; errors: { baris: number; alasan: string }[] }
  | { ok: false; code: 'NOT_FOUND' | 'VALIDATION' | 'SERVER_ERROR'; message: string; errors?: { baris: number; alasan: string }[] };

/** Menyimpan baris hasil kolektor (toko, produk, snapshot) untuk satu permintaan riset dan menandainya selesai. */
export async function ingestRows(id: string, raws: Record<string, unknown>[], date: string): Promise<IngestResult> {
  const items: Item[] = [];
  const errors: { baris: number; alasan: string }[] = [];
  raws.forEach((r, i) => {
    const n = normalize(r, date);
    if (typeof n === 'string') errors.push({ baris: i + 1, alasan: n });
    else items.push(n);
  });

  const sb = supabaseAdmin();
  const { data: reqRow } = await sb.from('riset_permintaan').select('id,marketplace').eq('id', id).maybeSingle();
  if (!reqRow) return { ok: false, code: 'NOT_FOUND', message: 'Permintaan tidak ditemukan.' };
  if (items.length === 0) {
    await sb.from('riset_permintaan').update({ status: 'gagal', catatan: 'Tidak ada baris valid.' }).eq('id', id);
    return { ok: false, code: 'VALIDATION', message: 'Tidak ada baris valid.', errors: errors.slice(0, 20) };
  }

  const saved = await simpanItems(sb, items);
  if (!saved.ok) return { ok: false, code: 'SERVER_ERROR', message: saved.message };
  const prodRows = saved.prodRows;

  await sb.from('riset_item').upsert(prodRows.map((r: { id: string }) => ({ request_id: id, product_id: r.id })), { onConflict: 'request_id,product_id' });
  await sb.from('riset_permintaan').update({ status: 'selesai', selesai: new Date().toISOString(), catatan: errors.length ? `${errors.length} baris dilewati.` : null }).eq('id', id);
  await sb.from('audit_log').insert({ action: 'riset.ingest', entity: 'riset_permintaan', entity_id: id, detail: { diterima: items.length, ditolak: errors.length } });

  return { ok: true, diterima: items.length, ditolak: errors.length, errors: errors.slice(0, 20) };
}
