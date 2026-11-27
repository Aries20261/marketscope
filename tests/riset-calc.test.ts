import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTerjual, omzetMin, monthlyFromSnapshots, buildDashboard, parseCsv, median } from '../src/lib/riset-calc.ts';

test('parseTerjual membaca angka eksak dan pembulatan', () => {
  assert.deepEqual(parseTerjual('563'), { min: 563, exact: true });
  assert.deepEqual(parseTerjual('2RB+'), { min: 2000, exact: false });
  assert.deepEqual(parseTerjual('10RB+'), { min: 10000, exact: false });
  assert.deepEqual(parseTerjual('1,2RB'), { min: 1200, exact: false });
  assert.deepEqual(parseTerjual('1.234'), { min: 1234, exact: true });
  assert.deepEqual(parseTerjual('1JT+'), { min: 1_000_000, exact: false });
  assert.equal(parseTerjual('abc'), null);
  assert.equal(parseTerjual(''), null);
});

test('omzetMin = harga x batas bawah (cocok dengan laporan M-Star)', () => {
  assert.equal(omzetMin(49000, 2000), 98_000_000);
  assert.equal(omzetMin(32670, 1000), 32_670_000);
  assert.equal(omzetMin(49000, 563), 27_587_000);
});

test('monthlyFromSnapshots hanya memakai titik eksak berurutan', () => {
  const r = monthlyFromSnapshots({
    a: [
      { tanggal: '2026-11-27', terjual: 563, harga: 49000, exact: true },
      { tanggal: '2026-12-27', terjual: 600, harga: 50000, exact: true }
    ],
    b: [
      { tanggal: '2026-11-27', terjual: 2000, harga: 49000, exact: false },
      { tanggal: '2026-12-27', terjual: 2100, harga: 49000, exact: false }
    ],
    c: [
      { tanggal: '2026-11-27', terjual: 100, harga: 1000, exact: true },
      { tanggal: '2026-12-27', terjual: 90, harga: 1000, exact: true }
    ]
  });
  assert.deepEqual(r, [{ bulan: '2026-12', unit: 37, omzet: 1_850_000 }]);
});

test('buildDashboard menjumlahkan dan memberi catatan pembulatan', () => {
  const d = buildDashboard([
    { id: '1', nama: 'A', toko: 'T1', kota: 'Ponorogo', kategori: 'Banner', harga: 49000, terjualLabel: '2RB+', rating: 4.9 },
    { id: '2', nama: 'B', toko: 'T1', kota: 'Ponorogo', kategori: 'Banner', harga: 49000, terjualLabel: '563', rating: null },
    { id: '3', nama: 'C', toko: 'T2', kota: 'Madiun', kategori: null, harga: 1000, terjualLabel: 'rusak', rating: null }
  ]);
  assert.equal(d.kpi.produk, 2);
  assert.equal(d.kpi.toko, 1);
  assert.equal(d.kpi.omzetMin, 98_000_000 + 27_587_000);
  assert.equal(d.top[0].label, 'A');
  assert.ok(d.catatan.some((c) => c.includes('dibulatkan')));
  assert.ok(d.catatan.some((c) => c.includes('dilewati')));
});

test('parseCsv membaca baseline dan kutipan', () => {
  const rows = parseCsv('tanggal,toko,produk,harga\n2026-11-27,"Toko, A","Banner ""besar""",49000\n');
  assert.deepEqual(rows, [{ tanggal: '2026-11-27', toko: 'Toko, A', produk: 'Banner "besar"', harga: '49000' }]);
});

test('median', () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([1, 2, 3, 4]), 3);
  assert.equal(median([]), 0);
});
