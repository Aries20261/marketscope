'use client';

import { useActionState } from 'react';
import { loginAction, type FormState } from './actions';

export default function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});
  return (
    <form action={action} noValidate>
      <label className="f" htmlFor="email">Email</label>
      <input id="email" name="email" type="email" autoComplete="username" required />
      <label className="f" htmlFor="password">Password</label>
      <input id="password" name="password" type="password" autoComplete="current-password" required />
      {state.error ? <p className="err" role="alert">{state.error}</p> : null}
      <button className="btn primary" style={{ width: '100%', marginTop: 16 }} disabled={pending}>
        {pending ? 'Memeriksa…' : 'Masuk'}
      </button>
    </form>
  );
}
