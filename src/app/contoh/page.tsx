import Link from 'next/link';
import type { Metadata } from 'next';
import RisetDashboard from '@/components/RisetDashboard';
import PrintButton from '@/components/PrintButton';
import { buildDashboard } from '@/lib/riset-calc';
import { CONTOH_ROWS, CONTOH_TOKO } from '@/lib/contoh-riset';

export const metadata: Metadata = { title: 'Contoh hasil riset' };

export default function Contoh() {
  const d = buildDashboard(CONTOH_ROWS);
  return (
    <>
      <header className="top">
        <div className="topin">
          <Link className="logo" href="/">MarketScope <b>Indonesia</b></Link>
          <nav className="topnav" aria-label="Menu"><Link href="/daftar">Daftar</Link><Link href="/login">Masuk</Link></nav>
        </div>
      </header>
      <main className="wrap">
        <div className="pagehead">
          <div>
            <h1>Digital printing, Ponorogo</h1>
            <p className="small">Contoh hasil riset: kata kunci digital printing dan toko di Ponorogo, Shopee, diambil 27 November 2026. Hanya 12 produk dari 2 toko yang diambil rinci; tabel toko memakai ringkasan riset yang sama.</p>
          </div>
          <PrintButton />
        </div>
        <p className="banner">Ini contoh dari riset nyata, bukan data live. Angka omzet adalah batas bawah (lihat catatan di bawah dashboard).</p>
        <RisetDashboard d={d} monthly={[]} tokoRingkas={CONTOH_TOKO}
          snapshotNote="Titik awal 27 Nov 2026 sudah tersimpan. Penjualan per bulan muncul setelah data diambil ulang sekitar 27 Des 2026, dari selisih jumlah terjual untuk produk dengan angka eksak (di bawah 1.000)." />
      </main>
    </>
  );
}
