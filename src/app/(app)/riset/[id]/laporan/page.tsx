import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/session';
import { loadRiset } from '@/lib/riset-data';
import RisetDashboard from '@/components/RisetDashboard';
import PrintButton from '@/components/PrintButton';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function Laporan({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const r = await loadRiset(id);
  if (!r || r.req.status !== 'selesai') notFound();
  const { req, dash, monthly } = r;
  const wilayah = [req.provinsi, ...req.kota].filter(Boolean).join(', ');
  return (
    <>
      <div className="pagehead noprint">
        <div><h1>Laporan</h1><p className="small">Klik Unduh PDF, lalu pilih “Simpan sebagai PDF” di dialog cetak.</p></div>
        <div className="row"><Link className="btn" href={`/riset/${req.id}`}>Kembali</Link><PrintButton /></div>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="small mono">MarketScope Indonesia · Laporan riset</div>
        <h1 style={{ margin: '6px 0' }}>{req.judul}</h1>
        <p className="small" style={{ margin: 0 }}>
          {[...req.kata_kunci, ...req.toko].join(', ')}{wilayah ? ` · ${wilayah}` : ''} · {req.marketplace} ·
          dibuat {new Date(req.dibuat).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'long' })}
        </p>
      </div>
      <RisetDashboard d={dash} monthly={monthly} />
    </>
  );
}
