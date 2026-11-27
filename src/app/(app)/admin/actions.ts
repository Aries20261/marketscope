'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin, audit, type Profile, type Role, type Plan } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkPasswordStrength, generatePassword } from '@/lib/password';

export interface AdminState { error?: string; ok?: string; secret?: string }

const ROLES: Role[] = ['superadmin', 'admin', 'analis', 'viewer'];
const PLANS: Plan[] = ['gratis', 'bulanan', 'empat_bulan', 'lifetime'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Admin boleh mengelola semua pengguna kecuali superadmin; hanya superadmin yang boleh menyentuh superadmin. */
function canManage(actor: Profile, target: { role: Role }): boolean {
  return actor.role === 'superadmin' || target.role !== 'superadmin';
}
function canAssign(actor: Profile, role: Role): boolean {
  return actor.role === 'superadmin' || role !== 'superadmin';
}

async function loadTarget(id: string) {
  const { data } = await supabaseAdmin().from('profiles').select('id,email,role,aktif').eq('id', id).maybeSingle();
  return data as { id: string; email: string; role: Role; aktif: boolean } | null;
}

export async function createUserAction(_p: AdminState, fd: FormData): Promise<AdminState> {
  const actor = await requireAdmin();
  const email = String(fd.get('email') ?? '').trim().toLowerCase();
  const nama = String(fd.get('nama') ?? '').trim().slice(0, 80);
  const role = String(fd.get('role') ?? 'viewer') as Role;
  const plan = String(fd.get('plan') ?? 'gratis') as Plan;
  let password = String(fd.get('password') ?? '');

  if (!EMAIL_RE.test(email)) return { error: 'Email tidak valid.' };
  if (!ROLES.includes(role) || !PLANS.includes(plan)) return { error: 'Peran atau paket tidak valid.' };
  if (!canAssign(actor, role)) return { error: 'Hanya superadmin yang boleh membuat superadmin.' };
  const generated = !password;
  if (generated) password = generatePassword();
  else {
    const weak = checkPasswordStrength(password);
    if (weak) return { error: weak };
  }

  const sb = supabaseAdmin();
  const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) return { error: 'Pengguna tidak dapat dibuat. Email mungkin sudah terdaftar.' };
  const { error: pErr } = await sb.from('profiles').insert({
    id: data.user.id, email, nama, role, plan, aktif: true, must_change_password: true
  });
  if (pErr) {
    await sb.auth.admin.deleteUser(data.user.id);
    return { error: 'Profil tidak dapat dibuat. Coba lagi.' };
  }
  await audit(actor.id, 'user.create', 'profile', data.user.id, { email, role, plan });
  revalidatePath('/admin');
  return { ok: `Pengguna ${email} dibuat. Pengguna wajib mengganti password saat login pertama.`, secret: generated ? password : undefined };
}

export async function updateUserAction(_p: AdminState, fd: FormData): Promise<AdminState> {
  const actor = await requireAdmin();
  const id = String(fd.get('id') ?? '');
  const role = String(fd.get('role') ?? '') as Role;
  const plan = String(fd.get('plan') ?? '') as Plan;
  const aktif = fd.get('aktif') === 'on';
  if (!ROLES.includes(role) || !PLANS.includes(plan)) return { error: 'Peran atau paket tidak valid.' };

  const target = await loadTarget(id);
  if (!target) return { error: 'Pengguna tidak ditemukan.' };
  if (!canManage(actor, target) || !canAssign(actor, role)) return { error: 'Anda tidak berhak mengubah pengguna ini.' };
  if (id === actor.id && (!aktif || role !== actor.role)) return { error: 'Anda tidak bisa menonaktifkan atau mengubah peran akun sendiri.' };

  const { error } = await supabaseAdmin()
    .from('profiles')
    .update({ role, plan, aktif, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: 'Perubahan tidak tersimpan.' };
  await audit(actor.id, 'user.update', 'profile', id, { role, plan, aktif });
  revalidatePath('/admin');
  return { ok: 'Tersimpan.' };
}

export async function resetPasswordAction(_p: AdminState, fd: FormData): Promise<AdminState> {
  const actor = await requireAdmin();
  const id = String(fd.get('id') ?? '');
  const target = await loadTarget(id);
  if (!target) return { error: 'Pengguna tidak ditemukan.' };
  if (!canManage(actor, target)) return { error: 'Anda tidak berhak mereset pengguna ini.' };

  const password = generatePassword();
  const sb = supabaseAdmin();
  const { error } = await sb.auth.admin.updateUserById(id, { password });
  if (error) return { error: 'Password tidak dapat direset.' };
  await sb.from('profiles').update({ must_change_password: true, updated_at: new Date().toISOString() }).eq('id', id);
  await audit(actor.id, 'user.reset_password', 'profile', id);
  revalidatePath('/admin');
  return { ok: `Password ${target.email} direset. Berikan password ini lewat jalur aman; pengguna wajib menggantinya.`, secret: password };
}

/** Verifikasi pendaftaran mandiri: admin dan superadmin. */
export async function verifyUserAction(_p: AdminState, fd: FormData): Promise<AdminState> {
  const actor = await requireAdmin();
  const id = String(fd.get('id') ?? '');
  const decision = String(fd.get('decision') ?? '');
  const plan = String(fd.get('plan') ?? 'gratis') as Plan;
  if (decision !== 'setujui' && decision !== 'tolak') return { error: 'Keputusan tidak valid.' };
  if (!PLANS.includes(plan)) return { error: 'Paket tidak valid.' };

  const target = await loadTarget(id);
  if (!target) return { error: 'Pengguna tidak ditemukan.' };
  const approve = decision === 'setujui';
  const { error } = await supabaseAdmin()
    .from('profiles')
    .update({ aktif: approve, verifikasi: approve ? 'disetujui' : 'ditolak', plan: approve ? plan : 'gratis', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('verifikasi', 'menunggu');
  if (error) return { error: 'Keputusan tidak tersimpan.' };
  await audit(actor.id, approve ? 'user.approve' : 'user.reject', 'profile', id, { email: target.email, plan });
  revalidatePath('/admin');
  return { ok: approve ? `${target.email} disetujui.` : `${target.email} ditolak.` };
}
