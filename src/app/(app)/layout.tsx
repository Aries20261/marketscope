import Link from 'next/link';
import { requireUser } from '@/lib/session';
import AppNav from '@/components/AppNav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await requireUser();
  const isAdmin = me.role === 'admin' || me.role === 'superadmin';
  return (
    <>
      <header className="top">
        <div className="topin">
          <Link className="logo" href="/beranda">MarketScope <b>Indonesia</b></Link>
          <AppNav isAdmin={isAdmin} />
        </div>
      </header>
      <main className="wrap">{children}</main>
    </>
  );
}
