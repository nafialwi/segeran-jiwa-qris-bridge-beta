import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {operationalGroupForLabel} from '../src/ui/v31-ux-polish.js';

const ROOT=path.resolve(new URL('..',import.meta.url).pathname);
test('P2 operational semantic grouping is deterministic',()=>{
  assert.equal(operationalGroupForLabel('Stok Barang Jadi'),'stock');
  assert.equal(operationalGroupForLabel('Bahan & Gudang'),'stock');
  assert.equal(operationalGroupForLabel('Restock'),'stock');
  assert.equal(operationalGroupForLabel('Shift'),'shift');
  assert.equal(operationalGroupForLabel('Catatan Shift'),'shift');
  assert.equal(operationalGroupForLabel('Pengeluaran'),'finance');
  assert.equal(operationalGroupForLabel('Refund'),'finance');
  assert.equal(operationalGroupForLabel('Kasbon Karyawan'),'finance');
});

test('P2 operational control center includes owner Bahan & Gudang shortcut through V3 presentation authority',()=>{
  const source=fs.readFileSync(path.join(ROOT,'src/ui/v31-ux-polish.js'),'utf8');
  assert.match(source,/Bahan &amp; Gudang/);
  assert.match(source,/__SJ_V32_INVENTORY_WORKSPACE/);
  assert.match(source,/v3\.open\?\.\('summary'\)/);
  assert.doesNotMatch(source,/SJInventoryV2\?\.open\?\.\('summary'\)/);
  assert.doesNotMatch(source,/\.set\(|\.update\(|\.transaction\(|\.remove\(/);
});

test('P2 active system uses role-aware operation columns for grouped control center',()=>{
  const css=fs.readFileSync(path.join(ROOT,'src/ui/ref01.css'),'utf8');
  for(const n of [1,2,3])assert.match(css,new RegExp(`data-sj-operation-cols="${n}"[^}]*\\.sj-v31-op-group-grid`));
});

test('P2 retains no Siap dijual copy on final sales surface',()=>{
  const source=fs.readFileSync(path.join(ROOT,'src/ui/v31-ux-polish.js'),'utf8');
  assert.match(source,/siap dijual/i);
  assert.match(source,/removeChild/);
});

test('P2 Bahan & Gudang operational shortcut fails closed until Owner role is explicit',async()=>{
  const mod=await import('../src/ui/v31-ux-polish.js');
  assert.equal(typeof mod.isOwnerOperationalRole,'function');
  assert.equal(mod.isOwnerOperationalRole(null),false);
  assert.equal(mod.isOwnerOperationalRole('kasir'),false);
  assert.equal(mod.isOwnerOperationalRole('cashier'),false);
  assert.equal(mod.isOwnerOperationalRole('owner'),true);
  assert.equal(mod.isOwnerOperationalRole('manajemen'),true);
});
