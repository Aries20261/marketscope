import test from 'node:test';
import assert from 'node:assert/strict';
import { bacaImpor, kolomHilang } from '../src/lib/impor.ts';

test('bacaImpor membaca CSV dan JSON', () => {
  const csv = bacaImpor('item_id,shop_id,nama,tanggal,harga\n1,2,Kaos,2026-11-27,45000\n', 'a.csv');
  assert.equal(csv.length, 1);
  assert.equal(csv[0].nama, 'Kaos');
  assert.equal(bacaImpor('{"items":[{"item_id":"1"}]}', 'a.json').length, 1);
  assert.equal(bacaImpor('[{"item_id":"1"},{"item_id":"2"}]', 'x.json').length, 2);
  assert.equal(bacaImpor('', 'a.csv').length, 0);
  assert.throws(() => bacaImpor('{"x":1}', 'a.json'));
});

test('kolomHilang melaporkan kolom wajib yang tidak ada', () => {
  assert.deepEqual(kolomHilang([{ item_id: '1', shop_id: '2', nama: 'A', tanggal: 'x', harga: '1' }]), []);
  assert.deepEqual(kolomHilang([{ item_id: '1', shop_id: '2', produk: 'A', tanggal: 'x', harga: '1' }]), []);
  assert.deepEqual(kolomHilang([{ item_id: '1', nama: 'A' }]), ['shop_id', 'tanggal', 'harga']);
});
