import { statusTarget } from './watchlist.ts';

export interface ItemPantau {
  produkId: string;
  nama: string;
  toko: string;
  target: number | null;
  /** Snapshot harga, urutan bebas. */
  snaps: { tanggal: string; harga: number }[];
}
export interface Peringatan {
  jenis: 'turun' | 'target';
  produkId: string;
  judul: string;
  detail: string;
  tanggal: string;
}

const rp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

/**
 * Peringatan dari snapshot harian produk di watchlist:
 * - turun: harga snapshot terbaru turun minimal `turunPersen` persen dari snapshot sebelumnya;
 * - target: harga terbaru sama dengan atau di bawah harga target.
 * Stok dan flash sale tidak dihitung karena tidak ada di data sumber.
 */
export function hitungPeringatan(items: ItemPantau[], turunPersen: number): Peringatan[] {
  const out: Peringatan[] = [];
  for (const it of items) {
    const s = [...it.snaps].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    const now = s[0];
    if (!now) continue;
    const prev = s[1];
    if (prev && prev.harga > 0) {
      const persen = ((prev.harga - now.harga) / prev.harga) * 100;
      if (persen >= turunPersen) {
        out.push({ jenis: 'turun', produkId: it.produkId, tanggal: now.tanggal,
          judul: `${it.nama} turun ${persen.toFixed(1).replace('.', ',')}% di Shopee`,
          detail: `${it.toko} · ${rp(prev.harga)} → ${rp(now.harga)} (${now.tanggal})` });
      }
    }
    if (it.target !== null && statusTarget(now.harga, it.target) === 'tercapai') {
      out.push({ jenis: 'target', produkId: it.produkId, tanggal: now.tanggal,
        judul: `Harga target tercapai: ${it.nama}`,
        detail: `${rp(now.harga)} di bawah target ${rp(it.target)} (${now.tanggal})` });
    }
  }
  return out.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}
