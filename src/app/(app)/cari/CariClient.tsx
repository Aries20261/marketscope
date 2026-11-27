'use client';

import { useMemo, useState, useTransition } from 'react';
import { cariAction } from './actions';
import { toggleWatchlistAction } from '../watchlist/actions';
import type { HasilCari } from '@/lib/cari';

const SUMBER: { nama: string; aktif: boolean }[] = [
  { nama: 'Shopee', aktif: true }, { nama: 'Tokopedia', aktif: false }, { nama: 'Lazada', aktif: false },
  { nama: 'Blibli', aktif: false }, { nama: 'Bukalapak', aktif: false }
];
const rp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
type Urut = 'rel' | 'lo' | 'hi' | 'rate' | 'drop';

function perubahan(h: HasilCari): number | null {
  if (h.riwayat.length < 2) return null;
  const a = h.riwayat[0].harga;
  return a ? ((h.harga - a) / a) * 100 : null;
}

function Garis({ pts }: { pts: { tanggal: string; harga: number }[] }) {
  if (pts.length < 2) return <p className="small">Riwayat terbentuk setelah produk ini dicari lagi di hari yang berbeda. Baru ada {pts.length} titik.</p>;
  const W = 340, H = 140, p = 8;
  const v = pts.map((x) => x.harga), mn = Math.min(...v), mx = Math.max(...v), r = mx - mn || 1;
  const d = pts.map((x, i) => `${i ? 'L' : 'M'}${(p + (i * (W - 2 * p)) / (pts.length - 1)).toFixed(1)} ${(H - p - ((x.harga - mn) / r) * (H - 2 * p)).toFixed(1)}`).join('');
  return (
    <svg className="chartsvg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Riwayat harga dari ${rp(v[0])} ke ${rp(v[v.length - 1])}`}>
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
      <text x={p} y={H - 1}>{pts[0].tanggal}</text><text x={W - p} y={H - 1} textAnchor="end">{pts[pts.length - 1].tanggal}</text>
    </svg>
  );
}

