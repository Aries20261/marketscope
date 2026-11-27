import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { parseCsv } from '@/lib/riset-calc';
import { ingestRows } from '@/lib/riset-ingest';

export const runtime = 'nodejs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BYTES = 1_000_000;
const MAX_ROWS = 1000;

function keyOk(header: string | null): boolean {
  const expected = process.env.INGEST_API_KEY;
  if (!expected || !header?.startsWith('Bearer ')) return false;
  const a = Buffer.from(header.slice(7));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
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

  const r = await ingestRows(id, raws, date);
  if (r.ok) return NextResponse.json({ ok: true, data: { diterima: r.diterima, ditolak: r.ditolak, errors: r.errors } });
  const status = r.code === 'NOT_FOUND' ? 404 : r.code === 'VALIDATION' ? 400 : 500;
  return NextResponse.json({ ok: false, code: r.code, message: r.message, errors: r.errors }, { status });
}
