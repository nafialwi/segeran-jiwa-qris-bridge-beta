import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCupInventoryRowsV34 } from '../src/domain/packaging-cup-v34.js';
import { renderCupInventorySectionV34, renderInventoryWorkspaceV32, routeLegacyInventoryTabV32 } from '../src/ui/inventory-workspace-v32.js';

test('CUP-CONTROL-V1 removes all Cup/Kemasan cards from Inventory V2 operational UI',()=>{
  const cups=buildCupInventoryRowsV34({ingredients:{A:{name:'Cup 10 Oz'},B:{name:'Cup 22 Oz Datar'}},balances:{ingredients:{A:{outlet:12,warehouse:50},B:{outlet:20,warehouse:40}}}});
  assert.equal(renderCupInventorySectionV34(cups,{readOnly:false}),'');
});

test('CUP-CONTROL-V1 Inventory workspace has no Cup or reconciliation operational tab',()=>{
  const html=renderInventoryWorkspaceV32({tab:'summary',rows:[],productRows:[],activities:[]});
  for(const label of ['Ringkasan','Stok','Aktivitas','Lainnya'])assert.match(html,new RegExp(label));
  assert.doesNotMatch(html,/Kemasan &amp; Cup|Siapkan Master Cup|data-v34-cup-setup|>Rekonsiliasi</);
  assert.deepEqual(routeLegacyInventoryTabV32('reconciliation'),{kind:'workspace',tab:'summary'});
});
