// Fungsi murni untuk data suplier (normalisasi input/CSV, format, margin). Diuji di tests/suplier.test.ts.
import { median } from './riset-calc.ts';

export interface SuplierInput {
  nama: string;
  lokasi: string | null;
  produk: string | null;
  harga_modal: number;
  moq: number | null;
  respons_menit: number | null;
  skor: number | null;
  kontak: string | null;
  catatan: string | null;
}

const teks = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

/** "Rp 52.000", "52000", "52.000,50" -> 52000. Kosong atau tidak terbaca -> null. */
export function angka(v: unknown): number | null {
  const s = String(v ?? '').trim().replace(/,\d{1,2}$/, '');
  const d = s.replace(/\D/g, '');
  if (!d) return null;
  const n = Number(d);
  return Number.isSafeInteger(n) ? n : null;
}

/** "30 menit", "2 jam", "1 hari", "5" (jam) -> menit. Kosong atau tidak terbaca -> null. */
export function parseRespons(v: unknown): number | null {
  const s = String(v ?? '').trim().toLowerCase();
  if (!s) return null;
  const m = s.match(/^(\d+(?:[.,]\d+)?)\s*(menit|jam|hari)?$/);
  if (!m) return null;
  const n = Number(m[1].replace(',', '.'));
  const mult = m[2] === 'menit' ? 1 : m[2] === 'hari' ? 1440 : 60;
  return Math.round(n * mult);
}

export function formatRespons(menit: number | null): string {
  if (menit === null || menit === undefined) return '-';
  if (menit < 60) return `${menit} menit`;
  if (menit < 1440) return `${Math.round((menit / 60) * 10) / 10} jam`.replace('.', ',');
  return `${Math.round((menit / 1440) * 10) / 10} hari`.replace('.', ',');
}

/** Memeriksa satu baris (dari form atau CSV). Mengembalikan data bersih atau teks alasan penolakan. */
export function normalisasiSuplier(raw: Record<string, unknown>): SuplierInput | string {
  const nama = teks(raw.nama, 120);
  if (!nama) return 'nama wajib';
  const harga = angka(raw.harga_modal);
  if (harga === null) return 'harga_modal wajib berupa angka';
  const moqRaw = String(raw.moq ?? '').trim();
  const moq = moqRaw ? angka(moqRaw) : null;
  if (moqRaw && moq === null) return 'moq tidak terbaca';
  const resRaw = String(raw.respons ?? raw.respons_menit ?? '').trim();
  const respons = resRaw ? (raw.respons_menit !== undefined && raw.respons === undefined ? angka(resRaw) : parseRespons(resRaw)) : null;
  if (resRaw && respons === null) return 'respons tidak terbaca (mis. 2 jam, 1 hari)';
  const skorRaw = String(raw.skor ?? '').trim();
  const skor = skorRaw ? angka(skorRaw) : null;
  if (skorRaw && (skor === null || skor > 100)) return 'skor harus 0 sampai 100';
  return {
    nama, lokasi: teks(raw.lokasi, 80) || null, produk: teks(raw.produk, 120) || null, harga_modal: harga,
    moq, respons_menit: respons, skor, kontak: teks(raw.kontak, 120) || null, catatan: teks(raw.catatan, 300) || null
  };
}

export interface Margin { laba: number; persen: number }
/** Laba per pcs = harga jual - harga modal - biaya lain. Null bila harga jual belum diisi. */
export function hitungMargin(jual: number, modal: number, lain: number): Margin | null {
  if (!(jual > 0)) return null;
  const laba = jual - modal - lain;
  return { laba, persen: (laba / jual) * 100 };
}

/** Median harga jual dari harga produk Shopee tersimpan. Null bila tidak ada data. */
export function medianHarga(harga: number[]): number | null {
  const v = harga.filter((h) => Number.isFinite(h) && h > 0);
  return v.length ? median(v) : null;
}
