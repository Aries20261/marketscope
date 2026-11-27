import type { Metadata } from 'next';
import { requireUser } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import ImporClient from './ImporClient';

export const metadata: Metadata = { title: 'Impor data' };

export default async function ImporPage() {
  const me = await requireUser();
  const sb = await supabaseServer();
  const { data } = await sb.from('imports').select('id,file_nama,jumlah_baris,diterima,ditolak,created_at').order('created_at', { ascending: false }).limit(10);
  const riwayat = (data ?? []) as { id: string; file_nama: string; jumlah_baris: number; diterima: number; ditolak: number; created_at: string }[];
  return (
    <>
      <div className="pagehead">
        <div><h1>Impor data</h1><p className="small">Unggah hasil kolektor (CSV atau JSON). Periksa dulu sebelum disimpan.</p></div>
      </div>
      <ImporClient bisa={me.role !== 'viewer'} />
      {riwayat.length ? (
        <section className="card" style={{ marginTop: 16 }}>
          <h2>Riwayat impor</h2>
          <div className="tablewrap"><table style={{ minWidth: 520 }}>
            <thead><tr><th>File</th><th className="r">Baris</th><th className="r">Diterima</th><th className="r">Ditolak</th><th>Waktu</th></tr></thead>
            <tbody>{riwayat.map((r) => (
              <tr key={r.id}><td>{r.file_nama}</td><td className="r mono">{r.jumlah_baris}</td><td className="r mono">{r.diterima}</td><td className="r mono">{r.ditolak}</td>
                <td className="small">{new Date(r.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</td></tr>
            ))}</tbody>
          </table></div>
        </section>
      ) : null}
    </>
  );
}
