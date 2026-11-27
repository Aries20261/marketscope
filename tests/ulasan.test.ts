import test from 'node:test';
import assert from 'node:assert/strict';
import { analisisTema } from '../src/lib/ulasan-map.ts';

test('analisisTema menghitung tema per produk dan mengurutkan dari yang terbanyak', () => {
  const r = analisisTema([
    { itemId: '1', comment: 'Kemasan bocor dan isinya sedikit banget' },
    { itemId: '1', comment: 'Packing rusak, penyok semua' },
    { itemId: '2', comment: 'Pengiriman lama sekali, kecewa' },
    { itemId: '2', comment: 'Bagus kok' },
    { itemId: '9', comment: 'bocor' },
    { itemId: '1', comment: '' }
  ], ['1', '2']);
  assert.equal(r.jumlahUlasan, 4);
  assert.equal(r.tema[0].nama, 'Kemasan rusak, bocor, atau penyok');
  assert.deepEqual(r.tema[0].perProduk, [2, 0]);
  const isi = r.tema.find((t) => t.nama.startsWith('Isi sedikit'))!;
  assert.deepEqual(isi.perProduk, [1, 0]);
  const kirim = r.tema.find((t) => t.nama === 'Pengiriman lama')!;
  assert.deepEqual(kirim.perProduk, [0, 1]);
  assert.ok(r.tema.every((t) => t.total > 0));
});

test('analisisTema tanpa ulasan', () => {
  assert.deepEqual(analisisTema([], ['1']), { jumlahUlasan: 0, tema: [] });
});

import { requireToken } from '../src/lib/env.ts';
test('requireToken membersihkan salah-salin umum', () => {
  for (const raw of ['apify_api_X1 ', '"apify_api_X1"', 'Bearer apify_api_X1', 'APIFY_TOKEN=apify_api_X1\n', "'apify_api_X1'"]) {
    process.env.APIFY_TOKEN = raw;
    assert.equal(requireToken('APIFY_TOKEN'), 'apify_api_X1');
  }
});
