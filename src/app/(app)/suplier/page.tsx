import Link from 'next/link';
import type { Metadata } from 'next';
import { requireUser } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { formatRespons, medianHarga } from '@/lib/suplier';
import SuplierForm, { type SuplierRow } from './SuplierForm';
import ImporForm from './ImporForm';
import Kalkulator from './Kalkulator';
import { hapusSuplierAction } from './actions';

export const metadata: Metadata = { title: 'Riset suplier' };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const rp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
/** Membuang karakter yang bermakna khusus di filter PostgREST dan pola ILIKE. */
const bersih = (s: string) => s.replace(/[,()%_*\\"]/g, ' ').trim().slice(0, 60);
const satu = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export default async function SuplierPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const me = await requireUser();
  const sp = await searchParams;
  const q = bersih(satu(sp.q));
  const lokasi = satu(sp.lokasi).slice(0, 80);
  const urut = ['skor', 'harga', 'moq'].includes(satu(sp.urut)) ? satu(sp.urut) : 'skor';
  const editId = satu(sp.edit);
  const bisaTulis = me.role !== 'viewer';
  const admin = me.role === 'admin' || me.role === 'superadmin';

  const sb = await supabaseServer();
  let query = sb.from('suplier').select('id,nama,lokasi,produk,harga_modal,moq,respons_menit,skor,kontak,catatan,created_by').limit(300);
  if (q) query = query.or(`nama.ilike.%${q}%,produk.ilike.%${q}%`);
  if (lokasi) query = query.eq('lokasi', lokasi);
  query = urut === 'harga' ? query.order('harga_modal', { ascending: true })
    : urut === 'moq' ? query.order('moq', { ascending: true, nullsFirst: false })
    : query.order('skor', { ascending: false, nullsFirst: false });
  const [{ data }, { data: lok }] = await Promise.all([query, sb.from('suplier').select('lokasi').not('lokasi', 'is', null).limit(1000)]);
  const rows = (data ?? []) as (SuplierRow & { created_by: string | null })[];
  const lokasiList = [...new Set((lok ?? []).map((l: { lokasi: string | null }) => l.lokasi as string))].sort();

  let editRow: SuplierRow | null = null;
  if (bisaTulis && UUID.test(editId)) {
    const { data: e } = await sb.from('suplier').select('id,nama,lokasi,produk,harga_modal,moq,respons_menit,skor,kontak,catatan').eq('id', editId).maybeSingle();
    editRow = (e as SuplierRow | null) ?? null;
  }

  // Harga jual awal: median harga produk Shopee tersimpan (dari Pencarian dan Riset kata kunci) untuk kata yang dicari.
  let median: number | null = null;
  let nProduk = 0;
  if (q) {
    const { data: prods } = await sb.from('products').select('id').ilike('nama', `%${q}%`).limit(150);
    const ids = (prods ?? []).map((p: { id: string }) => p.id);
    if (ids.length) {
      const { data: snaps } = await sb.from('snapshots').select('product_id,harga,tanggal').in('product_id', ids).order('tanggal', { ascending: false }).limit(2000);
      const last = new Map<string, number>();
      for (const s of (snaps ?? []) as { product_id: string; harga: number }[]) if (!last.has(s.product_id)) last.set(s.product_id, Number(s.harga));
      nProduk = last.size;
      median = medianHarga([...last.values()]);
    }
  }
  const termurah = rows.length ? Math.min(...rows.map((r) => r.harga_modal)) : null;
  const sumber = q
    ? median
      ? `Harga jual awal diisi dari median ${nProduk} produk Shopee tersimpan untuk “${q}”. Anda bisa mengubahnya.`
      : `Belum ada data Shopee tersimpan untuk “${q}”. Jalankan Pencarian atau Riset kata kunci dulu, atau isi harga jual manual.`
    : 'Cari produk di atas agar harga jual awal diisi dari median data Shopee tersimpan, atau isi manual.';

  return (
    <>
      <div className="pagehead">
        <div><h1>Riset suplier</h1><p className="small">Cari pemasok, bandingkan harga modal, dan hitung margin.</p></div>
      </div>
      <form className="card" method="get" action="/suplier">
        <div className="row">
          <input type="text" name="q" className="grow" defaultValue={q} placeholder="Ketik produk, bahan, atau nama suplier" aria-label="Produk atau suplier" />
          <select name="lokasi" defaultValue={lokasi} aria-label="Lokasi" style={{ width: 'auto' }}>
            <option value="">Semua lokasi</option>{lokasiList.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select name="urut" defaultValue={urut} aria-label="Urutkan" style={{ width: 'auto' }}>
            <option value="skor">Skor tertinggi</option><option value="harga">Harga termurah</option><option value="moq">MOQ terendah</option>
          </select>
          <button className="btn primary">Cari</button>
        </div>
      </form>

      <div className="two" style={{ marginTop: 16, alignItems: 'start' }}>
        <section className="card">
          <h2>Hasil suplier</h2>
          <p className="small">{rows.length} suplier{q || lokasi ? ' ditemukan' : ' tersimpan'}</p>
          {rows.length === 0 ? (
            <div className="empty" style={{ marginTop: 0 }}><b>{q || lokasi ? 'Tidak ada suplier' : 'Belum ada suplier'}</b>
              {q || lokasi ? 'Coba kata yang lebih umum, atau ' : ''}{bisaTulis ? 'tambahkan suplier atau impor CSV di bawah.' : 'Analis atau admin dapat menambahkan suplier.'}</div>
          ) : (
            <div className="tablewrap"><table style={{ minWidth: 640 }}>
              <thead><tr><th>Suplier</th><th>Lokasi</th><th className="r">Harga modal</th><th className="r">MOQ</th><th className="r">Respons</th><th className="r">Skor</th><th /></tr></thead>
              <tbody>{rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.nama}{r.produk ? <div className="small">{r.produk}</div> : null}</td>
                  <td>{r.lokasi ?? '-'}</td>
                  <td className="r mono">{rp(r.harga_modal)}{r.harga_modal === termurah && rows.length > 1 ? <div className="small">termurah</div> : null}</td>
                  <td className="r mono">{r.moq !== null ? `${r.moq} pcs` : '-'}</td>
                  <td className="r">{formatRespons(r.respons_menit)}</td>
                  <td className="r">{r.skor !== null ? <span className={`pill ${r.skor >= 88 ? 'good' : r.skor >= 82 ? '' : 'crit'}`}>{r.skor}</span> : '-'}</td>
                  <td className="r" style={{ whiteSpace: 'nowrap' }}>
                    {bisaTulis && (r.created_by === me.id || admin) ? (
                      <div className="inline" style={{ justifyContent: 'flex-end' }}>
                        <Link className="btn" href={`/suplier?edit=${r.id}`}>Ubah</Link>
                        <form action={hapusSuplierAction}><input type="hidden" name="id" value={r.id} /><button className="btn">Hapus</button></form>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </section>
        <Kalkulator key={`${q}|${median}`} jualAwal={median} modalAwal={termurah} sumber={sumber} />
      </div>

      {bisaTulis ? (
        <div className="two" style={{ marginTop: 16, alignItems: 'start' }}>
          <SuplierForm edit={editRow} />
          <ImporForm />
        </div>
      ) : null}
      <p className="small" style={{ marginTop: 16 }}>Data suplier berasal dari input manual atau impor, tidak diambil otomatis dari situs suplier. Skor diisi sendiri.</p>
    </>
  );
}
