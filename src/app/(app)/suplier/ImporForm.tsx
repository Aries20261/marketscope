'use client';

import { useActionState } from 'react';
import { imporSuplierAction, type SuplierState } from './actions';

export default function ImporForm() {
  const [s, action, pending] = useActionState<SuplierState, FormData>(imporSuplierAction, {});
  return (
    <form action={action} className="card" noValidate>
      <h2>Impor CSV</h2>
      <p className="small">Baris pertama adalah judul kolom. Wajib: <code>nama</code>, <code>harga_modal</code>. Opsional: <code>lokasi</code>, <code>produk</code>, <code>moq</code>, <code>respons</code> (mis. 2 jam, 1 hari), <code>skor</code>, <code>kontak</code>, <code>catatan</code>. Maksimal 500 baris.</p>
      <label className="f" htmlFor="i-file">File CSV</label>
      <input id="i-file" name="file" type="file" accept=".csv,text/csv" />
      <label className="f" htmlFor="i-csv">Atau tempel isinya</label>
      <textarea id="i-csv" name="csv" rows={4} style={{ width: '100%', border: '1px solid var(--line)', borderRadius: 10, padding: 10 }}
        placeholder={'nama,lokasi,harga_modal,moq,respons,skor\nKonveksi Contoh,Bandung,52000,24,2 jam,90'} />
      {s.error ? <p className="err" role="alert">{s.error}</p> : null}
      {s.ok ? <p className="ok" role="status">{s.ok}</p> : null}
      <div className="row" style={{ marginTop: 12 }}><button className="btn" disabled={pending}>{pending ? 'Mengimpor…' : 'Impor'}</button></div>
    </form>
  );
}
