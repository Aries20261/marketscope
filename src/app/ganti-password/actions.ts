'use server';

import { redirect } from 'next/navigation';
import { requireUser, audit } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkPasswordStrength } from '@/lib/password';
import type { FormState } from '@/app/login/actions';

export async function changePasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireUser({ allowMustChange: true });
  const pw = String(fd.get('password') ?? '');
  const again = String(fd.get('again') ?? '');
  if (pw !== again) return { error: 'Konfirmasi password tidak sama.' };
  const weak = checkPasswordStrength(pw);
  if (weak) return { error: weak };

  const sb = await supabaseServer();
  const { error } = await sb.auth.updateUser({ password: pw });
  if (error) return { error: 'Password tidak dapat diganti. Pilih password lain.' };

  await supabaseAdmin()
    .from('profiles')
    .update({ must_change_password: false, updated_at: new Date().toISOString() })
    .eq('id', me.id);
  await audit(me.id, 'password.change', 'profile', me.id);
  redirect('/beranda');
}
