import type { Metadata } from 'next';
import { requireUser } from '@/lib/session';
import RisetForm from './Form';

export const maxDuration = 300; // Vercel: pengambilan Apify berjalan setelah respons (after)

export const metadata: Metadata = { title: 'Permintaan riset baru' };

export default async function BaruPage() {
  await requireUser();
  return (
    <div style={{ maxWidth: 720 }}>
      <h1>Permintaan riset baru</h1>
      <p className="small">Permintaan masuk antrean. Data diambil oleh kolektor Shopee, lalu dashboard terisi otomatis.</p>
      <RisetForm />
    </div>
  );
}
