import type { Metadata } from 'next';
import { requireUser } from '@/lib/session';
import { apifyAktif } from '@/lib/riset-apify';
import { supabaseServer } from '@/lib/supabase/server';
import CariClient from './CariClient';

export const maxDuration = 300; // pencarian menunggu aktor Apify
export const metadata: Metadata = { title: 'Pencarian' };

export default async function CariPage() {
  const me = await requireUser();
  const sb = await supabaseServer();
  const { data: wl } = await sb.from('watchlist').select('product_id').limit(1000);
  const tersimpan = (wl ?? []).map((w: { product_id: string }) => w.product_id);
  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Penemuan Produk &amp; Perbandingan Harga</h1>
          <p className="small">Cari beberapa kata kunci sekaligus di Shopee. Hasil disimpan sebagai riwayat harga.</p>
        </div>
      </div>
      {apifyAktif() ? null : <p className="banner">Sumber data belum aktif: isi <code>APIFY_TOKEN</code> di environment server agar pencarian berjalan.</p>}
      <CariClient bisaCari={apifyAktif() && me.role !== 'viewer'} tersimpan={tersimpan} bisaSimpan={me.role !== 'viewer'} />
    </>
  );
}
