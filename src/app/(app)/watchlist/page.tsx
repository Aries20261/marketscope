import Link from 'next/link';
import type { Metadata } from 'next';
import { requireUser } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { statusTarget } from '@/lib/watchlist';
import { setTargetAction, hapusWatchlistAction } from './actions';

export const metadata: Metadata = { title: 'Watchlist' };

const rp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
type Shop = { nama: string } | { nama: string }[] | null;
interface Row {
  product_id: string; harga_target: number | null;
  product: { id: string; nama: string; url: string | null; shop: Shop } | { id: string; nama: string; url: string | null; shop: Shop }[] | null;
}
const first = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v);

export default async function WatchlistPage() {
  await requireUser();
  const sb = await supabaseServer();
  const { data } = await sb.from('watchlist')
    .select('product_id,harga_target,product:products(id,nama,url,shop:shops(nama))')
    .order('created_at', { ascending: false }).limit(300);
  const rows = (data ?? []) as unknown as Row[];

  const ids = rows.map((r) => r.product_id);
  const last = new Map<string, { harga: number; tanggal: string; awal: number }>();
  if (ids.length) {
    const { data: snaps } = await sb.from('snapshots').select('product_id,harga,tanggal').in('product_id', ids).order('tanggal', { ascending: false }).limit(5000);
    for (const s of (snaps ?? []) as { product_id: string; harga: number; tanggal: string }[]) {
      const cur = last.get(s.product_id);
      if (!cur) last.set(s.product_id, { harga: Number(s.harga), tanggal: s.tanggal, awal: Number(s.harga) });
      else cur.awal = Number(s.harga); // snapshot terlama di antara yang terbaca
    }
  }

  const tercapai = rows.filter((r) => statusTarget(last.get(r.product_id)?.harga ?? null, r.harga_target) === 'tercapai').length;

  return (
    <>
      <div className="pagehead">
        <div><h1>Watchlist</h1><p className="small">Produk yang Anda simpan. Isi harga target untuk mendapat peringatan.</p></div>
      </div>
      {tercapai > 0 ? <p className="banner" role="status"><b>{tercapai} produk</b> sudah mencapai harga target.</p> : null}
      <div className="card">
        {rows.length === 0 ? (
          <div className="empty" style={{ marginTop: 0 }}><b>Watchlist kosong</b>Simpan produk dari halaman Pencarian dengan tombol penanda.<br /><br />
            <Link className="btn primary" href="/cari">Ke Pencarian</Link></div>
        ) : (
          <>
            <div className="tablewrap"><table style={{ minWidth: 720 }}>
              <thead><tr><th>Produk</th><th className="r">Harga kini</th><th className="r">Harga target (Rp)</th><th>Status</th><th /></tr></thead>
              <tbody>{rows.map((r) => {
                const p = first(r.product);
                const shop = first(p?.shop ?? null);
                const h = last.get(r.product_id);
                const st = statusTarget(h?.harga ?? null, r.harga_target);
                return (
                  <tr key={r.product_id}>
                    <td style={{ whiteSpace: 'normal' }}>{p?.url ? <a href={p.url} target="_blank" rel="noopener noreferrer">{p.nama}</a> : (p?.nama ?? 'Produk')}
                      <div className="small">{shop?.nama ?? ''}</div></td>
                    <td className="r mono">{h ? rp(h.harga) : '-'}{h ? <div className="small">per {h.tanggal}</div> : null}</td>
                    <td className="r">
                      <form action={setTargetAction} className="inline" style={{ justifyContent: 'flex-end' }}>
                        <input type="hidden" name="id" value={r.product_id} />
                        <input type="text" name="target" inputMode="numeric" defaultValue={r.harga_target ?? ''} aria-label="Harga target"
                          placeholder={h ? `mis. ${Math.round((h.harga * 0.9) / 1000) * 1000}` : ''} style={{ width: 130, textAlign: 'right' }} />
                        <button className="btn">Simpan</button>
                      </form>
                    </td>
                    <td><span className={`pill ${st === 'tercapai' ? 'good' : ''}`}>{st === 'tercapai' ? 'Tercapai' : st === 'menunggu' ? 'Menunggu' : 'Tanpa target'}</span></td>
                    <td><form action={hapusWatchlistAction}><input type="hidden" name="id" value={r.product_id} /><button className="btn">Hapus</button></form></td>
                  </tr>
                );
              })}</tbody>
            </table></div>
            <p className="small" style={{ marginBottom: 0 }}>Harga kini adalah harga terakhir yang tersimpan. Cari produknya lagi di Pencarian untuk memperbarui. Peringatan tampil di halaman ini; belum ada pemberitahuan lewat email atau WhatsApp.</p>
          </>
        )}
      </div>
    </>
  );
}
