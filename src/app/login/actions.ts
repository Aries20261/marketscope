'use server';

import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export interface FormState { error?: string }

export async function loginAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get('email') ?? '').trim().toLowerCase();
  const password = String(fd.get('password') ?? '');
  if (!email || !password) return { error: 'Isi email dan password.' };

  const sb = await supabaseServer();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: 'Email atau password salah.' };

  const { data: p } = await supabaseAdmin()
    .from('profiles')
    .select('aktif,verifikasi,must_change_password')
    .eq('id', data.user.id)
    .maybeSingle();
  if (!p || !p.aktif) {
    await sb.auth.signOut();
    if (p?.verifikasi === 'menunggu') return { error: 'Pendaftaran Anda menunggu verifikasi superadmin. Coba lagi setelah disetujui.' };
    if (p?.verifikasi === 'ditolak') return { error: 'Pendaftaran Anda tidak disetujui.' };
    return { error: 'Akun tidak aktif. Hubungi admin.' };
  }
  redirect(p.must_change_password ? '/ganti-password' : '/beranda');
}

export async function logoutAction() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  redirect('/');
}
