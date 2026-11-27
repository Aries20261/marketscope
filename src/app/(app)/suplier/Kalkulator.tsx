'use client';

import { useState } from 'react';
import { hitungMargin, angka } from '@/lib/suplier';

const rp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export default function Kalkulator({ jualAwal, modalAwal, sumber }: { jualAwal: number | null; modalAwal: number | null; sumber: string }) {
  const [jual, setJual] = useState(jualAwal ? String(jualAwal) : '');
  const [modal, setModal] = useState(modalAwal ? String(modalAwal) : '');
  const [lain, setLain] = useState('');
  const m = hitungMargin(angka(jual) ?? 0, angka(modal) ?? 0, angka(lain) ?? 0);
  return (
    <section className="card" aria-label="Kalkulator margin">
      <h2>Kalkulator margin</h2>
      <p className="small">{sumber}</p>
      <label className="f" htmlFor="k-jual">Harga jual (Rp)</label>
      <input id="k-jual" type="text" inputMode="numeric" value={jual} onChange={(e) => setJual(e.target.value)} />
      <label className="f" htmlFor="k-modal">Harga modal (Rp)</label>
      <input id="k-modal" type="text" inputMode="numeric" value={modal} onChange={(e) => setModal(e.target.value)} />
      <label className="f" htmlFor="k-lain">Biaya lain per pcs: kemasan, ongkir, komisi (Rp)</label>
      <input id="k-lain" type="text" inputMode="numeric" value={lain} onChange={(e) => setLain(e.target.value)} />
      <div className="ok" aria-live="polite" style={{ marginBottom: 0 }}>
        {m ? <>Laba per pcs <b>{rp(m.laba)}</b> · margin <b>{m.persen.toFixed(1).replace('.', ',')}%</b></> : 'Isi harga jual.'}
      </div>
    </section>
  );
}
