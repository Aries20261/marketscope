import Link from 'next/link';
import { requireUser } from '@/lib/session';
import { logoutAction } from '@/app/login/actions';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await requireUser();
  const isAdmin = me.role === 'admin' || me.role === 'superadmin';
  return (
    <>
      <header className="top">
        <div className="topin">
          <Link className="logo" href="/beranda">MarketScope <b>Indonesia</b></Link>
          <nav className="topnav" aria-label="Menu utama">
            <Link href="/beranda">Beranda</Link>
            <Link href="/riset">Riset permintaan</Link>
            {isAdmin ? <Link href="/admin">Admin</Link> : null}
            <Link href="/ganti-password">Ganti password</Link>
            <form action={logoutAction}><button type="submit">Keluar</button></form>
          </nav>
        </div>
      </header>
      <main className="wrap">{children}</main>
    </>
  );
}
