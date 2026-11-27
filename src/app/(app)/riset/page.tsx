import Link from 'next/link';
import type { Metadata } from 'next';
import { requireUser } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { apifyAktif } from '@/lib/riset-apify';
import AnalisisCepat from './AnalisisCepat';

export const maxDuration = 300; // analisis cepat menunggu aktor Apify
export const metadata: Metadata = { title: 'Riset kata kunci' };

export default async function RisetList() {
  const me = await requireUser();
  const sb = await supabaseServer();
  const { data } = await sb
    .from('riset_permintaan')
    .select('id,judul,kata_kunci,provinsi,kota,toko,status,dibuat')
    .order('dibuat', { ascending: false })
    .limit(100);
  const rows = data ?? [];
  const canCreate = me.role !== 'viewer';
  return (
    <>
      <div className="pagehead">
        <div><h1>Riset kata kunci</h1><p className="small">Seberapa ramai dan ke mana harga bergerak untuk satu kata kunci. Untuk riset mendalam per wilayah atau toko, buat permintaan riset.</p></div>
        <div className="row">
          <Link className="btn" href="/contoh">Lihat contoh hasil</Link>
          {canCreate ? <Link className="btn primary" href="/riset/baru">Permintaan baru</Link> : null}
        </div>
      </div>
      <AnalisisCepat bisa={apifyAktif() && canCreate} />
      <h2 style={{ margin: '28px 0 8px' }}>Permintaan riset (wilayah atau toko)</h2>
      <p className="small" style={{ marginTop: 0 }}>Hasilnya berupa dashboard lengkap dan PDF.</p>
      <div className="card">
        {rows.length === 0 ? (
          <p className="small" style={{ margin: 0 }}>Belum ada permintaan. {canCreate ? 'Buat yang pertama dengan tombol di atas.' : 'Analis atau admin dapat membuat permintaan.'}</p>
        ) : (
          <div className="tablewrap"><table>
            <thead><tr><th>Judul</th><th>Kata kunci / toko</th><th>Wilayah</th><th>Status</th><th>Dibuat</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id}>
                <td><Link href={`/riset/${r.id}`}>{r.judul}</Link></td>
                <td>{[...(r.kata_kunci ?? []), ...(r.toko ?? [])].join(', ')}</td>
                <td>{[r.provinsi, ...(r.kota ?? [])].filter(Boolean).join(', ') || '-'}</td>
                <td><span className={`status ${r.status}`}>{r.status}</span></td>
                <td className="small">{new Date(r.dibuat).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
    </>
  );
}
