import test from 'node:test';
import assert from 'node:assert/strict';
import {buildFinishedGoodsShiftSnapshot,soldUnitsByProduct,returnedUnitsByProduct,buildFinishedGoodsShiftSummary,augmentShiftStockEvidenceUpdates} from '../src/domain/shift-stock-evidence-v1.js';

test('snapshot includes tracked finished goods and preserves opening ids if product tracking changes',()=>{
  const opening={rows:{P3:{productId:'P3',name:'Legacy tracked',qty:4}}};
  const snap=buildFinishedGoodsShiftSnapshot({products:[{id:'P1',n:'Bakaran 1K',trackStock:true},{id:'P2',n:'Es Teh',trackStock:false},{id:'P3',n:'Legacy tracked',trackStock:false}],balances:{P1:12,P2:99,P3:3},includeSnapshot:opening,capturedTs:1000,capturedAt:'2026-09-22T10:00:00.000Z'});
  assert.deepEqual(Object.keys(snap.rows).sort(),['P1','P3']);assert.equal(snap.rows.P1.qty,12);assert.equal(snap.rows.P3.qty,3);assert.equal(snap.authority,'GLOBAL_INVENTORY_EVIDENCE');
});

test('sold units reuse committed transaction semantics and exclude void/cancel plus duplicate tx ids',()=>{
  const txs=[{id:'T1',status:'DONE',items:[{id:'P1',q:2},{productId:'P2',qty:1}]},{id:'T1',status:'DONE',items:[{id:'P1',q:99}]},{id:'T2',status:'VOIDED',items:[{id:'P1',q:7}]},{id:'T3',status:'CANCELLED',cartData:[{id:'P2',q:9}]},{id:'T4',status:'DONE',cartData:[{baseProductId:'P1',quantity:3}]}];
  assert.deepEqual(soldUnitsByProduct(txs),{P1:5,P2:1});
});

test('returned units count only returnStock refunds in the same shift and deduplicate refunds',()=>{
  const rows=[{id:'R1',shift:'2026-09-22-S1',returnStock:true,items:[{id:'P1',q:1}]},{id:'R1',shift:'2026-09-22-S1',returnStock:true,items:[{id:'P1',q:9}]},{id:'R2',shift:'2026-09-22-S1',returnStock:false,items:[{id:'P1',q:4}]},{id:'R3',shift:'2026-09-22-S2',returnStock:true,items:[{id:'P1',q:2}]},{id:'R4',shift:'2026-09-22-S1',returnStock:true,items:[{productId:'P2',qty:2}]}];
  assert.deepEqual(returnedUnitsByProduct(rows,'2026-09-22-S1'),{P1:1,P2:2});
});

test('summary keeps non-sale changes separate instead of disguising them as sales',()=>{
  const opening={rows:{P1:{productId:'P1',name:'Bakaran',qty:20},P2:{productId:'P2',name:'Permen',qty:10}}};
  const closing={rows:{P1:{productId:'P1',name:'Bakaran',qty:22},P2:{productId:'P2',name:'Permen',qty:8}}};
  const txs=[{id:'T1',status:'DONE',items:[{id:'P1',q:8},{id:'P2',q:2}]}];
  const summary=buildFinishedGoodsShiftSummary({opening,closing,transactions:txs,refunds:[],shiftKey:'2026-09-22-S1'});
  assert.equal(summary.rows.P1.openingQty,20);assert.equal(summary.rows.P1.soldQty,8);assert.equal(summary.rows.P1.returnedQty,0);assert.equal(summary.rows.P1.salesOnlyExpectedClosing,12);assert.equal(summary.rows.P1.closingSystemQty,22);assert.equal(summary.rows.P1.nonSaleNetChange,10);assert.equal(summary.rows.P1.status,'NON_SALE_CHANGE');assert.equal(summary.rows.P2.nonSaleNetChange,0);assert.equal(summary.rows.P2.status,'MATCH_SALES_ONLY');assert.equal(summary.attentionCount,1);
});

test('shift augmentation stores evidence beside existing shift authority and in closingSnapshot',()=>{
  const opening={version:'SHIFT-STOCK-EVIDENCE-V1',rows:{P1:{qty:10}}};
  const started=augmentShiftStockEvidenceUpdates('START','2026-09-22-S1','SES1',{'2026-09-22-S1/sessions/SES1':{id:'SES1',status:'ACTIVE'}},{opening});
  assert.equal(started['2026-09-22-S1/sessions/SES1'].stockEvidence.opening.rows.P1.qty,10);assert.equal(started['2026-09-22-S1/stockEvidence/opening'].rows.P1.qty,10);
  const closing={version:'SHIFT-STOCK-EVIDENCE-V1',rows:{P1:{qty:7}}};const summary={version:'SHIFT-STOCK-EVIDENCE-V1',rows:{P1:{closingSystemQty:7}}};
  const closed=augmentShiftStockEvidenceUpdates('CLOSE','2026-09-22-S1','SES1',{'2026-09-22-S1/closingSnapshot':{cash:{actual:100}}},{closing,summary});
  assert.equal(closed['2026-09-22-S1/sessions/SES1/stockEvidence/closing'].rows.P1.qty,7);assert.equal(closed['2026-09-22-S1/stockEvidence/summary'].rows.P1.closingSystemQty,7);assert.equal(closed['2026-09-22-S1/closingSnapshot'].cash.actual,100);assert.equal(closed['2026-09-22-S1/closingSnapshot'].stockEvidence.summary.rows.P1.closingSystemQty,7);
});
