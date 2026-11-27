// Analisis tema keluhan dari ulasan bintang 1 (tanpa model bahasa: pencocokan kata kunci bahasa Indonesia).
// Hasilnya indikasi, bukan statistik: sampel kecil, dan kata kunci bisa melewatkan atau salah menggolongkan kalimat.

export interface Ulasan { itemId: string; comment: string }

export const TEMA: { nama: string; kata: string[] }[] = [
  { nama: 'Kemasan rusak, bocor, atau penyok', kata: ['bocor', 'rusak', 'penyok', 'pecah', 'tumpah', 'remuk', 'kemasan jelek', 'packing jelek', 'packing kurang', 'tidak rapi', 'tutup longgar', 'tutupnya'] },
  { nama: 'Isi sedikit atau tidak penuh', kata: ['isi sedikit', 'isinya sedikit', 'isi kurang', 'isinya kurang', 'tidak penuh', 'kurang penuh', 'isi tidak sesuai', 'cuma setengah', 'setengah'] },
  { nama: 'Segel hilang atau tidak ada', kata: ['segel', 'tidak tersegel', 'sudah dibuka', 'bekas dibuka', 'tidak ada seal', 'tanpa seal', 'seal'] },
  { nama: 'Salah kirim atau paket kurang', kata: ['salah kirim', 'salah varian', 'salah warna', 'salah ukuran', 'tidak sesuai pesanan', 'tidak lengkap', 'kurang satu', 'barang kurang', 'tidak dikirim', 'bonus tidak'] },
  { nama: 'Pengiriman lama', kata: ['pengiriman lama', 'lama sekali', 'lama banget', 'kelamaan', 'telat', 'terlambat', 'sampai lama', 'lambat'] },
  { nama: 'Tidak sesuai deskripsi atau foto', kata: ['tidak sesuai', 'beda dengan foto', 'beda sama foto', 'tidak seperti', 'zonk', 'kecewa', 'berbeda dengan'] },
  { nama: 'Kualitas jelek atau cacat', kata: ['jelek', 'cacat', 'kualitas', 'murahan', 'tipis', 'luntur', 'sobek', 'robek', 'bau', 'tidak berfungsi', 'mati', 'rusak parah'] },
  { nama: 'Produk diduga palsu atau KW', kata: ['palsu', 'kw', 'tidak original', 'bukan original', 'ori', 'tiruan', 'abal'] },
  { nama: 'Ukuran tidak pas', kata: ['kekecilan', 'kebesaran', 'ukuran tidak', 'size tidak', 'ukuran beda', 'tidak muat', 'sempit', 'kekecil', 'kebesar'] },
  { nama: 'Perih, iritasi, atau jerawat', kata: ['perih', 'iritasi', 'jerawat', 'gatal', 'merah', 'breakout', 'alergi', 'panas di kulit', 'burning'] },
  { nama: 'Tekstur atau konsistensi tidak enak', kata: ['encer', 'terlalu cair', 'lengket', 'kental', 'berminyak', 'tekstur', 'whitecast', 'keras'] },
  { nama: 'Penjual atau layanan buruk', kata: ['tidak ramah', 'penjual', 'seller', 'tidak respon', 'tidak direspon', 'diabaikan', 'cs ', 'komplain'] }
];

export interface HasilTema {
  jumlahUlasan: number;
  tema: { nama: string; perProduk: number[]; total: number }[];
}

const norm = (s: string) => ` ${s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ')} `;

/** Satu ulasan boleh masuk ke beberapa tema. Urutan kolom perProduk mengikuti `produkIds`. */
export function analisisTema(ulasan: Ulasan[], produkIds: string[]): HasilTema {
  const idx = new Map(produkIds.map((id, i) => [id, i]));
  const tema = TEMA.map((t) => ({ nama: t.nama, perProduk: produkIds.map(() => 0), total: 0 }));
  let n = 0;
  for (const u of ulasan) {
    const col = idx.get(String(u.itemId));
    const teks = norm(String(u.comment ?? ''));
    if (col === undefined || teks.trim() === '') continue;
    n++;
    TEMA.forEach((t, i) => {
      if (t.kata.some((k) => teks.includes(k.includes(' ') || k.endsWith(' ') ? ` ${k.trim()} ` : ` ${k}`))) {
        tema[i].perProduk[col]++;
        tema[i].total++;
      }
    });
  }
  return { jumlahUlasan: n, tema: tema.filter((t) => t.total > 0).sort((a, b) => b.total - a.total) };
}
