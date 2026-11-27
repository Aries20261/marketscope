'use client';

import { useState, useTransition } from 'react';
import { ambilTerlarisAction } from './actions';
import type { HasilCari } from '@/lib/cari';

const rp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
const LANGKAH = [
  { t: 'Ambil produk terlaris', ada: true },
  { t: 'Ambil bahan', ada: false },
  { t: 'Tarik ulasan', ada: false },
  { t: 'Susun rancangan', ada: false },
  { t: 'Susun promosi', ada: false }
];
const TABS = [['bahan', 'Bedah bahan'], ['ulasan', 'Celah ulasan'], ['rancang', 'Rancang produk'], ['promosi', 'Angle & promosi']] as const;
type Tab = (typeof TABS)[number][0];

const BUTUH: Record<Exclude<Tab, 'bahan'>, string> = {
  ulasan: 'Ulasan bintang 1 per produk. Aktor Apify yang dipakai sekarang tidak menyediakan teks ulasan, jadi butuh sumber ulasan lain (aktor Apify khusus ulasan, atau impor manual) dan tahap analisis tema keluhan.',
  rancang: 'Rancangan produk disusun dari bahan dan celah ulasan, dan butuh model bahasa (Claude API). Tahap ini baru bisa dibuat setelah bahan dan ulasan tersedia.',
  promosi: 'Angle dan rencana promosi disusun dari bukti ulasan dan bahan, dan butuh model bahasa (Claude API) beserta tinjauan klaim sebelum tayang.'
};

export default function ProdukClient({ bisa }: { bisa: boolean }) {
  const [kata, setKata] = useState('');
  const [hasil, setHasil] = useState<{ kata: string; terlaris: HasilCari[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('bahan');
  const [pending, start] = useTransition();
  const run = () => start(async () => {
    setError(null);
    const r = await ambilTerlarisAction(kata);
    if (r.error) { setError(r.error); setHasil(null); } else if (r.terlaris && r.kata) setHasil({ kata: r.kata, terlaris: r.terlaris });
  });

  return (
    <>
      <section className="card">
        <div className="row">
          <input type="text" className="grow" value={kata} onChange={(e) => setKata(e.target.value)} aria-label="Kata kunci produk"
            placeholder="Ketik kata kunci produk, mis. sunscreen, serum, kopi arabika"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (bisa && !pending) run(); } }} />
          <button className="btn primary" type="button" onClick={run} disabled={pending || !bisa}>{pending ? 'Mengambil…' : 'Ambil produk terlaris'}</button>
        </div>
        <ol className="steps" aria-label="Alur">
          {LANGKAH.map((l, i) => {
            const status = l.ada ? (hasil ? 'Selesai' : pending ? 'Berjalan' : 'Menunggu') : 'Belum tersedia';
            return <li key={l.t} className={l.ada && hasil ? 'done' : ''}><span>{i + 1}</span>{l.t}<em>{status}</em></li>;
          })}
        </ol>
        <p className="small" style={{ marginBottom: 0 }}>Langkah 1 memakai data Shopee nyata lewat Apify (memakai kredit Apify). Langkah 2 sampai 5 belum tersedia; lihat penjelasan di tiap tab.</p>
      </section>

      {error ? <p className="err" role="alert">{error}</p> : null}
      {pending ? <div className="empty" aria-busy="true"><b>Mengambil produk terlaris dari Shopee…</b>Biasanya 30 detik sampai beberapa menit.</div> : null}

      <div className="tabs" role="tablist" style={{ marginTop: 16 }}>
        {TABS.map(([k, t]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{t}</button>)}
      </div>

      {tab === 'bahan' ? (
        <>
          {!hasil && !pending ? <div className="empty"><b>Mulai dari kata kunci</b>Ketik kata kunci produk lalu tekan “Ambil produk terlaris”.</div> : null}
          {hasil && !pending ? (
            <section className="card">
              <h2>Benchmark pasar: {hasil.kata} terlaris</h2>
              <p className="small">5 produk teratas menurut urutan penjualan Shopee. Harga saat ini, harga coret, rating, dan jumlah ulasan. Jumlah terjual tidak tersedia dari sumber.</p>
              <div className="tablewrap"><table>
                <thead><tr><th>Produk</th><th>Toko</th><th className="r">Harga</th><th className="r">Harga coret</th><th className="r">Rating</th><th className="r">Ulasan</th></tr></thead>
                <tbody>{hasil.terlaris.map((p) => (
                  <tr key={p.key}>
                    <td style={{ whiteSpace: 'normal' }}>{p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer">{p.nama}</a> : p.nama}</td>
                    <td>{p.toko}</td>
                    <td className="r mono">{rp(p.harga)}</td>
                    <td className="r mono">{p.hargaCoret ? rp(p.hargaCoret) : '-'}</td>
                    <td className="r mono">{p.rating !== null ? String(p.rating).replace('.', ',') : '-'}</td>
                    <td className="r mono">{p.ulasan !== null ? new Intl.NumberFormat('id-ID').format(p.ulasan) : '-'}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            </section>
          ) : null}
          <section className="card" style={{ marginTop: 16 }}>
            <h2>Matriks bahan</h2>
            <p className="small" style={{ marginBottom: 0 }}>Belum tersedia. Daftar bahan tidak ada di data Shopee dari aktor Apify yang dipakai. Sumber bahan (mis. database bahan kosmetik, atau impor manual dari kemasan) perlu ditentukan lebih dulu.</p>
          </section>
        </>
      ) : (
        <div className="empty" style={{ textAlign: 'left' }}><b>Belum tersedia</b>{BUTUH[tab]}</div>
      )}
    </>
  );
}
