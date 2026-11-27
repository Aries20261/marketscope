'use client';

import { useActionState } from 'react';
import { changePasswordAction } from './actions';
import type { FormState } from '@/app/login/actions';

export default function ChangeForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(changePasswordAction, {});
  return (
    <form action={action} noValidate>
      <label className="f" htmlFor="password">Password baru</label>
      <input id="password" name="password" type="password" autoComplete="new-password" required />
      <label className="f" htmlFor="again">Ulangi password baru</label>
      <input id="again" name="again" type="password" autoComplete="new-password" required />
      <p className="small">Minimal 10 karakter, berisi huruf dan angka.</p>
      {state.error ? <p className="err" role="alert">{state.error}</p> : null}
      <button className="btn primary" style={{ width: '100%', marginTop: 8 }} disabled={pending}>
        {pending ? 'Menyimpan…' : 'Simpan password'}
      </button>
    </form>
  );
}
