import Link from 'next/link';
import type { Metadata } from 'next';
import RegisterForm from './RegisterForm';

export const metadata: Metadata = { title: 'Daftar' };

export default function RegisterPage() {
  return (
    <main className="wrap">
      <div className="card narrow">
        <h1 style={{ fontSize: 24 }}>Daftar</h1>
        <p className="small">Akun baru dimulai di paket Gratis dan aktif setelah diverifikasi superadmin.</p>
        <RegisterForm />
        <p className="small" style={{ marginTop: 16 }}>Sudah punya akun? <Link href="/login">Masuk</Link></p>
      </div>
    </main>
  );
}
