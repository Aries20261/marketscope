// Membuat superadmin pertama. Jalankan sekali setelah migrasi SQL diterapkan:
//   ADMIN_EMAIL=... ADMIN_INITIAL_PASSWORD=... NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed:admin
// Password awal tidak disimpan di kode dan pengguna wajib menggantinya saat login pertama.
import { createClient } from '@supabase/supabase-js';

const need = (n) => {
  const v = process.env[n];
  if (!v) { console.error(`Variabel ${n} belum diisi.`); process.exit(1); }
  return v;
};
const url = need('NEXT_PUBLIC_SUPABASE_URL');
const key = need('SUPABASE_SERVICE_ROLE_KEY');
const email = need('ADMIN_EMAIL').trim().toLowerCase();
const password = need('ADMIN_INITIAL_PASSWORD');

const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

let userId;
const created = await sb.auth.admin.createUser({ email, password, email_confirm: true });
if (created.error) {
  const list = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const found = list.data?.users.find((u) => u.email?.toLowerCase() === email);
  if (!found) { console.error('Gagal membuat pengguna:', created.error.message); process.exit(1); }
  userId = found.id;
  console.log('Pengguna sudah ada di Supabase Auth; hanya profil superadmin yang dipastikan.');
} else {
  userId = created.data.user.id;
}

const { data: existing } = await sb.from('profiles').select('id').eq('id', userId).maybeSingle();
const row = { id: userId, email, nama: 'Superadmin', role: 'superadmin', plan: 'lifetime', aktif: true };
const res = existing
  ? await sb.from('profiles').update({ role: 'superadmin', aktif: true }).eq('id', userId)
  : await sb.from('profiles').insert({ ...row, must_change_password: true });
if (res.error) { console.error('Gagal menyimpan profil:', res.error.message); process.exit(1); }
console.log(`Superadmin siap: ${email}. Wajib ganti password saat login pertama.`);
