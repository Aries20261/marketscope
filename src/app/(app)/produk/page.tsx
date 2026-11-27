import type { Metadata } from 'next';
import { requireUser } from '@/lib/session';
import { apifyAktif } from '@/lib/riset-apify';
import ProdukClient from './ProdukClient';

export const maxDuration = 300; // menunggu aktor Apify
export const metadata: Metadata = { title: 'Buat produk' };

export default async function ProdukPage() {
  const me = await requireUser();
  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Buat produk</h1>
          <p className="small">Dari produk terlaris ke konsep produk baru: bahan, celah ulasan, rancangan, dan promosi.</p>
        </div>
      </div>
      <ProdukClient bisa={apifyAktif() && me.role !== 'viewer'} />
    </>
  );
}
