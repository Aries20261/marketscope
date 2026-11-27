import Link from 'next/link';
import type { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = { title: 'Masuk' };

export default function LoginPage() {
  return (
    <main className="wrap">
      <div className="card narrow">
        <h1 style={{ fontSize: 24 }}>Masuk</h1>
        <p className="small">Belum punya akun? <Link href="/daftar">Daftar</Link>. Akun aktif setelah diverifikasi superadmin.</p>
        <LoginForm />
        <p className="small" style={{ marginTop: 16 }}><Link href="/">Kembali ke halaman depan</Link></p>
      </div>
    </main>
  );
}
