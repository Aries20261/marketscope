import { createServerClient, type CookieOptions } from '@supabase/ssr';

type CookieToSet = { name: string; value: string; options: CookieOptions };
import { cookies } from 'next/headers';
import { requireEnv } from '@/lib/env';

/** Klien Supabase atas nama pengguna yang sedang login (tunduk pada RLS). */
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL'), requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'), {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list: CookieToSet[]) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* dipanggil dari Server Component: middleware yang menyegarkan sesi */
        }
      }
    }
  });
}
