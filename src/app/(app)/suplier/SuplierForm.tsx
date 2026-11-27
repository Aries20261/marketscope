'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { simpanSuplierAction, type SuplierState } from './actions';
import { formatRespons } from '@/lib/suplier';

export interface SuplierRow {
  id: string; nama: string; lokasi: string | null; produk: string | null; harga_modal: number; moq: number | null;
  respons_menit: number | null; skor: number | null; kontak: string | null; catatan: string | null;
}

export default function SuplierForm({ edit }: { edit: SuplierRow | null }) {
  const [s, action, pending] = useActionState<SuplierState, FormData>(simpanSuplierAction, {});
  return (
    <form action={action} className="card" noValidate key={edit?.id ?? 'baru'}>
      <h2>{edit ? 'Ubah suplier' : 'Tambah suplier'}</h2>
      {edit ? <input type="hidden" name="id" value={edit.id} /> : null}
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: '2 1 240px' }}><label className="f" htmlFor="s-nama">Nama suplier</label>
          <input id="s-nama" name="nama" type="text" defaultValue={edit?.nama ?? ''} maxLength={120} /></div>
        <div style={{ flex: '1 1 160px' }}><label className="f" htmlFor="s-lokasi">Lokasi</label>
          <input id="s-lokasi" name="lokasi" type="text" defaultValue={edit?.lokasi ?? ''} maxLength={80} placeholder="Bandung" /></div>
      </div>
      <label className="f" htmlFor="s-produk">Produk atau bahan (untuk pencarian)</label>
      <input id="s-produk" name="produk" type="text" defaultValue={edit?.produk ?? ''} maxLength={120} placeholder="kemeja flanel pria" />
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 140px' }}><label className="f" htmlFor="s-harga">Harga modal (Rp)</label>
          <input id="s-harga" name="harga_modal" type="text" inputMode="numeric" defaultValue={edit?.harga_modal ?? ''} /></div>
        <div style={{ flex: '1 1 110px' }}><label className="f" htmlFor="s-moq">MOQ (pcs)</label>
          <input id="s-moq" name="moq" type="text" inputMode="numeric" defaultValue={edit?.moq ?? ''} /></div>
        <div style={{ flex: '1 1 130px' }}><label className="f" htmlFor="s-res">Respons</label>
          <input id="s-res" name="respons" type="text" defaultValue={edit ? formatRespons(edit.respons_menit).replace('-', '') : ''} placeholder="2 jam" /></div>
        <div style={{ flex: '1 1 110px' }}><label className="f" htmlFor="s-skor">Skor (0–100)</label>
          <input id="s-skor" name="skor" type="text" inputMode="numeric" defaultValue={edit?.skor ?? ''} /></div>
      </div>
      <label className="f" htmlFor="s-kontak">Kontak</label>
      <input id="s-kontak" name="kontak" type="text" defaultValue={edit?.kontak ?? ''} maxLength={120} />
      <label className="f" htmlFor="s-cat">Catatan</label>
      <input id="s-cat" name="catatan" type="text" defaultValue={edit?.catatan ?? ''} maxLength={300} />
      {s.error ? <p className="err" role="alert">{s.error}</p> : null}
      <div className="row" style={{ marginTop: 16 }}>
        <button className="btn primary" disabled={pending}>{pending ? 'Menyimpan…' : edit ? 'Simpan perubahan' : 'Tambah suplier'}</button>
        {edit ? <Link className="btn" href="/suplier">Batal</Link> : null}
      </div>
    </form>
  );
}
