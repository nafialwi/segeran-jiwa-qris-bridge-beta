import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveTransactionCostingV34,
  enrichTransactionsCostingV34,
  summarizeCostingCoverageV34
} from '../src/domain/costing-v34-evidence.js';
import { buildFinanceReadModel } from '../src/domain/finance-v33-analytics.js';
import { createFinanceV33Service } from '../src/domain/finance-v33-service.js';
import { renderFinanceWorkspaceV33 } from '../src/ui/finance-v33-workspace.js';

const shift='2026-09-03-S1';
const stockCosting={version:'0.1.0',costingKnown:true,cogsTotal:6000,netRevenue:10000,costSnapshotTs:1000,items:[{lineIndex:0,productId:'P1',productName:'Stock',qty:2,netRevenue:10000,costingMode:'STOCK',unitCost:3000,cogs:6000,costKnown:true,costSource:'WAC',costSnapshotTs:1000}]};
const recipeCosting={version:'0.1.0',costingKnown:true,cogsTotal:4000,netRevenue:9000,costSnapshotTs:1100,items:[{lineIndex:0,productId:'R1',productName:'Recipe',qty:2,netRevenue:9000,costingMode:'RECIPE',unitCost:2000,cogs:4000,costKnown:true,costSource:'WAC_RECIPE',costSnapshotTs:1100,recipeCostBreakdown:[{ingredientId:'I1',ingredientWac:10000,recipeQty:.2,componentCost:4000,costKnown:true}]}]};

function tx(overrides={}){return {id:'T1',_key:'T1',shift,_shift:shift,status:'DONE',total:10000,pricing:{netSubtotal:10000,total:10000},cartData:[{id:'P1',q:2,p:5000}],ts:2000,...overrides}}
function financeInput(transactions){return {transactions,expenses:[],purchases:[],purchaseReconciliations:[],ownerEvents:[],refunds:[],customerDebts:[],employeeAdvances:[],qrisCashOut:[],debtPayments:[],advancePayments:[],advanceIssued:[],cashMovements:[]}}

test('P5 v3.4 verifies immutable STOCK and RECIPE transaction costing snapshots',()=>{
  const a=resolveTransactionCostingV34(tx({costing:stockCosting}),{});
  assert.equal(a.state,'SNAPSHOT_VERIFIED');assert.equal(a.costKnown,true);assert.equal(a.effectiveCogs,6000);assert.equal(a.source,'TX_COSTING_SNAPSHOT');
  const b=resolveTransactionCostingV34(tx({id:'T2',_key:'T2',costing:recipeCosting}),{});
  assert.equal(b.state,'SNAPSHOT_VERIFIED');assert.equal(b.costKnown,true);assert.equal(b.effectiveCogs,4000);assert.equal(b.source,'TX_COSTING_SNAPSHOT');
});

test('P5 v3.4 reconstructs missing tx.costing only from exact COMMITTED contemporaneous reservation',()=>{
  const original=tx({costing:undefined});
  const reservations={R1:{id:'R1',status:'COMMITTED',shift,transactionId:'T1',costingQuote:stockCosting,createdTs:1500}};
  const r=resolveTransactionCostingV34(original,{reservations});
  assert.equal(r.state,'RECONSTRUCTED_VERIFIED');assert.equal(r.costKnown,true);assert.equal(r.source,'COMMITTED_COSTING_RESERVATION');assert.equal(r.effectiveCogs,6000);
  assert.equal(r.enriched.costing.cogsTotal,6000);assert.equal(r.enriched.costKnown,true);
});

