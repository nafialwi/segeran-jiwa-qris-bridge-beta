import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { reconcileCupShiftV34 } from '../src/domain/packaging-cup-v34.js';
import { renderCupInitialSetupV34, renderCupInventorySectionV34 } from '../src/ui/inventory-workspace-v32.js';
import { applyReadOnlyShiftActionStateV34, renderCupClosingPanelV34 } from '../src/ui/cup-shift-control-v34.js';

const invSource=()=>fs.readFileSync(new URL('../src/ui/inventory-workspace-v32.js',import.meta.url),'utf8');

test('CUP-CONTROL-V1 Final QA keeps Inventory V2 Cup surfaces operationally disabled',()=>{
  assert.equal(renderCupInventorySectionV34([]),'');
  const setup=renderCupInitialSetupV34([],{readOnly:false});
  assert.match(setup,/Setup Cup dipindahkan/);assert.match(setup,/tidak lagi dikelola sebagai stok Inventory V2/);assert.doesNotMatch(setup,/data-v34-cup-setup-apply|Simpan Master & Saldo Awal/);
});

test('CUP-CONTROL-V1 Final QA legacy Cup Inventory writer entrypoints fail closed',()=>{
  const src=invSource();assert.match(src,/async function ensureCupMasters\(\)\{throw[\s\S]*CUP_CONTROL_INVENTORY_DEPRECATED/);assert.match(src,/async function applyInitialCupSetup\(\)\{throw[\s\S]*CUP_CONTROL_INVENTORY_DEPRECATED/);
});

test('CUP-CONTROL-V1 Final QA closing simulation exposes Restock draft and physical-minus-expected',()=>{
  const reconciliation=reconcileCupShiftV34({opening:{c10:20},inbound:{c10:5},theoretical:{c10:12},closing:{c10:10}});
  const html=renderCupClosingPanelV34([],{reconciliation,readOnly:true,closingValues:{c10:10},openingKnown:true,restockValues:{c10:5}});
  assert.match(html,/Masuk \/ Restock selama shift/);assert.match(html,/data-v34-cup-restock="c10" value="5"/);assert.match(html,/Expected Closing[\s\S]*13 pcs/);assert.match(html,/Selisih[\s\S]*-3 pcs/);assert.match(html,/Kurang 3 pcs/);assert.match(html,/Simulasi input lokal/);
});

test('CUP-CONTROL-V1 Final QA visually locks START and CLOSE persistence buttons in read-only QA',()=>{
  const elements={'sjshift-start-btn':{textContent:'MULAI SHIFT',disabled:false,dataset:{},classList:{add(v){this.value=v}},setAttribute(k,v){this[k]=v}},'sjshift-close-save':{textContent:'TUTUP & SERAHKAN SHIFT',disabled:false,dataset:{},classList:{add(v){this.value=v}},setAttribute(k,v){this[k]=v}}};
  const document={getElementById(id){return elements[id]||null}};const changed=applyReadOnlyShiftActionStateV34(document,true);assert.equal(changed,2);assert.equal(elements['sjshift-start-btn'].disabled,true);assert.match(elements['sjshift-start-btn'].textContent,/READ ONLY/);assert.equal(elements['sjshift-close-save'].disabled,true);assert.match(elements['sjshift-close-save'].textContent,/READ ONLY/);
});
