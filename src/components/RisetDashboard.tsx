import { Columns, HBars, MonthlyLine } from '@/components/Charts';
import { num, rp, rpShort, type Dashboard, type MonthlySales, type TokoRingkas } from '@/lib/riset-calc';

export default function RisetDashboard({ d, monthly, tokoRingkas, snapshotNote }: {
  d: Dashboard; monthly: MonthlySales[]; tokoRingkas?: TokoRingkas[]; snapshotNote?: string;
}) {
  return (
    <div className="rd">
      <section className="kpis" aria-label="Ringkasan">
        <div className="card kpi"><div className="l">Produk tercatat</div><div className="v mono">{num(d.kpi.produk)}</div></div>
        <div className="card kpi"><div className="l">Toko</div><div className="v mono">{num(d.kpi.toko)}</div></div>
        <div className="card kpi"><div className="l">Terjual (batas bawah)</div><div className="v mono">{num(d.kpi.terjualMin)}</div></div>
        <div className="card kpi"><div className="l">Omzet minimum*</div><div className="v mono">{rpShort(d.kpi.omzetMin)}</div><div className="small">{rp(d.kpi.omzetMin)}</div></div>
      </section>

      <div className="two">
        <section className="card"><h2>Produk teratas</h2><p className="small">Urut omzet minimum*, 10 teratas</p><HBars rows={d.top} /></section>
        <section className="card"><h2>Omzet minimum* per toko</h2><p className="small">Dari produk yang tercatat</p><HBars rows={d.perToko} /></section>
      </div>

      <div className="two">
        <section className="card"><h2>Distribusi harga tampil</h2><p className="small">Jumlah produk per rentang harga</p><Columns rows={d.harga} /><p className="small">Median harga tampil {rp(d.kpi.hargaMedian)}</p></section>
        <section className="card"><h2>Omzet minimum* per kota</h2><p className="small">Dari kota yang tampil di listing</p><HBars rows={d.perKota} /></section>
      </div>

      {d.perKategori.length > 0 && !(d.perKategori.length === 1 && d.perKategori[0].label === 'Tidak diketahui') ? (
        <section className="card"><h2>Omzet minimum* per kategori</h2><HBars rows={d.perKategori} /></section>
      ) : null}

      <section className="card">
        <h2>Penjualan bulanan</h2>
        {monthly.length > 0 ? (
          <>
            <p className="small">Dari selisih dua pengambilan data berurutan, hanya untuk produk dengan angka terjual eksak.</p>
            <MonthlyLine data={monthly} />
          </>
        ) : (
          <p className="small" style={{ marginBottom: 0 }}>
            {snapshotNote ?? 'Belum ada dua titik data. Penjualan per bulan baru bisa dihitung setelah data diambil ulang; sampai saat itu grafik ini kosong.'}
          </p>
        )}
      </section>

      {tokoRingkas && tokoRingkas.length > 0 ? (
        <section className="card">
          <h2>Ringkasan toko</h2>
          <div className="tablewrap"><table><thead><tr><th>Toko</th><th>Kota</th><th>Badge</th><th className="r">Rating</th><th className="r">Produk</th><th className="r">Pengikut</th><th className="r">Omzet minimum*</th></tr></thead>
            <tbody>{tokoRingkas.map((t) => (
              <tr key={t.nama}><td>{t.nama}</td><td>{t.kota}</td><td>{t.badge ?? '-'}</td>
                <td className="r mono">{t.rating ? String(t.rating).replace('.', ',') : '-'}</td><td className="r mono">{t.produk}</td>
                <td className="r mono">{t.pengikut ? num(t.pengikut) : '-'}</td><td className="r mono">{rp(t.omzetMin)}</td></tr>
            ))}</tbody></table></div>
        </section>
      ) : null}

      <section className="card">
        <h2>Daftar produk</h2>
        <div className="tablewrap"><table><thead><tr><th>Produk</th><th>Toko</th><th>Kota</th><th className="r">Harga tampil</th><th className="r">Terjual</th><th className="r">Rating</th><th className="r">Omzet minimum*</th></tr></thead>
          <tbody>{[...d.rows].sort((a, b) => b.omzetMin - a.omzetMin).map((r) => (
            <tr key={r.id}><td style={{ whiteSpace: 'normal' }}>{r.nama}</td><td>{r.toko}</td><td>{r.kota ?? '-'}</td>
              <td className="r mono">{rp(r.harga)}</td><td className="r mono">{r.terjualLabel}</td>
              <td className="r mono">{r.rating ? String(r.rating).replace('.', ',') : '-'}</td><td className="r mono">{rp(r.omzetMin)}</td></tr>
          ))}</tbody></table></div>
      </section>

      <section className="card note-card" aria-label="Catatan">
        <h3>*Cara membaca angka</h3>
        <ul>{d.catatan.map((c) => <li key={c}>{c}</li>)}</ul>
      </section>
    </div>
  );
}
