import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileCupShiftV34 } from '../src/domain/packaging-cup-v34.js';
import { renderCupOpeningPanelV34,renderCupClosingPanelV34,collectCupCountValuesV34,collectCupOptionalCountValuesV34,augmentShiftUpdatesV34 } from '../src/ui/cup-shift-control-v34.js';

test('CUP-CONTROL-V1 opening panel requires physical counts and has no Inventory V2 Gerai authority',()=>{
  const html=renderCupOpeningPanelV34([],{readOnly:false});
  assert.match(html,/Hitung Cup Awal/);assert.match(html,/Cup 10 Oz/);assert.match(html,/data-v34-cup-opening="c10"/);assert.match(html,/required/);assert.doesNotMatch(html,/Sistem Gerai|Inventory Gerai/);
});

test('CUP-CONTROL-V1 closing panel shows restock, expected usage, clamped expected, physical and semantic variance',()=>{
  const reconciliation=reconcileCupShiftV34({opening:{c10:100},inbound:{c10:50},closing:{c10:70},theoretical:{c10:77}});
  const html=renderCupClosingPanelV34([],{reconciliation,readOnly:false,closingValues:{c10:70},restockValues:{c10:50}});
  assert.match(html,/Masuk \/ Restock selama shift/);assert.match(html,/Awal 100 · Terpakai 77/);assert.match(html,/Expected Closing[\s\S]*73 pcs/);assert.match(html,/Physical Closing[\s\S]*70 pcs/);assert.match(html,/Selisih[\s\S]*-3 pcs/);assert.match(html,/Kurang 3 pcs/);
  for(const label of ['Rusak','Terpakai di luar transaksi','Salah hitung sebelumnya','Restock belum tercatat','Lainnya'])assert.match(html,new RegExp(label));
});

test('CUP-CONTROL-V1 closing panel never renders negative Expected Closing as stock',()=>{
  const reconciliation=reconcileCupShiftV34({opening:{c22d:7},closing:{c22d:25},theoretical:{c22d:72}});
  const html=renderCupClosingPanelV34([],{reconciliation,readOnly:false,closingValues:{c22d:25}});
  assert.match(html,/Expected Closing[\s\S]*0 pcs/);assert.doesNotMatch(html,/Expected Closing[\s\S]{0,120}-65 pcs/);assert.match(html,/65 pcs penggunaan tidak memiliki stok sumber/);assert.match(html,/Perlu perhatian/);
});

test('CUP-CONTROL-V1 count collectors reject missing/negative physical and accept optional restock blank as zero',()=>{
  assert.throws(()=>collectCupCountValuesV34({c10:'',c10p:1,c16:1,c22p:1,c22d:1,c22o:1}),/CUP_COUNT_REQUIRED/);
  assert.throws(()=>collectCupCountValuesV34({c10:-1,c10p:1,c16:1,c22p:1,c22d:1,c22o:1}),/CUP_COUNT_INVALID/);
  assert.equal(collectCupCountValuesV34({c10:1,c10p:6,c16:2,c22p:3,c22d:4,c22o:5}).c22o,5);
  assert.equal(collectCupOptionalCountValuesV34({c10:'',c10p:0,c16:0,c22p:0,c22d:0,c22o:0}).c10,0);
});

test('CUP-CONTROL-V1 augments existing shift write only, storing opening/restock/closing/ledger/reconciliation',()=>{
  const startUpdates={'2026-09-03-S1/sessions/SES1':{id:'SES1',status:'ACTIVE'}};
  const start=augmentShiftUpdatesV34('START','2026-09-03-S1','SES1',startUpdates,{opening:{counts:{c10:10},capturedTs:123}});
  assert.equal(start['2026-09-03-S1/sessions/SES1'].cupControl.opening.counts.c10,10);assert.equal(startUpdates['2026-09-03-S1/sessions/SES1'].cupControl,undefined);
  const close=augmentShiftUpdatesV34('CLOSE','2026-09-03-S1','SES1',{'2026-09-03-S1/closingSnapshot':{}},{restock:{counts:{c10:5}},closing:{counts:{c10:7}},ledger:[{type:'RESTOCK',code:'c10',qty:5}],reconciliation:{authority:'CUP_CONTROL',rows:[{code:'c10',variance:-1}]}});
  assert.equal(close['2026-09-03-S1/cupControl/restock'].counts.c10,5);assert.equal(close['2026-09-03-S1/cupControl/closing'].counts.c10,7);assert.equal(close['2026-09-03-S1/cupControl/ledger'][0].type,'RESTOCK');assert.equal(close['2026-09-03-S1/closingSnapshot'].cupControl.reconciliation.authority,'CUP_CONTROL');
});

test('CUP-CONTROL-V1 closing without opening evidence does not invent Expected from Inventory and still accepts physical continuity',()=>{
  const reconciliation={rows:[{code:'c10',name:'Cup 10 Oz',opening:null,restock:0,transactionUsage:0,expectedClosing:null,uncoveredUsage:null,physicalClosing:null,variance:null,status:'OPENING_UNKNOWN'}]};
  const html=renderCupClosingPanelV34([],{reconciliation,readOnly:false,closingValues:{},openingKnown:false});
  assert.match(html,/Opening belum tersedia/);assert.match(html,/Expected Closing[\s\S]*—/);assert.match(html,/data-v34-cup-closing="c10" value=""/);assert.doesNotMatch(html,/Inventory Gerai/);assert.match(html,/Tidak ada Opname atau decrement Cup ke Inventory V2/);
});

test('CUP-CONTROL-V1 local QA permits draft physical/restock input while persistence buttons remain read-only',()=>{
  const opening=renderCupOpeningPanelV34([],{readOnly:true});assert.match(opening,/LOCAL QA · READ ONLY/);assert.doesNotMatch(opening,/data-v34-cup-opening="c10"[^>]*disabled/);
  const reconciliation=reconcileCupShiftV34({opening:{c10:10},inbound:{c10:2},closing:{c10:9},theoretical:{c10:3}});
  const closing=renderCupClosingPanelV34([],{reconciliation,readOnly:true,closingValues:{c10:9},restockValues:{c10:2}});assert.match(closing,/Simulasi input lokal/);assert.match(closing,/data-v34-cup-restock="c10" value="2"/);assert.doesNotMatch(closing,/data-v34-cup-closing="c10"[^>]*disabled/);
});
