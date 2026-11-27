import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { scrapeShopeeKeyword } from '@/lib/apify';
import { ingestRows } from '@/lib/riset-ingest';
import type { KolektorRow } from '@/lib/apify-map';

/** Apakah pengambilan data lewat Apify aktif (token sudah diisi di environment). */
export const apifyAktif = () => Boolean(process.env.APIFY_TOKEN);

/**
 * Mengambil data Shopee untuk satu permintaan riset lewat aktor Apify, lalu menyimpannya lewat jalur
 * yang sama dengan kolektor (ingestRows) sehingga dashboard dan PDF tidak berubah.
 * Status: antre -> berjalan -> selesai | gagal. Tidak pernah melempar; kegagalan dicatat di `catatan`.
 */
export async function jalankanRisetApify(id: string): Promise<void> {
  const sb = supabaseAdmin();
  const gagal = (catatan: string) => sb.from('riset_permintaan').update({ status: 'gagal', catatan }).eq('id', id);
  try {
    const { data: req } = await sb.from('riset_permintaan').select('kata_kunci,status').eq('id', id).maybeSingle();
    if (!req || req.status !== 'antre') return;
    const kata = (req.kata_kunci ?? []) as string[];
    if (kata.length === 0) { await gagal('Pengambilan lewat Apify membutuhkan kata kunci.'); return; }
    await sb.from('riset_permintaan').update({ status: 'berjalan' }).eq('id', id);

    const tanggal = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    const rows: KolektorRow[] = [];
    const seen = new Set<string>();
    for (const k of kata) {
      for (const r of await scrapeShopeeKeyword(k, { country: 'id', maxProducts: 40 }, tanggal)) {
        if (seen.has(r.item_id)) continue;
        seen.add(r.item_id);
        rows.push(r);
      }
    }
    if (rows.length === 0) { await gagal('Apify tidak mengembalikan produk untuk kata kunci ini.'); return; }

    const res = await ingestRows(id, rows as unknown as Record<string, unknown>[], tanggal);
    if (!res.ok) await gagal(res.message);
  } catch (e) {
    await gagal(e instanceof Error ? e.message.slice(0, 200) : 'Pengambilan data gagal.');
  }
}
