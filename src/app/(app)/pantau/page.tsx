import Link from 'next/link';
import type { Metadata } from 'next';
import { requireUser } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { hitungPeringatan, type ItemPantau } from '@/lib/pantau';
import AturanForm from './AturanForm';

export const metadata: Metadata = { title: 'Pemantauan' };

type Shop = { nama: string } | { nama: string }[] | null;
type Prod = { nama: string; shop: Shop };
interface Row { product_id: string; harga_target: number | null; product: Prod | Prod[] | null }
const first = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v);

export default async function PantauPage() {
  const me = await requireUser();
  const sb = await supabaseServer();

  const { data: aturan, error: aturanErr } = await sb.from('aturan_pantau').select('turun_persen').eq('user_id', me.id).maybeSingle();
  const turun = (aturan as { turun_persen: number } | null)?.turun_persen ?? 8;

  const { data } = await sb.from('watchlist').select('product_id,harga_target,product:products(nama,shop:shops(nama))').limit(300);
  const rows = (data ?? []) as unknown as Row[];
  const ids = rows.map((r) => r.product_id);
  const snaps = new Map<string, { tanggal: string; harga: number }[]>();
  if (ids.length) {
    const { data: s } = await sb.from('snapshots').select('product_id,tanggal,harga').in('product_id', ids).order('tanggal', { ascending: false }).limit(5000);
    for (const x of (s ?? []) as { product_id: string; tanggal: string; harga: number }[]) {
      const arr = snaps.get(x.product_id) ?? [];
      if (arr.length < 2) arr.push({ tanggal: x.tanggal, harga: Number(x.harga) });
      snaps.set(x.product_id, arr);
    }
  }
  const items: ItemPantau[] = rows.map((r) => {
    const p = first(r.product);
    return { produkId: r.product_id, nama: p?.nama ?? 'Produk', toko: first(p?.shop ?? null)?.nama ?? '', target: r.harga_target, snaps: snaps.get(r.product_id) ?? [] };
  });
  const peringatan = hitungPeringatan(items, turun);

  return (
    <>
      <div className="pagehead">
        <div><h1>Pemantauan</h1><p className="small">Peringatan perubahan harga dari snapshot harian produk di watchlist.</p></div>
      </div>
      {aturanErr ? <p className="banner">Aturan belum bisa dibaca atau disimpan (tabel <code>aturan_pantau</code> belum ada). Memakai nilai bawaan: harga turun lebih dari {turun}%. Jalankan migrasi 0004 di Supabase.</p> : null}
      <div className="two" style={{ alignItems: 'start' }}>
        <section className="card">
          <h2>Peringatan terbaru</h2>
          <p className="small">Dari aturan di sebelah kanan</p>
          {rows.length === 0 ? (
            <div className="empty" style={{ marginTop: 0 }}><b>Watchlist kosong</b>Simpan produk dari Pencarian agar harganya dipantau.<br /><br /><Link className="btn primary" href="/cari">Ke Pencarian</Link></div>
          ) : peringatan.length === 0 ? (
            <p className="small" style={{ marginBottom: 0 }}>Belum ada peringatan untuk {rows.length} produk di watchlist. Peringatan muncul bila produk dicari ulang di hari berbeda dan harganya turun lebih dari {turun}%, atau mencapai harga target.</p>
          ) : (
            <ul className="alerts">
              {peringatan.map((p, i) => (
                <li key={`${p.produkId}-${p.jenis}-${i}`} className={p.jenis === 'turun' ? 'crit' : 'good'}>
                  <div><b>{p.judul}</b><span>{p.detail}</span></div>
                  <span className={`pill ${p.jenis === 'turun' ? 'crit' : 'good'}`}>{p.jenis === 'turun' ? 'Harga turun' : 'Target'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <AturanForm turunPersen={turun} bisa={me.role !== 'viewer'} />
      </div>
    </>
  );
}
