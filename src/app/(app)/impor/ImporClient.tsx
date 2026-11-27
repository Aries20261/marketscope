'use client';

import { useRef, useState, useTransition } from 'react';
import { pratinjauImporAction, simpanImporAction, type Pratinjau } from './actions';

export default function ImporClient({ bisa }: { bisa: boolean }) {
  const [teks, setTeks] = useState('');
  const [nama, setNama] = useState('');
  const [pv, setPv] = useState<Pratinjau | null>(null);
  const [hasil, setHasil] = useState<{ error?: string; ok?: string } | null>(null);
  const [drag, setDrag] = useState(false);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  async function baca(f: File | undefined) {
    if (!f) return;
    setHasil(null); setPv(null);
    if (f.size > 900_000) { setPv({ error: 'File terlalu besar (maks 900 KB).' }); return; }
    const t = await f.text();
    setTeks(t); setNama(f.name);
    start(async () => setPv(await pratinjauImporAction(t, f.name)));
  }
  const simpan = () => start(async () => { const r = await simpanImporAction(teks, nama); setHasil(r); if (r.ok) { setPv(null); setTeks(''); setNama(''); } });

  return (
    <>
      <section className="card">
        <div className={`drop${drag ? ' over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); if (bisa) void baca(e.dataTransfer.files[0]); }}>
          <b>Tarik file ke sini</b>
          <span>atau <button type="button" className="linkbtn" onClick={() => input.current?.click()} disabled={!bisa}>pilih file</button> (CSV atau JSON)</span>
          <input ref={input} type="file" accept=".csv,.json,text/csv,application/json" hidden onChange={(e) => void baca(e.target.files?.[0])} />
        </div>
        <p className="small" style={{ marginBottom: 0 }}>
          Kolom wajib: <code>item_id</code>, <code>shop_id</code>, <code>nama</code> (atau <code>produk</code>), <code>tanggal</code> (yyyy-MM-dd), <code>harga</code>.
          Opsional: <code>marketplace</code> (bawaan Shopee), <code>toko</code>, <code>stok</code>, <code>terjual</code>, <code>rating</code>, <code>kota</code>, <code>provinsi</code>, <code>kategori</code>, <code>url</code>. Maksimal 1.000 baris.
        </p>
      </section>

      {!bisa ? <p className="err">Peran viewer tidak dapat mengimpor data.</p> : null}
      {pending ? <div className="empty" aria-busy="true"><b>Memproses…</b></div> : null}
      {pv?.error ? <p className="err" role="alert">{pv.error}</p> : null}
      {hasil?.error ? <p className="err" role="alert">{hasil.error}</p> : null}
      {hasil?.ok ? <p className="ok" role="status">{hasil.ok}</p> : null}

      {!pending && pv && !pv.error ? (
        <section className="card" style={{ marginTop: 16 }}>
          <h2>Pratinjau: {nama}</h2>
          <p className="small"><b>{pv.total}</b> baris · <b style={{ color: 'var(--good)' }}>{pv.valid} valid</b> · <b style={{ color: pv.galat ? 'var(--crit)' : undefined }}>{pv.galat} bermasalah</b>. Belum ada yang disimpan.</p>
          {pv.hilang && pv.hilang.length ? <p className="err" role="alert">Kolom wajib tidak ditemukan: {pv.hilang.join(', ')}.</p> : null}
          <div className="tablewrap"><table style={{ minWidth: 520 }}>
            <thead><tr><th>Baris</th><th>Produk</th><th className="r">Harga</th><th>Tanggal</th><th>Hasil</th></tr></thead>
            <tbody>{pv.contoh?.map((c) => (
              <tr key={c.baris}><td className="mono">{c.baris}</td><td>{c.produk}</td><td className="r mono">{c.harga || '-'}</td><td>{c.tanggal || '-'}</td>
                <td>{c.ok ? <span className="pill good">Valid</span> : <span className="pill crit">{c.alasan}</span>}</td></tr>
            ))}</tbody>
          </table></div>
          <p className="small">Menampilkan contoh baris bermasalah dan valid, bukan seluruh file.</p>
          <div className="row"><button className="btn primary" type="button" onClick={simpan} disabled={pending || !pv.valid}>Simpan {pv.valid} baris valid</button></div>
        </section>
      ) : null}
    </>
  );
}
