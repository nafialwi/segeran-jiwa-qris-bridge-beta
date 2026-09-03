import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCupInventoryRowsV34 } from '../src/domain/packaging-cup-v34.js';
import { renderCupInventorySectionV34 } from '../src/ui/inventory-workspace-v32.js';

test('P5 Batch-2 Inventory V3 renders all five Cup/Kemasan rows separately from Bahan Baku',()=>{
  const cups=buildCupInventoryRowsV34({
    ingredients:{A:{name:'Cup 10 Oz',unit:'pcs',category:'KEMASAN CUP'},B:{name:'Cup 22 Oz Datar',unit:'pcs',category:'KEMASAN CUP'}},
    balances:{ingredients:{A:{outlet:12,warehouse:50},B:{outlet:20,warehouse:40}}},
    costs:{ingredients:{A:{wac:350,source:'PURCHASE'},B:{wac:500,source:'PURCHASE'}}}
  });
  const html=renderCupInventorySectionV34(cups,{readOnly:false});
  assert.match(html,/Kemasan &amp; Cup/);
  assert.match(html,/Cup 10 Oz/);
  assert.match(html,/Cup 16 Oz/);
  assert.match(html,/Cup 22 Oz Datar Polos/);
  assert.match(html,/Cup 22 Oz Datar/);
  assert.match(html,/Cup 22 Oz Oval/);
  assert.match(html,/Gerai/);assert.match(html,/Gudang/);assert.match(html,/WAC/);
  assert.match(html,/Siapkan Master Cup/);
});

test('P5 Batch-2 LOCAL QA shows missing cup setup as local-only simulation without enabling production writer',()=>{
  const cups=buildCupInventoryRowsV34({});
  const html=renderCupInventorySectionV34(cups,{readOnly:true});
  assert.match(html,/Simulasikan Master Cup · LOCAL ONLY/);
  assert.doesNotMatch(html,/data-v34-cup-setup[^>]*disabled/);
  assert.match(html,/Belum terdaftar/);
});
