// Perhitungan murni (tanpa dependensi) untuk riset permintaan. Diuji di tests/riset-calc.test.ts.

export interface Terjual { min: number; exact: boolean }

/** Mengubah teks jumlah terjual Shopee ("563", "2RB+", "1,2RB", "10RB+", "1JT+") menjadi batas bawah. */
export function parseTerjual(label: string): Terjual | null {
  const raw = String(label ?? '').trim().toUpperCase().replace(/\s+/g, '');
  if (!raw) return null;
  const m = raw.match(/^([\d.,]+)(RB|JT)?(\+)?$/);
  if (!m) return null;
  let numText = m[1];
  const unit = m[2];
  const plus = !!m[3];
  if (unit) {
    numText = numText.replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(numText)) {
    numText = numText.replace(/\./g, '');
  } else {
    numText = numText.replace(',', '.');
  }
  const n = Number(numText);
  if (!Number.isFinite(n) || n < 0) return null;
  const mult = unit === 'RB' ? 1000 : unit === 'JT' ? 1_000_000 : 1;
  return { min: Math.round(n * mult), exact: !unit && !plus };
}

/** Omzet minimum = harga tampil x batas bawah terjual. Selalu batas bawah, sepanjang umur produk. */
export function omzetMin(harga: number, terjualMin: number): number {
  return Math.max(0, Math.round(harga)) * Math.max(0, Math.round(terjualMin));
}

export interface SnapshotPoint { tanggal: string; terjual: number; harga: number; exact: boolean }
export interface MonthlySales { bulan: string; unit: number; omzet: number }

/**
 * Penjualan bulanan dari selisih snapshot berurutan. Hanya selisih antara dua titik yang sama-sama
 * eksak (bukan "RB+") yang dihitung, karena angka yang dibulatkan tidak bisa dikurangkan dengan jujur.
 * Selisih disimpan pada bulan titik yang lebih baru.
 */
export function monthlyFromSnapshots(series: Record<string, SnapshotPoint[]>): MonthlySales[] {
  const acc = new Map<string, MonthlySales>();
  for (const points of Object.values(series)) {
    const sorted = [...points].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
    for (let i = 1; i < sorted.length; i++) {
      const a = sorted[i - 1];
      const b = sorted[i];
      if (!a.exact || !b.exact) continue;
      const delta = b.terjual - a.terjual;
      if (delta < 0) continue;
      const bulan = b.tanggal.slice(0, 7);
      const cur = acc.get(bulan) ?? { bulan, unit: 0, omzet: 0 };
      cur.unit += delta;
      cur.omzet += delta * b.harga;
      acc.set(bulan, cur);
    }
  }
  return [...acc.values()].sort((x, y) => x.bulan.localeCompare(y.bulan));
}

export interface RisetRow {
  id: string;
  nama: string;
  toko: string;
  kota: string | null;
  kategori: string | null;
  harga: number;
  terjualLabel: string;
  rating: number | null;
  satuan?: string | null;
}
export interface ComputedRow extends RisetRow { terjualMin: number; exact: boolean; omzetMin: number }
export interface Bar { label: string; value: number; sub?: string }
export interface TokoRingkas { nama: string; kota: string; badge?: string; rating?: number; produk: number; pengikut?: number; omzetMin: number }

export interface Dashboard {
  rows: ComputedRow[];
  kpi: { produk: number; toko: number; terjualMin: number; omzetMin: number; hargaMedian: number };
  top: Bar[];
  perToko: Bar[];
  perKota: Bar[];
  perKategori: Bar[];
  harga: Bar[];
  catatan: string[];
}

export function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

const BANDS: [string, number, number][] = [
  ['< Rp1 rb', 0, 1_000], ['Rp1–5 rb', 1_000, 5_000], ['Rp5–20 rb', 5_000, 20_000],
  ['Rp20–50 rb', 20_000, 50_000], ['Rp50–100 rb', 50_000, 100_000], ['≥ Rp100 rb', 100_000, Infinity]
];

function groupSum(rows: ComputedRow[], key: (r: ComputedRow) => string, limit: number): Bar[] {
  const m = new Map<string, { value: number; n: number }>();
  for (const r of rows) {
    const k = key(r) || 'Tidak diketahui';
    const cur = m.get(k) ?? { value: 0, n: 0 };
    cur.value += r.omzetMin;
    cur.n += 1;
    m.set(k, cur);
  }
  return [...m.entries()]
    .map(([label, v]) => ({ label, value: v.value, sub: `${v.n} produk` }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function buildDashboard(input: RisetRow[]): Dashboard {
  const rows: ComputedRow[] = [];
  for (const r of input) {
    const t = parseTerjual(r.terjualLabel);
    if (!t || !Number.isFinite(r.harga) || r.harga < 0) continue;
    rows.push({ ...r, terjualMin: t.min, exact: t.exact, omzetMin: omzetMin(r.harga, t.min) });
  }
  const rounded = rows.filter((r) => !r.exact).length;
  const catatan = [
    'Omzet minimum = harga tampil x batas bawah jumlah terjual. Ini batas bawah sepanjang umur produk, bukan omzet sebenarnya dan bukan per bulan.',
    'Harga tampil biasanya varian termurah dan belum dikurangi diskon atau biaya.'
  ];
  if (rounded > 0) catatan.push(`${rounded} dari ${rows.length} produk memakai angka terjual yang dibulatkan (mis. "10RB+"), sehingga urutan di antara produk teratas tidak bisa dibedakan.`);
  if (input.length > rows.length) catatan.push(`${input.length - rows.length} baris dilewati karena harga atau jumlah terjual tidak terbaca.`);

  return {
    rows,
    kpi: {
      produk: rows.length,
      toko: new Set(rows.map((r) => r.toko)).size,
      terjualMin: rows.reduce((s, r) => s + r.terjualMin, 0),
      omzetMin: rows.reduce((s, r) => s + r.omzetMin, 0),
      hargaMedian: median(rows.map((r) => r.harga))
    },
    top: [...rows].sort((a, b) => b.omzetMin - a.omzetMin).slice(0, 10)
      .map((r) => ({ label: r.nama, value: r.omzetMin, sub: `${r.toko} · ${r.terjualLabel} terjual` })),
    perToko: groupSum(rows, (r) => r.toko, 8),
    perKota: groupSum(rows, (r) => r.kota ?? '', 8),
    perKategori: groupSum(rows, (r) => r.kategori ?? '', 8),
    harga: BANDS.map(([label, lo, hi]) => ({ label, value: rows.filter((r) => r.harga >= lo && r.harga < hi).length })),
    catatan
  };
}

export const rp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
export const num = (n: number) => new Intl.NumberFormat('id-ID').format(n);
export function rpShort(n: number): string {
  if (n >= 1e9) return `Rp${(n / 1e9).toFixed(1).replace('.', ',')} M`;
  if (n >= 1e6) return `Rp${(n / 1e6).toFixed(1).replace('.', ',')} jt`;
  if (n >= 1e3) return `Rp${Math.round(n / 1e3)} rb`;
  return `Rp${n}`;
}

/** Parser CSV kecil (kutip ganda, koma). Baris pertama = header. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let q = false;
  const src = text.replace(/^﻿/, '');
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { cur.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      cur.push(field); field = '';
      if (cur.some((x) => x !== '')) rows.push(cur);
      cur = [];
    } else field += c;
  }
  cur.push(field);
  if (cur.some((x) => x !== '')) rows.push(cur);
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])));
}
