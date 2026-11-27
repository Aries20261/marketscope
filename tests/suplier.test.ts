import test from 'node:test';
import assert from 'node:assert/strict';
import { angka, parseRespons, formatRespons, normalisasiSuplier, hitungMargin, medianHarga } from '../src/lib/suplier.ts';

test('angka membaca format rupiah Indonesia', () => {
  assert.equal(angka('Rp 52.000'), 52000);
  assert.equal(angka('52000'), 52000);
  assert.equal(angka('52.000,50'), 52000);
  assert.equal(angka(''), null);
  assert.equal(angka('abc'), null);
});

test('respons: menit, jam, hari', () => {
  assert.equal(parseRespons('30 menit'), 30);
  assert.equal(parseRespons('2 jam'), 120);
  assert.equal(parseRespons('1 hari'), 1440);
  assert.equal(parseRespons('5'), 300);
  assert.equal(parseRespons('cepat'), null);
  assert.equal(formatRespons(120), '2 jam');
  assert.equal(formatRespons(1440), '1 hari');
  assert.equal(formatRespons(null), '-');
});

test('normalisasiSuplier menerima baris valid dan menolak yang rusak', () => {
  const ok = normalisasiSuplier({ nama: ' CV Maju ', lokasi: 'Bandung', harga_modal: 'Rp 52.000', moq: '24', respons: '2 jam', skor: '92' });
  assert.deepEqual(ok, { nama: 'CV Maju', lokasi: 'Bandung', produk: null, harga_modal: 52000, moq: 24, respons_menit: 120, skor: 92, kontak: null, catatan: null });
  assert.equal(normalisasiSuplier({ nama: '', harga_modal: '1' }), 'nama wajib');
  assert.equal(normalisasiSuplier({ nama: 'A', harga_modal: '' }), 'harga_modal wajib berupa angka');
  assert.equal(normalisasiSuplier({ nama: 'A', harga_modal: '1', skor: '101' }), 'skor harus 0 sampai 100');
  assert.match(String(normalisasiSuplier({ nama: 'A', harga_modal: '1', respons: 'cepat' })), /respons/);
});

test('hitungMargin dan medianHarga', () => {
  const m = hitungMargin(84500, 52000, 14000)!;
  assert.equal(m.laba, 18500);
  assert.equal(m.persen.toFixed(1), '21.9');
  assert.equal(hitungMargin(0, 1, 1), null);
  assert.equal(medianHarga([10, 30, 20]), 20);
  assert.equal(medianHarga([]), null);
});
