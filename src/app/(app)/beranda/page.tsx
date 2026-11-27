import type { Metadata } from 'next';
import { requireUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Beranda' };

const PLAN_LABEL = { gratis: 'Gratis', bulanan: 'Bulanan', empat_bulan: '4 Bulan', lifetime: 'Lifetime' } as const;

export default async function Beranda() {
  const me = await requireUser();
  return (
    <>
      <h1>Halo, {me.nama || me.email}</h1>
      <p className="small">Peran: {me.role} · Paket: {PLAN_LABEL[me.plan]}</p>
      <div className="card" style={{ marginTop: 20 }}>
        <h2>Tahap 1 aktif</h2>
        <p className="small" style={{ marginBottom: 0 }}>
          Login, manajemen pengguna, dan skema database sudah berjalan. Pencarian, Riset kata kunci, Riset suplier,
          Buat produk, Watchlist, dan Impor menyusul di tahap berikutnya sesuai rancangan.
        </p>
      </div>
    </>
  );
}
