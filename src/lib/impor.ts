import { parseCsv } from './riset-calc.ts';

export const MAX_BARIS_IMPOR = 1000;
export const MAX_KARAKTER_IMPOR = 900_000;

/** Membaca isi file hasil kolektor: JSON (`{ "items": [...] }` atau larik) atau CSV dengan baris judul. */
export function bacaImpor(teks: string, namaFile: string): Record<string, unknown>[] {
  const t = teks.replace(/^﻿/, '').trim();
  if (!t) return [];
  if (/\.json$/i.test(namaFile) || t.startsWith('{') || t.startsWith('[')) {
    const j = JSON.parse(t) as unknown;
    const arr = Array.isArray(j) ? j : (j as { items?: unknown }).items;
    if (!Array.isArray(arr)) throw new Error('JSON harus berupa larik atau objek dengan kunci "items".');
    return arr.filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x));
  }
  return parseCsv(t);
}

/** Judul kolom yang wajib. `nama` boleh diganti `produk`. Kolom lain (marketplace, toko, stok, terjual, rating, kota, dll.) opsional. */
export const KOLOM_WAJIB = ['item_id', 'shop_id', 'nama', 'tanggal', 'harga'] as const;

export function kolomHilang(rows: Record<string, unknown>[]): string[] {
  if (rows.length === 0) return [];
  const ada = new Set(Object.keys(rows[0]).map((k) => k.trim().toLowerCase()));
  return KOLOM_WAJIB.filter((k) => !(ada.has(k) || (k === 'nama' && ada.has('produk'))));
}
