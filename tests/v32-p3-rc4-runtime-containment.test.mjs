import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const ux=fs.readFileSync(new URL('../src/ui/v31-ux-polish.js',import.meta.url),'utf8');
const finished=fs.readFileSync(new URL('../src/ui/finished-goods-warehouse-refinement.js',import.meta.url),'utf8');
const bootstrap=fs.readFileSync(new URL('../src/app/ref01-bootstrap.js',import.meta.url),'utf8');

test('P3 RC4 operational Bahan & Gudang entry prefers V3 workspace and does not directly open visible Inventory V2',()=>{
  assert.match(ux,/__SJ_V32_INVENTORY_WORKSPACE/);
  assert.match(ux,/\.open\?\.\('summary'\)/);
  assert.doesNotMatch(ux,/data-sj-v31-materials[\s\S]{0,900}SJInventoryV2\?\.open/);
});

test('P3 RC4 finished goods fails closed when V3 inventory presentation is unavailable',()=>{
  assert.match(finished,/function requireV3Inventory/);
  assert.doesNotMatch(finished,/runtime\?\.SJInventoryV2\?\.open\?\.\('purchase'\)/);
  assert.doesNotMatch(finished,/runtime\?\.SJInventoryV2\?\.open\?\.\('transfer'\)/);
  assert.doesNotMatch(finished,/runtime\?\.SJInventoryV2\?\.open\?\.\('opname'\)/);
  assert.doesNotMatch(finished,/runtime\?\.SJInventoryV2\?\.open\?\.\('movements'\)/);
});

test('P3 RC4 retries V3 inventory install during enhancement when initial bootstrap was too early',()=>{
  assert.match(bootstrap,/let inventoryWorkspace=installInventoryWorkspaceV32\(runtime\)/);
  assert.match(bootstrap,/function ensureInventoryWorkspaceV32\(\)/);
  assert.match(bootstrap,/if\(!inventoryWorkspace\?\.installed\)inventoryWorkspace=installInventoryWorkspaceV32\(runtime\)/);
  assert.match(bootstrap,/ensureInventoryWorkspaceV32\(\);/);
});

test('P3 RC4 settings Bahan & Gudang bypasses SC03 captured legacy inventory.open command',()=>{
  assert.match(bootstrap,/key==='settings\.materials-warehouse'/);
  assert.match(bootstrap,/key==='settings\.materials-warehouse'[^\n]+ensureInventoryWorkspaceV32\(\)[^\n]+v3\.open\?\.\('summary'\)/);
});

test('P3 RC4 LOCAL QA badge exposes whether V3 inventory presentation is actually installed',()=>{
  const qa=fs.readFileSync(new URL('../scripts/local-qa-html.mjs',import.meta.url),'utf8');
  assert.match(qa,/__SJ_V32_INVENTORY_WORKSPACE/);
  assert.match(qa,/INV3/);
});
