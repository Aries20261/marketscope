import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/session';
import { loadRiset } from '@/lib/riset-data';
import RisetDashboard from '@/components/RisetDashboard';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function RisetDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const r = await loadRiset(id);
  if (!r) notFound();
  const { req, dash, monthly } = r;
  const wilayah = [req.provinsi, ...req.kota].filter(Boolean).join(', ');
  return (
    <>
      <div className="pagehead">
        <div>
          <h1>{req.judul}</h1>
          <p className="small">
            {[...req.kata_kunci, ...req.toko].join(', ')}{wilayah ? ` · ${wilayah}` : ''} · {req.marketplace}{' '}
            <span className={`status ${req.status}`}>{req.status}</span>
          </p>
        </div>
        <div className="row noprint">
          <Link className="btn" href="/riset">Semua permintaan</Link>
          {req.status === 'selesai' ? <Link className="btn primary" href={`/riset/${req.id}/laporan`}>Unduh PDF</Link> : null}
        </div>
      </div>
      {req.status === 'selesai' ? (
        <RisetDashboard d={dash} monthly={monthly} />
      ) : (
        <div className="card">
          <h2>{req.status === 'gagal' ? 'Pengambilan data gagal' : 'Menunggu data'}</h2>
          <p className="small" style={{ marginBottom: 0 }}>
            {req.status === 'gagal'
              ? (req.catatan ?? 'Kolektor melaporkan kegagalan. Kirim ulang permintaan.')
              : 'Permintaan sudah masuk antrean. Dashboard muncul setelah kolektor Shopee mengirim hasilnya. Muat ulang halaman ini nanti.'}
          </p>
        </div>
      )}
    </>
  );
}
