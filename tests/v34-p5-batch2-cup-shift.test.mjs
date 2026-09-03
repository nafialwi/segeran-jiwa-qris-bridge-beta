import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCupInventoryRowsV34 } from '../src/domain/packaging-cup-v34.js';
import {
  renderCupOpeningPanelV34,
  renderCupClosingPanelV34,
  collectCupCountValuesV34,
  augmentShiftUpdatesV34
} from '../src/ui/cup-shift-control-v34.js';

const cups=buildCupInventoryRowsV34({
  ingredients:{I10:{name:'Cup 10 Oz',unit:'pcs'},I16:{name:'Cup 16 Oz',unit:'pcs'},I22P:{name:'Cup 22 Oz Datar Polos',unit:'pcs'},I22D:{name:'Cup 22 Oz Datar',unit:'pcs'},I22O:{name:'Cup 22 Oz Oval',unit:'pcs'}},
  balances:{ingredients:{I10:{outlet:20},I16:{outlet:30},I22P:{outlet:40},I22D:{outlet:50},I22O:{outlet:60}}}
});

test('P5 Batch-2 opening panel requires manual physical counts while showing system outlet reference',()=>{
  const html=renderCupOpeningPanelV34(cups,{readOnly:false});
  assert.match(html,/Hitung Cup Awal/);assert.match(html,/Cup 10 Oz/);assert.match(html,/Sistem Gerai: 20 pcs/);
  assert.match(html,/data-v34-cup-opening="c10"/);assert.match(html,/required/);
});

test('P5 Batch-2 closing panel shows physical versus theoretical reconciliation and variance reason',()=>{
  const reconciliation={rows:[{code:'c10',name:'Cup 10 Oz',opening:100,inbound:50,closing:70,physicalUsed:80,theoreticalUsed:77,variance:3}]};
  const html=renderCupClosingPanelV34(cups,{reconciliation,readOnly:false});
  assert.match(html,/Hitung Cup Akhir/);assert.match(html,/Fisik terpakai/);assert.match(html,/80 pcs/);assert.match(html,/Transaksi/);assert.match(html,/77 pcs/);assert.match(html,/Selisih/);assert.match(html,/3 pcs/);
  assert.match(html,/Rusak/);assert.match(html,/Tumpah \/ remake/);assert.match(html,/Pemakaian internal/);assert.match(html,/Sampling/);assert.match(html,/Salah hitung/);
});

test('P5 Batch-2 count collection rejects missing/negative values and requires reason on non-zero variance',()=>{
  assert.throws(()=>collectCupCountValuesV34({c10:'',c16:1,c22p:1,c22d:1,c22o:1}),/CUP_COUNT_REQUIRED/);
  assert.throws(()=>collectCupCountValuesV34({c10:-1,c16:1,c22p:1,c22d:1,c22o:1}),/CUP_COUNT_INVALID/);
  const out=collectCupCountValuesV34({c10:1,c16:2,c22p:3,c22d:4,c22o:5});assert.equal(out.c22o,5);
});

test('P5 Batch-2 augments existing START/CLOSE shift update payload without creating a second writer',()=>{
  const startUpdates={'2026-09-03-S1/sessions/SES1':{id:'SES1',status:'ACTIVE'}};
  const start=augmentShiftUpdatesV34('START','2026-09-03-S1','SES1',startUpdates,{opening:{counts:{c10:10},capturedAt:'now'}});
  assert.equal(start['2026-09-03-S1/sessions/SES1'].cupControl.opening.counts.c10,10);
  assert.equal(startUpdates['2026-09-03-S1/sessions/SES1'].cupControl,undefined,'input update object must remain untouched');
  const closeUpdates={'2026-09-03-S1/closingSnapshot':{sales:{total:1000}}};
  const close=augmentShiftUpdatesV34('CLOSE','2026-09-03-S1','SES1',closeUpdates,{closing:{counts:{c10:7}},reconciliation:{rows:[{code:'c10',variance:3}]}});
  assert.equal(close['2026-09-03-S1/sessions/SES1/cupControl/closing'].counts.c10,7);
  assert.equal(close['2026-09-03-S1/closingSnapshot'].cupControl.reconciliation.rows[0].variance,3);
});

test('P5 Batch-2 closing panel starts blank for manual count and clearly marks legacy shifts without opening authority',()=>{
  const reconciliation={rows:[{code:'c10',name:'Cup 10 Oz',opening:0,inbound:0,closing:0,physicalUsed:0,theoreticalUsed:0,variance:0}]};
  const html=renderCupClosingPanelV34(cups,{reconciliation,readOnly:false,closingValues:{},openingKnown:false});
  assert.match(html,/Shift ini dibuka sebelum Cup Control/);
  assert.match(html,/data-v34-cup-closing="c10" value=""/);
  assert.match(html,/data-v34-cup-closing="c10"[^>]*disabled/);
});

test('P5 Batch-2 stores opening and closing reconciliation at shift level so cashier handover does not lose cup authority',()=>{
  const start=augmentShiftUpdatesV34('START','2026-09-03-S1','SES1',{'2026-09-03-S1/sessions/SES1':{id:'SES1'}},{opening:{counts:{c10:15},capturedTs:123}});
  assert.equal(start['2026-09-03-S1/cupControl/opening'].counts.c10,15);
  assert.equal(start['2026-09-03-S1/cupControl/opening'].capturedTs,123);
  const close=augmentShiftUpdatesV34('CLOSE','2026-09-03-S1','SES2',{}, {closing:{counts:{c10:8}},reconciliation:{rows:[{code:'c10',variance:1}]}});
  assert.equal(close['2026-09-03-S1/cupControl/closing'].counts.c10,8);
  assert.equal(close['2026-09-03-S1/cupControl/reconciliation'].rows[0].variance,1);
});

test('P5 Batch-2 closing UI exposes Inventory V2 opname draft count without promising auto stock mutation',()=>{
  const reconciliation={rows:[{code:'c10',name:'Cup 10 Oz',opening:100,inbound:0,closing:90,physicalUsed:10,theoreticalUsed:10,variance:0}]};
  const drafts=[{code:'c10',name:'Cup 10 Oz',ingredientId:'I10',systemQty:95,physicalQty:90,delta:-5}];
  const html=renderCupClosingPanelV34(cups,{reconciliation,readOnly:false,closingValues:{c10:90},openingKnown:true,opnameDrafts:drafts});
  assert.match(html,/Sinkronisasi Inventory V2/);
  assert.match(html,/1 cup perlu Opname/);
  assert.match(html,/tidak mengubah saldo otomatis/i);
});

test('P5 Batch-2 LOCAL QA allows draft cup count simulation while persistence remains outside the cup UI',()=>{
  const opening=renderCupOpeningPanelV34(cups,{readOnly:true});
  assert.match(opening,/LOCAL QA · READ ONLY/);
  assert.match(opening,/Simulasi input lokal/i);
  assert.doesNotMatch(opening,/data-v34-cup-opening="c10"[^>]*disabled/);
  const reconciliation={rows:[{code:'c10',name:'Cup 10 Oz',opening:100,inbound:0,closing:90,physicalUsed:10,theoreticalUsed:8,variance:2}]};
  const closing=renderCupClosingPanelV34(cups,{reconciliation,readOnly:true,closingValues:{c10:90},openingKnown:true});
  assert.match(closing,/Simulasi input lokal/i);
  assert.doesNotMatch(closing,/data-v34-cup-closing="c10"[^>]*disabled/);
});