test('P5 v3.4 never reconstructs historical HPP from current WAC/current recipe or ambiguous reservation',()=>{
  const ambiguous={R1:{id:'R1',status:'AMBIGUOUS',shift,candidateIds:['T1'],costingQuote:stockCosting}};
  const r=resolveTransactionCostingV34(tx({costing:undefined}),{reservations:ambiguous,currentCosts:{products:{P1:{wac:9999}}},currentRecipes:{}});
  assert.equal(r.state,'PARTIAL_EVIDENCE');assert.equal(r.costKnown,false);assert.equal(r.effectiveCogs,null);assert.ok(r.reasonCodes.includes('RESERVATION_NOT_COMMITTED'));
  const none=resolveTransactionCostingV34(tx({costing:undefined}),{currentCosts:{products:{P1:{wac:9999}}},currentRecipes:{P1:{variants:{}}}});
  assert.equal(none.state,'NOT_SAFE_TO_RECONSTRUCT');assert.equal(none.costKnown,false);assert.equal(none.effectiveCogs,null);assert.ok(none.reasonCodes.includes('NO_CONTEMPORANEOUS_COST_EVIDENCE'));
});

test('P5 v3.4 reconstructs refund COGS from original immutable line snapshot and cumulative refundedQty',()=>{
  const original=tx({costing:stockCosting,status:'PARTIAL_REFUND',refundTotal:5000,refundedQty:{0:1},refundCostingTotals:undefined});
  const r=resolveTransactionCostingV34(original,{});
  assert.equal(r.state,'RECONSTRUCTED_VERIFIED');assert.equal(r.costKnown,true);assert.equal(r.refundSource,'ORIGINAL_COST_SNAPSHOT_REFUND');assert.equal(r.refundCogs,3000);assert.equal(r.effectiveCogs,3000);
  assert.equal(r.enriched.refundCostingTotals.cogs,3000);
});

test('P5 v3.4 keeps refund HPP partial when refund quantity evidence cannot be proven',()=>{
  const original=tx({costing:stockCosting,status:'REFUNDED',refundTotal:5000,refundedQty:undefined,refundCostingTotals:undefined});
  const r=resolveTransactionCostingV34(original,{refunds:[{id:'RF1',originalTxId:'T1',shift,items:[{id:'P1',q:1}],total:5000}]});
  assert.equal(r.state,'PARTIAL_EVIDENCE');assert.equal(r.costKnown,false);assert.equal(r.effectiveCogs,null);assert.ok(r.reasonCodes.includes('REFUND_COST_EVIDENCE_INCOMPLETE'));
});

test('P5 v3.4 reconstructs refund COGS from global refund rows only when explicit lineIndex is present',()=>{
  const original=tx({costing:stockCosting,status:'REFUNDED',refundTotal:5000,refundedQty:undefined,refundCostingTotals:undefined});
  const refunds=[{id:'RF1',originalTxId:'T1',shift,items:[{id:'P1',lineIndex:0,q:1}],total:5000}];
  const r=resolveTransactionCostingV34(original,{refunds});
  assert.equal(r.state,'RECONSTRUCTED_VERIFIED');assert.equal(r.costKnown,true);assert.equal(r.refundCogs,3000);assert.equal(r.effectiveCogs,3000);
});

test('P5 v3.4 excludes VOID/CANCELLED transactions from costing coverage and profit',()=>{
  const r=resolveTransactionCostingV34(tx({status:'VOIDED',costing:stockCosting}),{});
  assert.equal(r.state,'VOID_EXCLUDED');assert.equal(r.excluded,true);assert.equal(r.effectiveCogs,0);
  const rows=enrichTransactionsCostingV34([tx({status:'VOIDED',costing:stockCosting}),tx({id:'T2',_key:'T2',costing:stockCosting})]);
  const c=summarizeCostingCoverageV34(rows);
  assert.equal(c.totalEffective,1);assert.equal(c.voidExcluded,1);assert.equal(c.snapshotVerified,1);
});

