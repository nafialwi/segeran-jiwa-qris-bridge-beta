import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CUP_CATALOG_V34,
  validateCupInitialSetupV34,
  buildCupLocalSimulationRowsV34,
  planCupInitialSetupV34
} from '../src/domain/packaging-cup-v34.js';
import { renderCupInitialSetupPreviewV34, renderCupInitialSetupV34 } from '../src/ui/inventory-workspace-v32.js';
import { applyReadOnlyShiftActionStateV34, renderCupClosingPanelV34 } from '../src/ui/cup-shift-control-v34.js';

const config=Object.fromEntries(CUP_CATALOG_V34.map((x,i)=>[x.code,{warehouseQty:100+i*10,outletQty:20+i,wac:300+i*25}]));

test('P5 Batch-2 Final QA validates five-cup initial setup and requires WAC when opening stock exists',()=>{
  const out=validateCupInitialSetupV34(config);
  assert.equal(Object.keys(out).length,5);
  assert.equal(out.c10.totalQty,120);
  assert.throws(()=>validateCupInitialSetupV34({...config,c16:{warehouseQty:1,outletQty:0,wac:0}}),/CUP_INITIAL_WAC_REQUIRED/);
});

test('P5 Batch-2 Final QA builds LOCAL-only registered cup rows with simulated Gudang Gerai and WAC',()=>{
  const rows=buildCupLocalSimulationRowsV34(config);
  assert.equal(rows.length,5);
  assert.equal(rows.every(x=>x.registered&&x.simulated),true);
  assert.equal(rows[0].warehouseQty,100);
  assert.equal(rows[0].outletQty,20);
  assert.equal(rows[0].wac,300);
  assert.match(rows[0].ingredientId,/^LOCAL_SIM_/);
});

test('P5 Batch-2 Final QA production setup plan reuses master + initial cost + Inventory V2 opname authorities',()=>{
  const missing=CUP_CATALOG_V34.map(x=>({code:x.code,name:x.name,registered:false,ingredientId:null,totalQty:0,costKnown:false}));
  const plan=planCupInitialSetupV34(missing,config);
  assert.equal(plan.rows.length,5);
  assert.equal(plan.rows.every(x=>x.createMaster&&x.setInitialCost&&x.warehouseOpname&&x.outletOpname),true);
  assert.equal(plan.usesPurchaseWriter,false,'initial stock must not masquerade as a purchase cash-flow event');
});

test('P5 Batch-2 Final QA renders editable LOCAL master simulation instead of a disabled fake setup button',()=>{
  const missing=CUP_CATALOG_V34.map(x=>({code:x.code,name:x.name,registered:false,outletQty:0,warehouseQty:0,wac:null}));
  const html=renderCupInitialSetupV34(missing,{readOnly:true,values:config});
  assert.match(html,/Simulasi Master Cup Lokal/);
  assert.match(html,/Gudang awal/);
  assert.match(html,/Gerai awal/);
  assert.match(html,/WAC awal/);
  assert.match(html,/Gunakan Simulasi Lokal/);
  assert.match(html,/Total cup awal/);
  assert.match(html,/Nilai persediaan awal/);
  const preview=renderCupInitialSetupPreviewV34(config);assert.match(preview,/Rp/);
  assert.doesNotMatch(html,/data-v34-cup-setup-apply[^>]*disabled/);
  assert.match(html,/tidak menulis production/i);
});

test('P5 Batch-2 Final QA closing simulation exposes Cup Masuk local draft while persistence remains read-only',()=>{
  const rows=buildCupLocalSimulationRowsV34(config);
  const reconciliation={rows:CUP_CATALOG_V34.map(x=>({code:x.code,name:x.name,opening:20,inbound:5,closing:10,physicalUsed:15,theoreticalUsed:12,variance:3}))};
  const html=renderCupClosingPanelV34(rows,{reconciliation,readOnly:true,closingValues:{c10:10},openingKnown:true,simulationInbound:{c10:5}});
  assert.match(html,/Cup Masuk simulasi/);
  assert.match(html,/data-v34-cup-inbound-sim="c10"/);
  assert.match(html,/Simulasi input lokal/);
});

test('P5 Batch-2 Final QA visually locks START and CLOSE persistence buttons but not audit navigation',()=>{
  const elements={
    'sjshift-start-btn':{textContent:'MULAI SHIFT',disabled:false,dataset:{},classList:{add(v){this.value=v}},setAttribute(k,v){this[k]=v}},
    'sjshift-close-save':{textContent:'TUTUP & SERAHKAN SHIFT',disabled:false,dataset:{},classList:{add(v){this.value=v}},setAttribute(k,v){this[k]=v}}
  };
  const document={getElementById(id){return elements[id]||null}};
  const changed=applyReadOnlyShiftActionStateV34(document,true);
  assert.equal(changed,2);
  assert.equal(elements['sjshift-start-btn'].disabled,true);
  assert.match(elements['sjshift-start-btn'].textContent,/READ ONLY/);
  assert.equal(elements['sjshift-close-save'].disabled,true);
  assert.match(elements['sjshift-close-save'].textContent,/READ ONLY/);
});
