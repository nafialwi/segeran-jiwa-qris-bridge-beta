import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CUP_CONTROL_AUTHORITY,
  reconcileCupControlV1,
  buildCupControlLedgerV1,
  normalizeHistoricalCupRowV1
} from '../src/domain/cup-control-v1.js';
import { CUP_CATALOG_V34, theoreticalCupUsageV34 } from '../src/domain/packaging-cup-v34.js';

const one=[{code:'c22d',name:'Cup 22 Oz Datar',unit:'pcs'}];

function reconcile(input){return reconcileCupControlV1({catalog:one,...input}).rows[0]}

test('CUP-CONTROL-V1 live Datar Polos: physical 41 versus expected 37 is +4 Lebih',()=>{
  const row=reconcile({opening:{c22d:37},restock:{c22d:0},transactionUsage:{c22d:0},physical:{c22d:41}});
  assert.equal(row.rawExpected,37);
  assert.equal(row.expectedClosing,37);
  assert.equal(row.uncoveredUsage,0);
  assert.equal(row.variance,4);
  assert.equal(row.status,'MORE');
});

test('CUP-CONTROL-V1 live Datar: raw -65 becomes expected 0 plus uncovered usage 65',()=>{
  const row=reconcile({opening:{c22d:7},restock:{c22d:0},transactionUsage:{c22d:72},physical:{c22d:25}});
  assert.equal(row.rawExpected,-65);
  assert.equal(row.expectedClosing,0);
  assert.equal(row.uncoveredUsage,65);
  assert.equal(row.physicalClosing,25);
  assert.equal(row.variance,25);
  assert.equal(row.status,'NEEDS_ATTENTION');
});

test('CUP-CONTROL-V1 live Oval reconciliation: opening 29 + restock 2 - usage 18 = physical 13',()=>{
  const row=reconcile({opening:{c22d:29},restock:{c22d:2},transactionUsage:{c22d:18},physical:{c22d:13}});
  assert.equal(row.available,31);
  assert.equal(row.expectedClosing,13);
  assert.equal(row.physicalClosing,13);
  assert.equal(row.variance,0);
  assert.equal(row.status,'MATCH');
});

test('CUP-CONTROL-V1 opening 29 and usage 16 yields expected 13',()=>{
  const row=reconcile({opening:{c22d:29},transactionUsage:{c22d:16},physical:{c22d:13}});
  assert.equal(row.expectedClosing,13);
  assert.equal(row.variance,0);
});

test('CUP-CONTROL-V1 keeps expected unknown when opening authority is missing',()=>{
  const row=reconcile({openingKnown:false,transactionUsage:{c22d:9},physical:{c22d:13}});
  assert.equal(row.opening,null);
  assert.equal(row.expectedClosing,null);
  assert.equal(row.uncoveredUsage,null);
  assert.equal(row.variance,null);
  assert.equal(row.status,'OPENING_UNKNOWN');
});

test('CUP-CONTROL-V1 ledger exposes auditable operational events without Inventory V2 events',()=>{
  const events=buildCupControlLedgerV1({catalog:one,opening:{c22d:20},restock:{c22d:10},transactionUsage:{c22d:8},manualUsage:{c22d:1},waste:{c22d:2},adjustment:{c22d:-1},physical:{c22d:18},capturedTs:123});
  assert.deepEqual(events.map(x=>x.type),['OPENING','RESTOCK','TRANSACTION_USAGE','MANUAL_USAGE','WASTE','ADJUSTMENT','CLOSING']);
  assert.equal(events.find(x=>x.type==='TRANSACTION_USAGE').qty,-8);
  assert.equal(events.find(x=>x.type==='CLOSING').absolute,true);
  assert.ok(events.every(x=>!String(x.type).includes('INVENTORY')));
});

test('CUP-CONTROL-V1 normalizes legacy negative expected for display without rewriting raw evidence',()=>{
  const row=normalizeHistoricalCupRowV1({expectedClosing:-65,closing:25,variance:-90},{authority:'LEGACY'});
  assert.equal(row.rawExpected,-65);
  assert.equal(row.expectedClosing,0);
  assert.equal(row.uncoveredUsage,65);
  assert.equal(row.physicalClosing,25);
  assert.equal(row.variance,25);
  assert.equal(row.legacyVariance,-90);
});

test('Cup expected usage excludes VOID/CANCELLED but refund does not restore a disposable cup',()=>{
  const transactions=[
    {status:'DONE',items:[{id:'P1',q:3,cp:'c16'}],refundedQty:{0:1}},
    {status:'VOIDED',items:[{id:'P2',q:9,cp:'c16'}]},
    {status:'CANCELLED',items:[{id:'P3',q:4,cp:'c22d'}]},
    {status:'DONE',items:[{id:'P4',q:2,cp:'c22d'}]}
  ];
  const usage=theoreticalCupUsageV34(transactions,[]);
  assert.equal(usage.c16,3);
  assert.equal(usage.c22d,2);
});


test('Cup expected usage is idempotent for duplicate transaction identity',()=>{
  const tx={id:'TX-1',status:'DONE',items:[{id:'P1',q:2,cp:'c22o'}]};
  const usage=theoreticalCupUsageV34([tx,{...tx}],[]);
  assert.equal(usage.c22o,2);
});

test('Cup control reconciliation carries authority version explicitly',()=>{
  const result=reconcileCupControlV1({catalog:CUP_CATALOG_V34,opening:{},physical:{}});
  assert.equal(result.authority,CUP_CONTROL_AUTHORITY);
  assert.equal(result.version,'CUP-CONTROL-V1');
  assert.equal(result.rows.length,6);
});
