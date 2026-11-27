'use client';

import { useState, useTransition } from 'react';
import { ambilTerlarisAction, tarikUlasanAction, type UlasanState } from './actions';
import { MAKS_ULASAN_PER_PRODUK } from '@/lib/ulasan-map';
import type { HasilCari } from '@/lib/cari';

const rp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
const LANGKAH = [
  { t: 'Ambil produk terlaris', ada: true },
  { t: 'Ambil bahan', ada: false },
  { t: 'Tarik ulasan', ada: true },
  { t: 'Susun rancangan', ada: false },
  { t: 'Susun promosi', ada: false }
];
const TABS = [['bahan', 'Bedah bahan'], ['ulasan', 'Celah ulasan'], ['rancang', 'Rancang produk'], ['promosi', 'Angle & promosi']] as const;
type Tab = (typeof TABS)[number][0];

const BUTUH: Record<'rancang' | 'promosi', string> = {
  rancang: 'Rancangan produk disusun dari bahan dan celah ulasan, dan butuh model bahasa (Claude API). Tahap ini baru bisa dibuat setelah bahan dan ulasan tersedia.',
  promosi: 'Angle dan rencana promosi disusun dari bukti ulasan dan bahan, dan butuh model bahasa (Claude API) beserta tinjauan klaim sebelum tayang.'
};

export default function ProdukClient({ bisa }: { bisa: boolean }) {
  const [kata, setKata] = useState('');
  const [hasil, setHasil] = useState<{ kata: string; terlaris: HasilCari[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('bahan');
  const [ul, setUl] = useState<UlasanState | null>(null);
  const [pendingUl, startUl] = useTransition();
  const tarik = () => startUl(async () => {
    if (!hasil) return;
    setUl(null);
    setUl(await tarikUlasanAction(hasil.terlaris.map((p) => ({ key: p.key, url: p.url }))));
  });
  const [pending, start] = useTransition();
  const run = () => start(async () => {
    setError(null); setUl(null);
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
            const selesai = i === 0 ? Boolean(hasil) : i === 2 ? Boolean(ul?.tema) : false;
            const status = l.ada ? (selesai ? 'Selesai' : (i === 0 ? pending : pendingUl) ? 'Berjalan' : 'Menunggu') : 'Belum tersedia';
            return <li key={l.t} className={selesai ? 'done' : ''}><span>{i + 1}</span>{l.t}<em>{status}</em></li>;
          })}
        </ol>
        <p className="small" style={{ marginBottom: 0 }}>Langkah 1 dan 3 memakai data Shopee nyata lewat Apify dan memakai kredit Apify. Langkah 2, 4, dan 5 belum tersedia; lihat penjelasan di tiap tab.</p>
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
      ) : tab === 'ulasan' ? (
        <>
          {!hasil ? <div className="empty"><b>Ambil produk terlaris dulu</b>Ulasan ditarik untuk 5 produk terlaris pada langkah 1.</div> : (
            <section className="card">
              <h2>Celah dari ulasan bintang 1</h2>
              <p className="small">Menarik ulasan bintang 1 yang berkomentar, maksimal {MAKS_ULASAN_PER_PRODUK} per produk ({hasil.terlaris.length} produk, sampai {MAKS_ULASAN_PER_PRODUK * hasil.terlaris.length} ulasan). Aktor <code>zen-studio/shopee-product-reviews-scraper</code> ditagih per ulasan: sekitar US$3,99 per 1.000 ulasan pada paket Free Apify, jadi paling banyak sekitar US${(MAKS_ULASAN_PER_PRODUK * hasil.terlaris.length * 0.00399).toFixed(2).replace('.', ',')} per penarikan.</p>
              <div className="row"><button className="btn primary" type="button" onClick={tarik} disabled={pendingUl || !bisa}>{pendingUl ? 'Menarik ulasan…' : ul?.tema ? 'Tarik ulang' : 'Tarik ulasan bintang 1'}</button></div>
              {pendingUl ? <div className="empty" aria-busy="true"><b>Menarik ulasan dari Shopee…</b>Bisa beberapa menit.</div> : null}
              {ul?.error ? <p className="err" role="alert">{ul.error}</p> : null}
              {ul?.tema ? (
                <>
                  <p className="small" style={{ marginTop: 16 }}>{ul.jumlahUlasan} ulasan bintang 1 dengan komentar dibaca. Angka menunjukkan jumlah ulasan yang menyebut tema itu pada tiap produk.</p>
                  {ul.tema.length === 0 ? <p className="small">Tidak ada tema keluhan yang dikenali dari ulasan ini.</p> : (
                    <div className="tablewrap"><table className="mx">
                      <thead><tr><th>Tema keluhan</th>{hasil.terlaris.map((p) => <th key={p.key} className="r" title={p.nama}>{p.nama.slice(0, 18)}{p.nama.length > 18 ? '…' : ''}</th>)}<th className="r">Total</th></tr></thead>
                      <tbody>{ul.tema.map((t) => (
                        <tr key={t.nama}><td>{t.nama}</td>{t.perProduk.map((n, i) => <td key={i} className="r mono">{n || '—'}</td>)}<td className="r mono"><b>{t.total}</b></td></tr>
                      ))}</tbody>
                    </table></div>
                  )}
                  {ul.tema.length > 0 ? <p className="banner" style={{ marginTop: 12, marginBottom: 0 }}><b>Keluhan terbanyak:</b> {ul.tema[0].nama} ({ul.tema[0].total} dari {ul.jumlahUlasan} ulasan).</p> : null}
                  <p className="small">Ini indikasi, bukan statistik: sampel kecil dan hanya ulasan bintang 1. Tema dikenali dari kata kunci bahasa Indonesia, jadi bisa melewatkan atau salah menggolongkan kalimat. Satu ulasan bisa masuk ke beberapa tema.</p>
                </>
              ) : null}
            </section>
          )}
        </>
      ) : (
        <div className="empty" style={{ textAlign: 'left' }}><b>Belum tersedia</b>{BUTUH[tab]}</div>
      )}
    </>
  );
}
