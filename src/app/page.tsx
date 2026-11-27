import Link from 'next/link';

const PLANS = [
  { id: 'gratis', nama: 'Gratis', harga: 'Rp0', per: '', tag: '', fitur: ['Pencarian dari data tersimpan', 'Watchlist dasar', 'Impor data'], cta: 'Daftar' },
  { id: 'bulanan', nama: 'Bulanan', harga: 'Rp30.000', per: '/bulan', tag: '', fitur: ['Semua fitur riset', 'Riset suplier dan Buat produk', 'Unduh PDF', 'Pemantauan dan peringatan'], cta: 'Daftar' },
  { id: 'empat_bulan', nama: '4 Bulan', harga: 'Rp100.000', per: '/4 bulan', tag: 'Hemat 17%', fitur: ['Semua fitur paket Bulanan', 'Setara Rp25.000 per bulan'], cta: 'Daftar' },
  { id: 'lifetime', nama: 'Lifetime', harga: 'Rp1.000.000', per: 'sekali bayar', tag: 'Terbaik untuk jangka panjang', fitur: ['Semua fitur tanpa batas waktu', 'Pembaruan fitur berikutnya'], cta: 'Daftar' }
];

export default function Home() {
  return (
    <>
      <header className="top">
        <div className="topin">
          <Link className="logo" href="/">MarketScope <b>Indonesia</b></Link>
          <nav className="topnav" aria-label="Menu">
            <a href="#fitur">Fitur</a>
            <a href="#harga">Harga</a>
            <Link href="/daftar">Daftar</Link>
            <Link href="/login">Masuk</Link>
          </nav>
        </div>
      </header>
      <main className="wrap">
        <section className="hero">
          <h1>Temukan produk yang laku, harga yang wajar, dan celah yang belum diisi</h1>
          <p>Riset kata kunci, bandingkan harga antar marketplace, cari suplier, dan susun konsep produk baru dari data ulasan dan bahan.</p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <Link className="btn primary" href="/daftar">Daftar</Link>
            <Link className="btn" href="/login">Masuk</Link>
            <Link className="btn" href="/contoh">Lihat contoh hasil</Link>
            <a className="btn" href="#harga">Lihat harga</a>
          </div>
        </section>

        <section id="fitur" className="features" aria-label="Fitur">
          {[
            ['Pencarian dan perbandingan harga', 'Beberapa kata kunci sekaligus, riwayat harga, label terlaris dan termurah.'],
            ['Riset kata kunci dan suplier', 'Distribusi harga, konsentrasi toko, celah pasar, dan kalkulator margin.'],
            ['Buat produk', 'Dari produk terlaris ke bahan, celah ulasan, rancangan, angle promosi, dan laporan PDF.']
          ].map(([t, d]) => (
            <div className="card" key={t}><h3>{t}</h3><p className="small" style={{ marginBottom: 0 }}>{d}</p></div>
          ))}
        </section>

        <section id="harga" aria-labelledby="h-harga">
          <h2 id="h-harga" style={{ fontSize: 26 }}>Harga</h2>
          <p className="small">Daftar lalu tunggu verifikasi superadmin. Pembayaran (mayar.id atau transfer rekening) segera tersedia; sampai saat itu paket diaktifkan manual oleh superadmin.</p>
          <div className="pricing">
            {PLANS.map((p) => (
              <div key={p.id} className={`card plan${p.id === 'empat_bulan' ? ' best' : ''}`}>
                {p.tag ? <span className="tag">{p.tag}</span> : <span style={{ height: 22 }} />}
                <h3>{p.nama}</h3>
                <div className="price">{p.harga} <small>{p.per}</small></div>
                <ul>{p.fitur.map((f) => <li key={f}>{f}</li>)}</ul>
                <Link className={`btn${p.id === 'empat_bulan' ? ' primary' : ''}`} href="/daftar">{p.cta}</Link>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer className="site">© MarketScope Indonesia. Data dari marketplace dapat berbeda dari harga di toko.</footer>
    </>
  );
}
