import Link from 'next/link';
import { logoutAction } from '@/app/login/actions';

const I: Record<string, string> = {
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  kw: 'M4 7h16M4 12h10M4 17h6',
  truck: 'M3 6h11v10H3zM14 9h4l3 3v4h-7M5 18a2 2 0 1 0 4 0 2 2 0 0 0-4 0M15 18a2 2 0 1 0 4 0 2 2 0 0 0-4 0',
  flask: 'M9 3h6M10 3v6L4.5 19a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 9V3',
  mark: 'M6 3h12v18l-6-4-6 4z',
  pulse: 'M3 12h4l3-8 4 16 3-8h4',
  up: 'M12 16V4m0 0-4 4m4-4 4 4M4 20h16'
};
function Icon({ k }: { k: string }) {
  return <svg className="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={I[k]} /></svg>;
}


/** Menu utama aplikasi. */
export default function AppNav({ isAdmin }: { isAdmin: boolean }) {
  return (
    <nav className="topnav" aria-label="Menu utama">
      <Link href="/cari"><Icon k="search" /><span>Pencarian</span></Link>
      <Link href="/riset"><Icon k="kw" /><span>Riset kata kunci</span></Link>
      <Link href="/suplier"><Icon k="truck" /><span>Riset suplier</span></Link>
      <Link href="/produk"><Icon k="flask" /><span>Buat produk</span></Link>
      <Link href="/watchlist"><Icon k="mark" /><span>Watchlist</span></Link>
      <Link href="/pantau"><Icon k="pulse" /><span>Pemantauan</span></Link>
      <Link href="/impor"><Icon k="up" /><span>Impor data</span></Link>
      {isAdmin ? <Link href="/admin">Admin</Link> : null}
      <Link href="/ganti-password">Ganti password</Link>
      <form action={logoutAction}><button type="submit">Keluar</button></form>
    </nav>
  );
}
