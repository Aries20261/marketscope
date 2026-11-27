'use client';

import { useState, useTransition } from 'react';
import { analisisAction, type AnalisisState } from './analisis-actions';
import { Columns, HBars } from '@/components/Charts';
import { num, rp } from '@/lib/riset-calc';

export default function AnalisisCepat({ bisa }: { bisa: boolean }) {
  const [kata, setKata] = useState('');
  const [s, setS] = useState<AnalisisState | null>(null);
  const [pending, start] = useTransition();
  const run = () => start(async () => setS(await analisisAction(kata)));
  const a = s?.hasil;

  return (
    <section aria-label="Analisis cepat">
      <div className="card">
        <h2>Analisis cepat satu kata kunci</h2>
        <p className="small">Seberapa ramai dan ke mana harga bergerak. Data diambil langsung dari Shopee lewat Apify dan memakai kredit Apify Anda.</p>
        <div className="row">
          <input type="text" className="grow" value={kata} onChange={(e) => setKata(e.target.value)} aria-label="Kata kunci"
            placeholder="Ketik kata kunci, mis. jaket bomber pria"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (bisa && !pending) run(); } }} />
          <button className="btn primary" type="button" onClick={run} disabled={pending || !bisa}>{pending ? 'Menganalisis…' : 'Analisis'}</button>
        </div>
      </div>
      {s?.error ? <p className="err" role="alert">{s.error}</p> : null}
      {pending ? <div className="empty" aria-busy="true"><b>Mengambil data dari Shopee…</b>Biasanya 30 detik sampai beberapa menit.</div> : null}
      {!pending && a ? (
        <div className="rd" style={{ marginTop: 16 }}>
          <p className="small">Hasil untuk <b>“{s?.kata}”</b>, dari {num(a.n)} produk teratas hasil pencarian Shopee (bukan seluruh pasar).</p>
          <div className="kpis">
            <div className="card kpi"><div className="l">Rentang harga</div><div className="v mono" style={{ fontSize: 16 }}>{rp(a.min)} – {rp(a.max)}</div></div>
            <div className="card kpi"><div className="l">Harga median</div><div className="v mono">{rp(a.median)}</div></div>
            <div className="card kpi"><div className="l">Jumlah toko di hasil</div><div className="v mono">{num(a.toko)}</div></div>
            <div className="card kpi"><div className="l">5 toko teratas memegang</div><div className="v mono">{Math.round(a.top5Share * 100)}%</div><div className="small">dari produk di hasil</div></div>
          </div>
          <div className="two">
            <section className="card"><h2>Distribusi harga</h2><p className="small">Jumlah produk per rentang; {a.padat} paling padat</p><Columns rows={a.bins} /></section>
            <section className="card"><h2>Konsentrasi toko</h2><p className="small">Toko dengan produk terbanyak di hasil</p><HBars rows={a.topToko} format={(n) => `${n} produk`} /></section>
          </div>
        </div>
      ) : null}
    </section>
  );
}
