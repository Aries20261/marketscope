import 'server-only';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export type Role = 'superadmin' | 'admin' | 'analis' | 'viewer';
export type Plan = 'gratis' | 'bulanan' | 'empat_bulan' | 'lifetime';

export interface Profile {
  id: string;
  email: string;
  nama: string;
  role: Role;
  plan: Plan;
  plan_expires_at: string | null;
  aktif: boolean;
  verifikasi: 'menunggu' | 'disetujui' | 'ditolak';
  must_change_password: boolean;
}

/** Profil pengguna yang login, dibaca lewat service role setelah identitas diverifikasi dengan getUser(). */
export async function getProfile(): Promise<Profile | null> {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  if (!data.user) return null;
  const { data: p } = await supabaseAdmin()
    .from('profiles')
    .select('id,email,nama,role,plan,plan_expires_at,aktif,verifikasi,must_change_password')
    .eq('id', data.user.id)
    .maybeSingle();
  return (p as Profile | null) ?? null;
}

/** Wajib login, aktif, dan sudah mengganti password awal. */
export async function requireUser(opts: { allowMustChange?: boolean } = {}): Promise<Profile> {
  const p = await getProfile();
  if (!p || !p.aktif) redirect('/login');
  if (p.must_change_password && !opts.allowMustChange) redirect('/ganti-password');
  return p;
}

export async function requireAdmin(): Promise<Profile> {
  const p = await requireUser();
  if (p.role !== 'admin' && p.role !== 'superadmin') redirect('/beranda');
  return p;
}

export async function audit(userId: string, action: string, entity: string, entityId: string, detail: object = {}) {
  await supabaseAdmin().from('audit_log').insert({ user_id: userId, action, entity, entity_id: entityId, detail });
}
