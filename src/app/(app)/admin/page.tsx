import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { CreateUserForm, PendingRow, UserRow } from './Forms';

export const metadata: Metadata = { title: 'Admin' };

export default async function AdminPage() {
  const me = await requireAdmin();
  const { data } = await supabaseAdmin()
    .from('profiles')
    .select('id,email,nama,role,plan,aktif,verifikasi,must_change_password,created_at')
    .order('created_at', { ascending: true });
  const all = data ?? [];
  const pending = all.filter((u) => u.verifikasi === 'menunggu');
  const users = all.filter((u) => u.verifikasi !== 'menunggu');
  const isSuper = me.role === 'superadmin';

  return (
    <>
      <h1>Admin</h1>
      <p className="small">Kelola pengguna, peran, paket, dan reset password. Semua perubahan tercatat di audit log.</p>
      <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
        {pending.length > 0 ? (
          <div className="card" style={{ borderColor: 'var(--amber)' }}>
            <h2>Menunggu verifikasi ({pending.length})</h2>
            <div className="tablewrap">
              <table>
                <thead><tr><th>Pendaftar</th><th>Waktu</th><th>Keputusan</th></tr></thead>
                <tbody>{pending.map((u) => <PendingRow key={u.id} u={u} />)}</tbody>
              </table>
            </div>
          </div>
        ) : null}
        <CreateUserForm canMakeSuper={isSuper} />
        <div className="card">
          <h2>Pengguna ({users.length})</h2>
          <div className="tablewrap">
            <table>
              <thead><tr><th>Pengguna</th><th>Peran, paket, status</th><th>Keadaan</th><th>Password</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <UserRow key={u.id} u={u} me={me.id} canMakeSuper={isSuper} locked={!isSuper && u.role === 'superadmin'} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
