import test from 'node:test';
import assert from 'node:assert/strict';
import { mapApifyItem, mapApifyItems } from '../src/lib/apify-map.ts';
import { buildDashboard } from '../src/lib/riset-calc.ts';

const card = { shop_id: 12345678, item_id: 98765432100, name: 'Laptop Gaming', url: 'https://shopee.co.id/x', price: 14999000, rating: 4.9, sold_count: null, location: 'Jakarta Barat' };

test('mapApifyItem memetakan kartu mode keyword', () => {
  const r = mapApifyItem(card, '2026-11-27', 'laptop')!;
  assert.equal(r.shop_id, '12345678');
  assert.equal(r.item_id, '98765432100');
  assert.equal(r.produk, 'Laptop Gaming');
  assert.equal(r.harga, 14999000);
  assert.equal(r.terjual_tampil, '');
  assert.equal(r.kota, 'Jakarta Barat');
  assert.equal(r.rating, 4.9);
  assert.equal(r.toko, 'Toko 12345678');
});

test('mapApifyItem membawa harga coret dan jumlah ulasan', () => {
  const r = mapApifyItem({ ...card, original_price: 17500000, rating_count: 312 }, '2026-11-27', null)!;
  assert.equal(r.harga_coret, 17500000);
  assert.equal(r.jumlah_ulasan, 312);
  const k = mapApifyItem(card, '2026-11-27', null)!;
  assert.equal(k.harga_coret, null);
  assert.equal(k.jumlah_ulasan, null);
});

test('mapApifyItem menolak baris tanpa id/nama/harga dan membuang duplikat', () => {
  assert.equal(mapApifyItem({ ...card, price: null }, '2026-11-27', null), null);
  assert.equal(mapApifyItem({ ...card, item_id: null }, '2026-11-27', null), null);
  assert.equal(mapApifyItems([card, card, { ...card, item_id: 1 }], '2026-11-27', null).length, 2);
});

test('dashboard tetap tampil tanpa jumlah terjual dan omzet tidak dipalsukan', () => {
  const d = buildDashboard([{ id: 'a', nama: 'A', toko: 'T', kota: null, kategori: null, harga: 1000, terjualLabel: '', rating: null }]);
  assert.equal(d.kpi.produk, 1);
  assert.equal(d.kpi.omzetMin, 0);
  assert.ok(d.catatan.some((c) => c.includes('tidak memiliki data jumlah terjual')));
});

import { analisisKata } from '../src/lib/riset-calc.ts';

test('analisisKata: rentang, median, toko, porsi 5 teratas, dan bin', () => {
  const rows = [
    ...[10000, 20000, 30000, 40000, 50000, 60000].map((h, i) => ({ harga: h, toko: `T${i % 3}` })),
    { harga: 100000, toko: 'T9' }
  ];
  const a = analisisKata(rows)!;
  assert.equal(a.n, 7);
  assert.equal(a.min, 10000);
  assert.equal(a.max, 100000);
  assert.equal(a.median, 40000);
  assert.equal(a.toko, 4);
  assert.equal(a.top5Share, 1);
  assert.equal(a.bins.reduce((s, b) => s + b.value, 0), 7);
  assert.equal(analisisKata([]), null);
  assert.equal(analisisKata([{ harga: 5000, toko: 'A' }])!.bins.reduce((s, b) => s + b.value, 0), 1);
});
