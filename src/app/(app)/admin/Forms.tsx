'use client';

import { useActionState } from 'react';
import { createUserAction, resetPasswordAction, updateUserAction, verifyUserAction, type AdminState } from './actions';

const ROLES = ['viewer', 'analis', 'admin', 'superadmin'] as const;
const PLANS: [string, string][] = [['gratis', 'Gratis'], ['bulanan', 'Bulanan'], ['empat_bulan', '4 Bulan'], ['lifetime', 'Lifetime']];

function Result({ s }: { s: AdminState }) {
  return (
    <>
      {s.error ? <p className="err" role="alert">{s.error}</p> : null}
      {s.ok ? <p className="ok" role="status">{s.ok}</p> : null}
      {s.secret ? (
        <p className="ok" role="status">
          Password sekali tampil: <strong className="mono">{s.secret}</strong>
          <br /><span className="small">Salin sekarang. Password ini tidak bisa dilihat lagi.</span>
        </p>
      ) : null}
    </>
  );
}

export function CreateUserForm({ canMakeSuper }: { canMakeSuper: boolean }) {
  const [s, action, pending] = useActionState<AdminState, FormData>(createUserAction, {});
  return (
    <form action={action} className="card" noValidate>
      <h2>Tambah pengguna</h2>
      <div className="row" style={{ alignItems: 'flex-end' }}>
        <div style={{ flex: '2 1 220px' }}><label className="f" htmlFor="c-email">Email</label><input id="c-email" name="email" type="email" required /></div>
        <div style={{ flex: '1 1 160px' }}><label className="f" htmlFor="c-nama">Nama</label><input id="c-nama" name="nama" type="text" maxLength={80} /></div>
        <div style={{ flex: '1 1 130px' }}><label className="f" htmlFor="c-role">Peran</label>
          <select id="c-role" name="role" defaultValue="viewer">{ROLES.filter((r) => canMakeSuper || r !== 'superadmin').map((r) => <option key={r} value={r}>{r}</option>)}</select></div>
        <div style={{ flex: '1 1 130px' }}><label className="f" htmlFor="c-plan">Paket</label>
          <select id="c-plan" name="plan" defaultValue="gratis">{PLANS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div style={{ flex: '2 1 220px' }}><label className="f" htmlFor="c-pw">Password awal (kosongkan untuk acak)</label><input id="c-pw" name="password" type="password" autoComplete="new-password" /></div>
        <button className="btn primary" disabled={pending}>{pending ? 'Membuat…' : 'Tambah'}</button>
      </div>
      <Result s={s} />
    </form>
  );
}

export function UserRow({ u, me, canMakeSuper, locked }: {
  u: { id: string; email: string; nama: string; role: string; plan: string; aktif: boolean; must_change_password: boolean };
  me: string; canMakeSuper: boolean; locked: boolean;
}) {
  const [s, action, pending] = useActionState<AdminState, FormData>(updateUserAction, {});
  const [r, resetAction, resetting] = useActionState<AdminState, FormData>(resetPasswordAction, {});
  return (
    <tr>
      <td>{u.email}<div className="small">{u.nama}{u.id === me ? ' (Anda)' : ''}</div></td>
      <td>
        <form action={action} className="inline">
          <input type="hidden" name="id" value={u.id} />
          <select name="role" defaultValue={u.role} aria-label={`Peran ${u.email}`} disabled={locked}>
            {ROLES.filter((x) => canMakeSuper || x !== 'superadmin' || u.role === 'superadmin').map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
          <select name="plan" defaultValue={u.plan} aria-label={`Paket ${u.email}`} disabled={locked}>
            {PLANS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <label className="small"><input type="checkbox" name="aktif" defaultChecked={u.aktif} disabled={locked} /> aktif</label>
          <button className="btn" disabled={pending || locked}>{pending ? '…' : 'Simpan'}</button>
        </form>
        {s.error ? <div className="err" role="alert">{s.error}</div> : null}
        {s.ok ? <div className="small">{s.ok}</div> : null}
      </td>
      <td>
        {u.aktif ? <span className="pill good">aktif</span> : <span className="pill crit">nonaktif</span>}
        {u.must_change_password ? <div className="small">wajib ganti password</div> : null}
      </td>
      <td>
        <form action={resetAction}>
          <input type="hidden" name="id" value={u.id} />
          <button className="btn" disabled={resetting || locked}>{resetting ? '…' : 'Reset password'}</button>
        </form>
        <Result s={r} />
      </td>
    </tr>
  );
}

export function PendingRow({ u }: { u: { id: string; email: string; nama: string; created_at: string } }) {
  const [s, action, pending] = useActionState<AdminState, FormData>(verifyUserAction, {});
  return (
    <tr>
      <td>{u.email}<div className="small">{u.nama}</div></td>
      <td className="small">{new Date(u.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</td>
      <td>
        <form action={action} className="inline">
          <input type="hidden" name="id" value={u.id} />
          <select name="plan" defaultValue="gratis" aria-label={`Paket untuk ${u.email}`}>
            {PLANS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button className="btn primary" name="decision" value="setujui" disabled={pending}>Setujui</button>
          <button className="btn" name="decision" value="tolak" disabled={pending}>Tolak</button>
        </form>
        {s.error ? <div className="err" role="alert">{s.error}</div> : null}
        {s.ok ? <div className="small">{s.ok}</div> : null}
      </td>
    </tr>
  );
}
