import test from 'node:test';
import assert from 'node:assert/strict';
import { hitungPeringatan } from '../src/lib/pantau.ts';

const base = { produkId: 'p1', nama: 'Headphone', toko: 'Toko A', target: null as number | null };

test('peringatan harga turun memakai dua snapshot terbaru', () => {
  const r = hitungPeringatan([{ ...base, snaps: [{ tanggal: '2026-11-26', harga: 100000 }, { tanggal: '2026-11-27', harga: 90300 }] }], 8);
  assert.equal(r.length, 1);
  assert.equal(r[0].jenis, 'turun');
  assert.match(r[0].judul, /9,7%/);
});

test('tidak ada peringatan bila turun di bawah ambang atau hanya satu snapshot', () => {
  assert.equal(hitungPeringatan([{ ...base, snaps: [{ tanggal: '2026-11-26', harga: 100000 }, { tanggal: '2026-11-27', harga: 97000 }] }], 8).length, 0);
  assert.equal(hitungPeringatan([{ ...base, snaps: [{ tanggal: '2026-11-27', harga: 50000 }] }], 8).length, 0);
});

test('peringatan target tercapai', () => {
  const r = hitungPeringatan([{ ...base, target: 1200000, snaps: [{ tanggal: '2026-11-27', harga: 1159900 }] }], 8);
  assert.equal(r.length, 1);
  assert.equal(r[0].jenis, 'target');
  assert.equal(hitungPeringatan([{ ...base, target: 1000000, snaps: [{ tanggal: '2026-11-27', harga: 1159900 }] }], 8).length, 0);
});
