'use client';

import { useActionState } from 'react';
import { simpanAturanAction, type AturanState } from './actions';

export default function AturanForm({ turunPersen, bisa }: { turunPersen: number; bisa: boolean }) {
  const [s, action, pending] = useActionState<AturanState, FormData>(simpanAturanAction, {});
  return (
    <form action={action} className="card" noValidate>
      <h2>Aturan peringatan</h2>
      <p className="small">Dicek setiap kali halaman dibuka, dari snapshot harga produk di watchlist.</p>
      <label className="f" htmlFor="a-turun">Harga turun lebih dari (%)</label>
      <input id="a-turun" name="turun_persen" type="text" inputMode="numeric" defaultValue={turunPersen} disabled={!bisa} />
      <label className="f" htmlFor="a-stok">Stok kurang dari (pcs)</label>
      <input id="a-stok" type="text" disabled placeholder="Belum tersedia" />
      <label className="ck" style={{ marginTop: 12 }}><input type="checkbox" disabled /> Peringatan flash sale</label>
      <p className="small">Stok dan flash sale belum tersedia: aktor Apify yang dipakai tidak mengirim data stok maupun flash sale, jadi aturan ini belum bisa dihitung.</p>
      {s.error ? <p className="err" role="alert">{s.error}</p> : null}
      {s.ok ? <p className="ok" role="status">{s.ok}</p> : null}
      <div className="row" style={{ marginTop: 12 }}><button className="btn primary" disabled={pending || !bisa}>{pending ? 'Menyimpan…' : 'Simpan aturan'}</button></div>
    </form>
  );
}
