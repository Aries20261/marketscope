import type { RisetRow, TokoRingkas } from '@/lib/riset-calc';

/** Contoh nyata dari riset Shopee 27 Nov 2026 (digital printing, Ponorogo). Dipakai halaman /contoh. */
const M = 'M-Star Printing';
const H = 'Mahasenja Printing';
const r = (id: string, nama: string, toko: string, harga: number, terjual: string, rating: number | null, kategori: string): RisetRow =>
  ({ id, nama, toko, kota: 'Ponorogo', kategori, harga, terjualLabel: terjual, rating });

export const CONTOH_ROWS: RisetRow[] = [
  r('m1', 'Standing Banner 60x110 + rangka', M, 49000, '2RB+', 4.9, 'Standing banner'),
  r('m2', 'Cetak Banner/Spanduk/Baliho', M, 32670, '1RB+', 4.9, 'Banner / spanduk'),
  r('m3', 'Standing Banner 1 set', M, 49000, '563', 4.9, 'Standing banner'),
  r('m4', 'Stand Banner 2 sisi', M, 49000, '522', 4.9, 'Standing banner'),
  r('m5', 'Standing X tripod 60x110', M, 49000, '231', 4.8, 'Standing banner'),
  r('m6', 'Daftar menu A4 hard laminating', M, 39600, '218', 4.9, 'Cetak menu'),
  r('m7', 'Stiker cutting label kemasan', M, 20790, '92', 4.9, 'Stiker'),
  r('h1', 'Cetak Banner Premium gratis desain', H, 34300, '796', 4.9, 'Banner / spanduk'),
  r('h2', 'Standing Banner 60x110', H, 49000, '579', 4.9, 'Standing banner'),
  r('h3', 'Standing Banner Lipat 60x110', H, 49000, '426', 4.9, 'Standing banner'),
  r('h4', 'Standing Banner 60x110 (es teh, UMKM)', H, 49000, '395', 4.9, 'Standing banner'),
  r('h5', 'Standing Banner 60x110 (BRILink)', H, 49000, '168', 4.9, 'Standing banner')
];

export const CONTOH_TOKO: TokoRingkas[] = [
  { nama: 'M-Star Printing', kota: 'Ponorogo', badge: 'Star+, Verified', rating: 4.88, produk: 18, pengikut: 3856, omzetMin: 205_699_480 },
  { nama: 'Mahasenja Printing', kota: 'Ponorogo', badge: 'Star+, Verified', rating: 4.87, produk: 11, pengikut: 3391, omzetMin: 104_134_800 },
  { nama: 'DEENHAG.ID', kota: 'Ponorogo', rating: 4.85, produk: 49, pengikut: 2246, omzetMin: 37_076_374 },
  { nama: 'jawaraprinting', kota: 'Ponorogo', rating: 4.91, produk: 153, pengikut: 997, omzetMin: 3_616_000 },
  { nama: 'Undangan & Print Kilat', kota: 'Ponorogo', badge: 'Star+, Verified', rating: 4.81, produk: 8, pengikut: 1924, omzetMin: 990_000 },
  { nama: 'exist_digital23', kota: 'Ponorogo', rating: 4.97, produk: 41, pengikut: 73, omzetMin: 1_700_000 },
  { nama: 'BIRRU PRINTING', kota: 'Tulungagung', rating: 4.92, produk: 6, pengikut: 405, omzetMin: 1_075_000 }
];
