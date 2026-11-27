'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkPasswordStrength } from '@/lib/password';

export interface RegisterState { error?: string; ok?: boolean }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Pendaftaran mandiri: akun dibuat nonaktif dan menunggu verifikasi superadmin. */
export async function registerAction(_p: RegisterState, fd: FormData): Promise<RegisterState> {
  // Kolom jebakan untuk bot: manusia tidak melihat dan tidak mengisinya.
  if (String(fd.get('website') ?? '') !== '') return { ok: true };

  const email = String(fd.get('email') ?? '').trim().toLowerCase();
  const nama = String(fd.get('nama') ?? '').trim().slice(0, 80);
  const password = String(fd.get('password') ?? '');
  const again = String(fd.get('again') ?? '');
  if (!nama) return { error: 'Isi nama Anda.' };
  if (!EMAIL_RE.test(email) || email.length > 120) return { error: 'Email tidak valid.' };
  if (password !== again) return { error: 'Konfirmasi password tidak sama.' };
  const weak = checkPasswordStrength(password);
  if (weak) return { error: weak };

  const sb = supabaseAdmin();
  const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
  // Jawaban sama untuk email baru dan yang sudah ada agar daftar email tidak bisa ditebak.
  if (error || !data.user) return { ok: true };
  const { error: pErr } = await sb.from('profiles').insert({
    id: data.user.id, email, nama, role: 'viewer', plan: 'gratis', aktif: false, verifikasi: 'menunggu', must_change_password: false
  });
  if (pErr) {
    await sb.auth.admin.deleteUser(data.user.id);
    return { error: 'Pendaftaran gagal. Coba lagi.' };
  }
  await sb.from('audit_log').insert({ user_id: data.user.id, action: 'user.register', entity: 'profile', entity_id: data.user.id, detail: { email } });
  return { ok: true };
}
