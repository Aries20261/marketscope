import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { parseCsv, parseTerjual } from '@/lib/riset-calc';

export const runtime = 'nodejs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BYTES = 1_000_000;
const MAX_ROWS = 1000;

interface Item {
  marketplace: string; shop_id: string; toko: string; item_id: string; produk: string; harga: number; terjual_tampil: string;
  tanggal: string; kota: string | null; provinsi: string | null; kategori: string | null; satuan: string | null;
  rating: number | null; url: string | null;
}

function keyOk(header: string | null): boolean {
  const expected = process.env.INGEST_API_KEY;
  if (!expected || !header?.startsWith('Bearer ')) return false;
  const a = Buffer.from(header.slice(7));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

const s = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);
const nOrNull = (v: unknown) => { const n = Number(v); return v === '' || v == null || !Number.isFinite(n) ? null : n; };

function normalize(raw: Record<string, unknown>, fallbackDate: string): Item | string {
  const harga = Number(raw.harga);
  const terjual = s(raw.terjual_tampil ?? raw.terjual, 20);
  const tanggal = s(raw.tanggal, 10) || fallbackDate;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) return 'tanggal harus yyyy-MM-dd';
  if (!Number.isFinite(harga) || harga < 0) return 'harga tidak valid';
  if (!parseTerjual(terjual)) return 'terjual_tampil tidak terbaca';
  const item_id = s(raw.item_id, 40), shop_id = s(raw.shop_id, 40);
  if (!item_id || !shop_id) return 'item_id dan shop_id wajib';
  const produk = s(raw.produk ?? raw.nama, 200);
  if (!produk) return 'produk wajib';
  return {
    marketplace: s(raw.marketplace, 30) || 'Shopee', shop_id, toko: s(raw.toko, 120) || shop_id, item_id, produk, harga: Math.round(harga),
    terjual_tampil: terjual, tanggal, kota: s(raw.kota, 80) || null, provinsi: s(raw.provinsi, 60) || null,
    kategori: s(raw.kategori, 60) || null, satuan: s(raw.satuan, 60) || null, rating: nOrNull(raw.rating),
    url: s(raw.url, 300) || null
  };
}

/**
 * Menerima hasil kolektor untuk satu permintaan riset.
 * Auth: header `Authorization: Bearer <INGEST_API_KEY>`.
 * Isi: JSON `{ "tanggal": "yyyy-MM-dd", "items": [...] }` atau CSV (kolom: tanggal,toko,shop_id,item_id,produk,harga,terjual_tampil,
 * opsional kota,provinsi,kategori,satuan,rating,marketplace,url).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!keyOk(req.headers.get('authorization'))) return NextResponse.json({ ok: false, code: 'UNAUTHORIZED', message: 'Kunci tidak valid.' }, { status: 401 });
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Permintaan tidak ditemukan.' }, { status: 404 });

  const text = await req.text();
  if (text.length > MAX_BYTES) return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'Isi terlalu besar (maks 1 MB).' }, { status: 413 });

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  let raws: Record<string, unknown>[];
  let date = today;
  try {
    if ((req.headers.get('content-type') ?? '').includes('json')) {
      const body = JSON.parse(text) as { tanggal?: string; items?: Record<string, unknown>[] };
      raws = Array.isArray(body.items) ? body.items : [];
      if (body.tanggal) date = String(body.tanggal);
    } else raws = parseCsv(text);
  } catch {
    return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'Isi tidak dapat dibaca.' }, { status: 400 });
  }
  if (raws.length === 0 || raws.length > MAX_ROWS) return NextResponse.json({ ok: false, code: 'VALIDATION', message: `Kirim 1 sampai ${MAX_ROWS} baris.` }, { status: 400 });

  const items: Item[] = [];
  const errors: { baris: number; alasan: string }[] = [];
  raws.forEach((r, i) => {
    const n = normalize(r, date);
    if (typeof n === 'string') errors.push({ baris: i + 1, alasan: n });
    else items.push(n);
  });

  const sb = supabaseAdmin();
  const { data: reqRow } = await sb.from('riset_permintaan').select('id,marketplace').eq('id', id).maybeSingle();
  if (!reqRow) return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Permintaan tidak ditemukan.' }, { status: 404 });
  if (items.length === 0) {
    await sb.from('riset_permintaan').update({ status: 'gagal', catatan: 'Tidak ada baris valid.' }).eq('id', id);
    return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'Tidak ada baris valid.', errors: errors.slice(0, 20) }, { status: 400 });
  }

  // Toko -> produk -> snapshot -> tautan ke permintaan.
  const shops = new Map<string, Item>();
  items.forEach((i) => shops.set(`${i.marketplace}|${i.shop_id}`, i));
  const { data: shopRows, error: e1 } = await sb.from('shops').upsert(
    [...shops.values()].map((i) => ({ marketplace: i.marketplace, shop_id: i.shop_id, nama: i.toko, lokasi: i.kota })),
    { onConflict: 'marketplace,shop_id' }
  ).select('id,marketplace,shop_id');
  if (e1 || !shopRows) return NextResponse.json({ ok: false, code: 'SERVER_ERROR', message: 'Gagal menyimpan toko.' }, { status: 500 });
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
  if (e2 || !prodRows) return NextResponse.json({ ok: false, code: 'SERVER_ERROR', message: 'Gagal menyimpan produk.' }, { status: 500 });
  const prodRef = new Map(prodRows.map((r: { id: string; marketplace: string; item_id: string }) => [`${r.marketplace}|${r.item_id}`, r.id]));

  const snaps = items.map((i) => {
    const t = parseTerjual(i.terjual_tampil)!;
    return {
      product_id: prodRef.get(`${i.marketplace}|${i.item_id}`), tanggal: i.tanggal, harga: i.harga, terjual: t.min,
      terjual_label: i.terjual_tampil, terjual_exact: t.exact, rating: i.rating
    };
  });
  const { error: e3 } = await sb.from('snapshots').upsert(snaps, { onConflict: 'product_id,tanggal' });
  if (e3) return NextResponse.json({ ok: false, code: 'SERVER_ERROR', message: 'Gagal menyimpan snapshot.' }, { status: 500 });

  await sb.from('riset_item').upsert(prodRows.map((r: { id: string }) => ({ request_id: id, product_id: r.id })), { onConflict: 'request_id,product_id' });
  await sb.from('riset_permintaan').update({ status: 'selesai', selesai: new Date().toISOString(), catatan: errors.length ? `${errors.length} baris dilewati.` : null }).eq('id', id);
  await sb.from('audit_log').insert({ action: 'riset.ingest', entity: 'riset_permintaan', entity_id: id, detail: { diterima: items.length, ditolak: errors.length } });

  return NextResponse.json({ ok: true, data: { diterima: items.length, ditolak: errors.length, errors: errors.slice(0, 20) } });
}
