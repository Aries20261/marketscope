'use client';

import { useActionState } from 'react';
import { createRisetAction, type RisetFormState } from './actions';

const PROVINSI = ['Aceh','Sumatera Utara','Sumatera Barat','Riau','Kepulauan Riau','Jambi','Sumatera Selatan','Bangka Belitung','Bengkulu','Lampung','DKI Jakarta','Jawa Barat','Banten','Jawa Tengah','DI Yogyakarta','Jawa Timur','Bali','Nusa Tenggara Barat','Nusa Tenggara Timur','Kalimantan Barat','Kalimantan Tengah','Kalimantan Selatan','Kalimantan Timur','Kalimantan Utara','Sulawesi Utara','Gorontalo','Sulawesi Tengah','Sulawesi Barat','Sulawesi Selatan','Sulawesi Tenggara','Maluku','Maluku Utara','Papua','Papua Barat'];

export default function RisetForm() {
  const [s, action, pending] = useActionState<RisetFormState, FormData>(createRisetAction, {});
  return (
    <form action={action} className="card" noValidate>
      <label className="f" htmlFor="judul">Judul (opsional)</label>
      <input id="judul" name="judul" type="text" maxLength={120} placeholder="Digital printing Ponorogo" />
      <label className="f" htmlFor="kata_kunci">Kata kunci (pisahkan dengan koma)</label>
      <input id="kata_kunci" name="kata_kunci" type="text" placeholder="digital printing, cetak banner, cetak stiker" />
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 220px' }}>
          <label className="f" htmlFor="provinsi">Provinsi (filter Shopee)</label>
          <input id="provinsi" name="provinsi" type="text" list="prov" placeholder="Jawa Timur" />
          <datalist id="prov">{PROVINSI.map((p) => <option key={p} value={p} />)}</datalist>
        </div>
        <div style={{ flex: '1 1 220px' }}>
          <label className="f" htmlFor="kota">Kota atau kabupaten (opsional)</label>
          <input id="kota" name="kota" type="text" placeholder="Ponorogo, Tulungagung" />
        </div>
      </div>
      <p className="small">Filter lokasi Shopee hanya menerima provinsi. Kota disaring dari lokasi yang tampil di listing.</p>
      <label className="f" htmlFor="toko">Atau nama toko (opsional)</label>
      <input id="toko" name="toko" type="text" placeholder="M-Star Printing" />
      {s.error ? <p className="err" role="alert">{s.error}</p> : null}
      <div className="row" style={{ marginTop: 16 }}>
        <button className="btn primary" disabled={pending}>{pending ? 'Menyimpan…' : 'Kirim permintaan'}</button>
      </div>
    </form>
  );
}
