import 'server-only';
import { supabaseServer } from '@/lib/supabase/server';
import { buildDashboard, type Dashboard, type MonthlySales, type RisetRow } from '@/lib/riset-calc';

export interface RisetRequest {
  id: string; judul: string; kata_kunci: string[]; provinsi: string | null; kota: string[]; toko: string[];
  marketplace: string; status: 'antre' | 'berjalan' | 'selesai' | 'gagal'; catatan: string | null; dibuat: string; selesai: string | null;
}

function chunk<T>(xs: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n));
  return out;
}

/** Membaca permintaan riset milik pengguna (RLS memastikan hak akses) dan menyusun dashboard-nya. */
export async function loadRiset(id: string): Promise<{ req: RisetRequest; dash: Dashboard; monthly: MonthlySales[] } | null> {
  const sb = await supabaseServer();
  const { data: req } = await sb.from('riset_permintaan').select('*').eq('id', id).maybeSingle();
  if (!req) return null;

  const { data: items } = await sb.from('riset_item').select('product_id').eq('request_id', id).limit(2000);
  const ids = (items ?? []).map((i: { product_id: string }) => i.product_id);

  type P = { id: string; nama: string; kategori_riset: string | null; kota: string | null; satuan_harga: string | null; shop: { nama: string; kota: string | null } | { nama: string; kota: string | null }[] | null };
  type S = { product_id: string; tanggal: string; harga: number; terjual: number | null; terjual_label: string | null; rating: number | null };
  const products: P[] = [];
  const snaps: S[] = [];
  for (const part of chunk(ids, 150)) {
    const { data: p } = await sb.from('products').select('id,nama,kategori_riset,kota,satuan_harga,shop:shops(nama,kota)').in('id', part);
    products.push(...((p ?? []) as unknown as P[]));
    const { data: s } = await sb.from('snapshots').select('product_id,tanggal,harga,terjual,terjual_label,rating')
      .in('product_id', part).order('tanggal', { ascending: false }).limit(5000);
    snaps.push(...((s ?? []) as S[]));
  }
  const latest = new Map<string, S>();
  for (const s of snaps) if (!latest.has(s.product_id)) latest.set(s.product_id, s);

  const rows: RisetRow[] = [];
  for (const p of products) {
    const s = latest.get(p.id);
    if (!s) continue;
    const shop = Array.isArray(p.shop) ? p.shop[0] : p.shop;
    rows.push({
      id: p.id, nama: p.nama, toko: shop?.nama ?? 'Tidak diketahui', kota: p.kota ?? shop?.kota ?? null,
      kategori: p.kategori_riset, harga: Number(s.harga), terjualLabel: s.terjual_label ?? String(s.terjual ?? ''),
      rating: s.rating === null ? null : Number(s.rating), satuan: p.satuan_harga
    });
  }

  const { data: m } = await sb.rpc('penjualan_bulanan', { p_request: id });
  const monthly: MonthlySales[] = ((m ?? []) as { bulan: string; unit: number; omzet_min: number }[])
    .map((r) => ({ bulan: String(r.bulan).slice(0, 7), unit: Number(r.unit), omzet: Number(r.omzet_min) }));

  return { req: req as RisetRequest, dash: buildDashboard(rows), monthly };
}