test('P5 v3.4 Finance accepts verified reconstruction but withholds HPP/profit when partial or unsafe evidence remains',()=>{
  const known=enrichTransactionsCostingV34([tx({costing:stockCosting}),tx({id:'T2',_key:'T2',costing:undefined})],{reservations:{R2:{status:'COMMITTED',shift,transactionId:'T2',costingQuote:stockCosting}}});
  const complete=buildFinanceReadModel(financeInput(known));
  assert.equal(complete.profit.cogsKnown,true);assert.equal(complete.profit.cogs,12000);assert.equal(complete.profit.grossProfit,8000);assert.equal(complete.profit.grossMargin,40);
  assert.equal(complete.profit.hppCoverage.snapshotVerified,1);assert.equal(complete.profit.hppCoverage.reconstructedVerified,1);

  const partial=enrichTransactionsCostingV34([tx({costing:stockCosting}),tx({id:'T3',_key:'T3',costing:undefined})]);
  const incomplete=buildFinanceReadModel(financeInput(partial));
  assert.equal(incomplete.profit.cogsKnown,false);assert.equal(incomplete.profit.netProfit,null);assert.equal(incomplete.profit.grossProfit,null);assert.equal(incomplete.profit.grossMargin,null);assert.equal(incomplete.profit.hppCoverage.notSafeToReconstruct,1);
});

test('P5 v3.4 finance service reads costing reservations and enriches month transactions read-only',async()=>{
  const shiftRow={tx:{T1:tx({costing:undefined,shift:undefined,_shift:undefined})},shiftStatus:'CLOSED',locked:true,closingSnapshot:{actualClosing:0}};
  const repo={
    async readMonthShifts(){return {[shift]:shiftRow}},async readInventoryPurchases(){return{}},async readRefunds(){return{}},async readCustomerDebts(){return{}},async readEmployeeAdvances(){return{}},async readQrisSignals(){return{}},async readQrisEvents(){return{}},async readOwnerEvents(){return{}},async readMonthCloseEvents(){return{}},async readQrisCashOut(){return{}},async readPurchaseReconciliations(){return{}},
    async readCostingReservations(){return {R1:{status:'COMMITTED',shift,transactionId:'T1',costingQuote:stockCosting}}}
  };
  const writer={postOwnerEvent(){},reverseOwnerEvent(){},closeMonth(){},reopenMonth(){}};
  const service=createFinanceV33Service({repository:repo,writer});
  const loaded=await service.loadMonth('2026-09');
  assert.equal(loaded.model.profit.cogsKnown,true);assert.equal(loaded.model.profit.cogs,6000);assert.equal(loaded.model.profit.hppCoverage.reconstructedVerified,1);
  assert.equal(loaded.input.transactions[0]._costingEvidenceV34.state,'RECONSTRUCTED_VERIFIED');
});

test('P5 v3.4 Finance UI explains coverage and only shows gross profit/margin when HPP is complete',()=>{
  const loaded={period:'2026-09',allShiftsClosed:true,openShiftKeys:[],incompleteShiftKeys:[],historicalResolvedShiftKeys:[],model:{daily:[],profit:{netSales:20000,cogs:12000,cogsKnown:true,grossProfit:8000,grossMargin:40,businessExpenses:1000,netProfit:7000,hppCoverage:{knownTransactions:2,unknownTransactions:0,snapshotVerified:1,reconstructedVerified:1,partialEvidence:0,notSafeToReconstruct:0,voidExcluded:0}},ownerCapital:{opening:0,additional:0,prive:0,calculatedEnding:7000},cashPosition:{available:0,source:'Ekspektasi kas shift'},cashFlow:{totalIn:0,totalOut:0,netChange:0,rows:[]},inventoryPurchases:{cashOut:0,ownerFunded:0,bankUnverified:0,otherUnresolved:0,grossPurchases:0},outstanding:{pendingTransactions:0,customerDebt:0,employeeAdvance:0},obligations:{observed:[],scheduleAuthorityAvailable:false}},input:{expenses:[],ownerEvents:[]},activeClose:null,shiftCount:1,shiftKeys:[shift]};
  const html=renderFinanceWorkspaceV33({loaded,tab:'summary',readOnly:true});
  assert.match(html,/Coverage HPP v3\.4/);assert.match(html,/Snapshot terverifikasi/);assert.match(html,/Rekonstruksi aman/);assert.match(html,/Laba Kotor/);assert.match(html,/Gross Margin/);assert.match(html,/40%/);assert.match(html,/current WAC/i);
});
