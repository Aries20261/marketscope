'use client';

import { useActionState } from 'react';
import { registerAction, type RegisterState } from './actions';

export default function RegisterForm() {
  const [s, action, pending] = useActionState<RegisterState, FormData>(registerAction, {});
  if (s.ok) {
    return (
      <div className="ok" role="status">
        Pendaftaran diterima. Akun Anda aktif setelah diverifikasi superadmin. Coba masuk lagi nanti.
      </div>
    );
  }
  return (
    <form action={action} noValidate>
      <label className="f" htmlFor="nama">Nama</label>
      <input id="nama" name="nama" type="text" maxLength={80} autoComplete="name" required />
      <label className="f" htmlFor="email">Email</label>
      <input id="email" name="email" type="email" autoComplete="username" required />
      <label className="f" htmlFor="password">Password</label>
      <input id="password" name="password" type="password" autoComplete="new-password" required />
      <label className="f" htmlFor="again">Ulangi password</label>
      <input id="again" name="again" type="password" autoComplete="new-password" required />
      <p className="small">Minimal 10 karakter, berisi huruf dan angka.</p>
      <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
        <label htmlFor="website">Jangan diisi</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {s.error ? <p className="err" role="alert">{s.error}</p> : null}
      <button className="btn primary" style={{ width: '100%', marginTop: 8 }} disabled={pending}>
        {pending ? 'Mengirim…' : 'Daftar'}
      </button>
    </form>
  );
}
