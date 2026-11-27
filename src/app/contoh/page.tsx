import Link from 'next/link';
import type { Metadata } from 'next';
import RisetDashboard from '@/components/RisetDashboard';
import PrintButton from '@/components/PrintButton';
import { buildDashboard } from '@/lib/riset-calc';
import { getProfile } from '@/lib/session';
import { logoutAction } from '@/app/login/actions';
import { CONTOH_ROWS, CONTOH_TOKO } from '@/lib/contoh-riset';

export const metadata: Metadata = { title: 'Contoh hasil riset' };

export default async function Contoh() {
  // Halaman ini publik, tetapi pengguna yang sudah login tetap melihat menu aplikasi.
  const me = await getProfile();
  const loggedIn = Boolean(me && me.aktif);
  const isAdmin = me?.role === 'admin' || me?.role === 'superadmin';
  const d = buildDashboard(CONTOH_ROWS);
  return (
    <>
      <header className="top">
        <div className="topin">
          <Link className="logo" href={loggedIn ? '/beranda' : '/'}>MarketScope <b>Indonesia</b></Link>
          {loggedIn ? (
            <nav className="topnav" aria-label="Menu utama">
              <Link href="/beranda">Beranda</Link>
              <Link href="/riset">Riset permintaan</Link>
              {isAdmin ? <Link href="/admin">Admin</Link> : null}
              <Link href="/ganti-password">Ganti password</Link>
              <form action={logoutAction}><button type="submit">Keluar</button></form>
            </nav>
          ) : (
            <nav className="topnav" aria-label="Menu"><Link href="/daftar">Daftar</Link><Link href="/login">Masuk</Link></nav>
          )}
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