export default function CariClient({ bisaCari, tersimpan, bisaSimpan }: { bisaCari: boolean; tersimpan: string[]; bisaSimpan: boolean }) {
  const [wl, setWl] = useState<Set<string>>(new Set(tersimpan));
  const [wlError, setWlError] = useState<string | null>(null);
  function toggleWl(id: string) {
    setWlError(null);
    const sudah = wl.has(id);
    setWl((s) => { const n = new Set(s); if (sudah) n.delete(id); else n.add(id); return n; });
    toggleWatchlistAction(id).then((r) => {
      if (r.error) {
        setWlError(r.error);
        setWl((s) => { const n = new Set(s); if (sudah) n.add(id); else n.delete(id); return n; });
      }
    });
  }
  const [kata, setKata] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [hasil, setHasil] = useState<HasilCari[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [urut, setUrut] = useState<Urut>('rel');
  const [pilih, setPilih] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function tambah() {
    const baru = input.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
    if (baru.length) setKata((k) => [...new Set([...k, ...baru])].slice(0, 4));
    setInput('');
  }
  function cari() {
    const semua = [...new Set([...kata, ...input.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean)])].slice(0, 4);
    setKata(semua); setInput(''); setError(null); setPilih(null);
    start(async () => {
      const r = await cariAction(semua);
      if (r.error) { setError(r.error); setHasil(null); } else setHasil(r.hasil ?? []);
    });
  }

  const daftar = useMemo(() => {
    const l = [...(hasil ?? [])];
    if (urut === 'lo') l.sort((a, b) => a.harga - b.harga);
    if (urut === 'hi') l.sort((a, b) => b.harga - a.harga);
    if (urut === 'rate') l.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    if (urut === 'drop') l.sort((a, b) => (perubahan(a) ?? 0) - (perubahan(b) ?? 0));
    return l;
  }, [hasil, urut]);
  const termurah = useMemo(() => {
    const m = new Map<string, number>();
    (hasil ?? []).forEach((h) => m.set(h.kata, Math.min(m.get(h.kata) ?? Infinity, h.harga)));
    return m;
  }, [hasil]);
  const sel = hasil?.find((h) => h.key === pilih) ?? null;
  const banding = sel ? (hasil ?? []).filter((h) => h.kata === sel.kata).sort((a, b) => a.harga - b.harga).slice(0, 5) : [];

  return (
    <>
      <section className="card" aria-label="Pencarian">
        <div className="row">
          <input type="text" className="grow" value={input} onChange={(e) => setInput(e.target.value)} aria-label="Kata kunci"
            placeholder="Ketik kata kunci, pisahkan dengan koma (mis. sepatu lari, kopi arabika)"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); tambah(); } }} />
          <button className="btn" type="button" onClick={tambah}>Tambah</button>
          <button className="btn primary" type="button" onClick={cari} disabled={pending || !bisaCari}>{pending ? 'Mencari…' : 'Cari produk'}</button>
        </div>
        <div className="chips" aria-live="polite">
          {kata.length === 0 ? <span className="small">Belum ada kata kunci (maksimal 4).</span> : kata.map((k) => (
            <span className="chip" key={k}>{k}<button type="button" aria-label={`Hapus ${k}`} onClick={() => setKata(kata.filter((x) => x !== k))}>×</button></span>
          ))}
        </div>
        <hr className="rule" />
        <div className="srcs"><span className="lab">SUMBER</span>
          {SUMBER.map((s) => (
            <label key={s.nama} className={`ck${s.aktif ? '' : ' off'}`}>
              <input type="checkbox" checked={s.aktif} disabled readOnly /> {s.nama}{s.aktif ? '' : <span className="soon">segera</span>}
            </label>
          ))}
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <select value={urut} onChange={(e) => setUrut(e.target.value as Urut)} aria-label="Urutkan" style={{ width: 'auto' }}>
            <option value="rel">Urutkan: Relevan</option><option value="lo">Harga termurah</option><option value="hi">Harga termahal</option>
            <option value="rate">Rating tertinggi</option><option value="drop">Penurunan harga terbesar</option>
          </select>
        </div>
        <p className="small" style={{ marginBottom: 0 }}>Setiap pencarian menjalankan aktor Apify dan memakai kredit Apify Anda. Jumlah terjual, stok, dan statistik penjual tidak tersedia dari sumber ini.</p>
      </section>

      {error ? <p className="err" role="alert">{error}</p> : null}
      {wlError ? <p className="err" role="alert">{wlError}</p> : null}
      {pending ? <div className="empty" aria-busy="true"><b>Mengambil data dari Shopee…</b>Biasanya 30 detik sampai beberapa menit, tergantung jumlah kata kunci.</div> : null}
      {!pending && hasil === null && !error ? (
        <div className="empty"><b>Mulai pencarian</b>Tambahkan kata kunci, lalu tekan “Cari produk”.</div>
      ) : null}
      {!pending && hasil && hasil.length === 0 ? <div className="empty"><b>Tidak ada hasil</b>Sumber tidak mengembalikan produk untuk kata kunci ini.</div> : null}

      {!pending && hasil && hasil.length > 0 ? (
        <div className="layout">
          <div>
            <p className="small"><b>{daftar.length} hasil</b> dari Shopee · harga tampil, biasanya varian termurah</p>
            <div className="cards">
              {daftar.map((h) => {
                const d = perubahan(h);
                return (
                  <article className="pc" key={h.key} tabIndex={0} aria-selected={pilih === h.key}
                    onClick={() => setPilih(h.key)} onKeyDown={(e) => { if (e.key === 'Enter') setPilih(h.key); }}>
                    <div className="top"><span className="tag">Shopee</span>{h.harga === termurah.get(h.kata) ? <span className="tag low">Termurah</span> : null}</div>
                    <h3>{h.nama}</h3>
                    <div className="small">{h.toko}{h.kota ? ` · ${h.kota}` : ''} · “{h.kata}”</div>
                    <div className="price mono">{rp(h.harga)}</div>
                    <div className="small">{d === null ? 'Riwayat: 1 titik' : `${d > 0 ? '↗ +' : '↘ '}${d.toFixed(1).replace('.', ',')}% sejak ${h.riwayat[0].tanggal}`}</div>
                    <div className="foot"><span>{h.rating !== null ? `★ ${String(h.rating).replace('.', ',')}` : 'Belum ada rating'}</span>
                      <span className="row" style={{ gap: 10 }}>
                        {h.url ? <a href={h.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>Buka di Shopee</a> : null}
                        {bisaSimpan && h.produkId ? (
                          <button type="button" className="bm" aria-pressed={wl.has(h.produkId)} aria-label={wl.has(h.produkId) ? 'Hapus dari watchlist' : 'Simpan ke watchlist'}
                            onClick={(e) => { e.stopPropagation(); toggleWl(h.produkId as string); }}>
                            <svg viewBox="0 0 24 24" width="20" height="20" fill={wl.has(h.produkId) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z" /></svg>
                          </button>
                        ) : null}
                      </span></div>
                  </article>
                );
              })}
            </div>
          </div>
          <aside className="card side" aria-label="Riwayat harga">
            <h2>Riwayat Harga</h2>
            {sel ? (
              <>
                <h3 style={{ marginTop: 10 }}>{sel.nama}</h3>
                <p className="small">{sel.toko}</p>
                <Garis pts={sel.riwayat} />
                <h3 style={{ marginTop: 14 }}>Bandingkan: {sel.kata}</h3>
                <ul className="hbars">
                  {banding.map((b) => (
                    <li key={b.key}>
                      <div className="hb-label" title={b.nama}><span>{b.toko}</span></div>
                      <div className="hb-track"><div className="hb-fill" style={{ width: `${Math.max(4, (b.harga / banding[banding.length - 1].harga) * 100)}%` }} /></div>
                      <div className="hb-val mono">{rp(b.harga)}</div>
                    </li>
                  ))}
                </ul>
              </>
            ) : <p className="small">Pilih produk untuk melihat riwayat dan perbandingan harga.</p>}
          </aside>
        </div>
      ) : null}
    </>
  );
}
