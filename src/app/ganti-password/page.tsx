import type { Metadata } from 'next';
import { requireUser } from '@/lib/session';
import ChangeForm from './ChangeForm';

export const metadata: Metadata = { title: 'Ganti password' };

export default async function ChangePasswordPage() {
  const me = await requireUser({ allowMustChange: true });
  return (
    <main className="wrap">
      <div className="card narrow">
        <h1 style={{ fontSize: 24 }}>Ganti password</h1>
        <p className="small">
          {me.must_change_password
            ? 'Password Anda masih password awal atau hasil reset. Ganti dulu sebelum melanjutkan.'
            : 'Pilih password baru untuk akun Anda.'}
        </p>
        <ChangeForm />
      </div>
    </main>
  );
}
