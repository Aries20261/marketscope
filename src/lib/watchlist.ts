import { angka } from './suplier.ts';

export type StatusTarget = 'tanpa' | 'tercapai' | 'menunggu';

/** Harga target kosong = tanpa target. Tercapai bila harga kini sama dengan atau di bawah target. */
export function statusTarget(harga: number | null, target: number | null): StatusTarget {
  if (target === null || target === undefined) return 'tanpa';
  if (harga === null || harga === undefined) return 'menunggu';
  return harga <= target ? 'tercapai' : 'menunggu';
}

/** "45.000" -> 45000, kosong -> null (hapus target), tidak terbaca -> undefined (tolak). */
export function parseTarget(v: unknown): number | null | undefined {
  const s = String(v ?? '').trim();
  if (!s) return null;
  const n = angka(s);
  return n === null || n <= 0 ? undefined : n;
}
