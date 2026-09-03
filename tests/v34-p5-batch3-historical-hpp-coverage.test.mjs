import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCostingCoverageDiagnosticsV34 } from '../src/domain/costing-v34-coverage.js';
import { buildFinanceReadModel } from '../src/domain/finance-v33-analytics.js';
import { renderFinanceWorkspaceV33 } from '../src/ui/finance-v33-workspace.js';

const evidence=(state,{source='NONE',costKnown=false,effectiveCogs=null,reasons=[],excluded=false}={})=>Object.freeze({
  version:'3.4',state,source,costKnown,effectiveCogs,excluded,reasonCodes:Object.freeze(reasons)
});
const tx=({id,ts,netRevenue,cogs=null,costKnown=false,state='NOT_SAFE_TO_RECONSTRUCT',source='NONE',reasons=['NO_CONTEMPORANEOUS_COST_EVIDENCE'],status='COMPLETED'})=>({
  id,ts,status,netRevenue,cogs,costKnown,
  _costingEvidenceV34:evidence(state,{source,costKnown,effectiveCogs:costKnown?cogs:null,reasons,excluded:state==='VOID_EXCLUDED'})
});

function loadedFrom(model,transactions){
  return {
    period:'2026-09',allShiftsClosed:false,openShiftKeys:['2026-09-03-S1'],incompleteShiftKeys:[],historicalResolvedShiftKeys:[],
    model:{...model,cashPosition:{available:100000,source:'Ekspektasi kas shift'},ownerCapital:{opening:0,additional:0,prive:0,calculatedEnding:null},inventoryPurchases:{cashOut:0,ownerFunded:0,bankUnverified:0,otherUnresolved:0,grossPurchases:0},cashFlow:{rows:[],totalIn:0,totalOut:0,netChange:0},daily:[],outstanding:{pendingTransactions:0,customerDebt:0,employeeAdvance:0},obligations:{observed:[],scheduleAuthorityAvailable:false}},
    input:{transactions,expenses:[],ownerEvents:[]},activeClose:null,shiftCount:1,shiftKeys:['2026-09-03-S1']
  };
}

test('P5 Batch-3 diagnostics separates legacy gaps, post-evidence gaps, reason cohorts and measured profit',()=>{
  const rows=[
    tx({id:'LEGACY',ts:500,netRevenue:5000}),
    tx({id:'KNOWN',ts:1000,netRevenue:10000,cogs:6000,costKnown:true,state:'SNAPSHOT_VERIFIED',source:'TX_COSTING_SNAPSHOT',reasons:[]}),
    tx({id:'GAP',ts:1500,netRevenue:8000}),
    tx({id:'PARTIAL',ts:1600,netRevenue:7000,state:'PARTIAL_EVIDENCE',reasons:['RESERVATION_NOT_COMMITTED']}),
    tx({id:'VOID',ts:1700,netRevenue:9000,cogs:0,costKnown:true,state:'VOID_EXCLUDED',source:'VOID_STATUS',reasons:[],status:'VOIDED'})
  ];
  const d=buildCostingCoverageDiagnosticsV34(rows);
  assert.equal(d.totalEffective,4);
  assert.equal(d.knownTransactions,1);
  assert.equal(d.transactionCoveragePct,25);
  assert.equal(d.totalRevenue,30000);
  assert.equal(d.measuredRevenue,10000);
  assert.equal(d.revenueCoveragePct,33.3);
  assert.equal(d.measuredCogs,6000);
  assert.equal(d.measuredGrossProfit,4000);
  assert.equal(d.measuredGrossMargin,40);
  assert.equal(d.firstObservedVerifiedTs,1000);
  assert.equal(d.legacyNoEvidence.count,1);
  assert.equal(d.postEvidenceGaps.count,2);
  assert.deepEqual(d.postEvidenceGaps.transactionIds,['GAP','PARTIAL']);
  assert.equal(d.reasonCohorts.NO_CONTEMPORANEOUS_COST_EVIDENCE.count,2);
  assert.equal(d.reasonCohorts.RESERVATION_NOT_COMMITTED.count,1);
  assert.equal(d.voidExcluded,1);
});

test('P5 Batch-3 all-legacy month stays unknown but reports 0% evidence coverage without fabricating profit',()=>{
  const rows=[tx({id:'A',ts:100,netRevenue:4000}),tx({id:'B',ts:200,netRevenue:6000})];
  const d=buildCostingCoverageDiagnosticsV34(rows);
  assert.equal(d.transactionCoveragePct,0);
  assert.equal(d.revenueCoveragePct,0);
  assert.equal(d.measuredGrossProfit,null);
  assert.equal(d.measuredGrossMargin,null);
  assert.equal(d.firstObservedVerifiedTs,null);
  assert.equal(d.legacyNoEvidence.count,2);
  assert.equal(d.postEvidenceGaps.count,0);
});

test('P5 Batch-3 Finance keeps total-period profit unavailable while exposing measured covered-subset profitability',()=>{
  const transactions=[
    tx({id:'K',ts:1000,netRevenue:10000,cogs:6000,costKnown:true,state:'SNAPSHOT_VERIFIED',source:'TX_COSTING_SNAPSHOT',reasons:[]}),
    tx({id:'U',ts:1100,netRevenue:5000})
  ];
  const model=buildFinanceReadModel({transactions,expenses:[{id:'E',amount:1000,category:'Listrik'}]});
  assert.equal(model.profit.cogsKnown,false);
  assert.equal(model.profit.grossProfit,null);
  assert.equal(model.profit.netProfit,null);
  assert.equal(model.profit.hppDiagnostics.measuredRevenue,10000);
  assert.equal(model.profit.hppDiagnostics.measuredCogs,6000);
  assert.equal(model.profit.hppDiagnostics.measuredGrossProfit,4000);
  assert.equal(model.profit.hppDiagnostics.measuredGrossMargin,40);
  assert.equal(model.profit.hppDiagnostics.revenueCoveragePct,66.7);
});

test('P5 Batch-3 Finance UI labels measured profit as subset and exposes legacy/recent costing gap diagnostics',()=>{
  const transactions=[
    tx({id:'LEGACY',ts:500,netRevenue:4000}),
    tx({id:'KNOWN',ts:1000,netRevenue:10000,cogs:6000,costKnown:true,state:'SNAPSHOT_VERIFIED',source:'TX_COSTING_SNAPSHOT',reasons:[]}),
    tx({id:'GAP',ts:1500,netRevenue:5000})
  ];
  const model=buildFinanceReadModel({transactions,expenses:[]});
  const html=renderFinanceWorkspaceV33({loaded:loadedFrom(model,transactions),tab:'summary',readOnly:true});
  assert.match(html,/Coverage Revenue/);
  assert.match(html,/Profit Terukur/);
  assert.match(html,/Laba Kotor Terukur/);
  assert.match(html,/Legacy tanpa evidence biaya/);
  assert.match(html,/Gap costing setelah evidence aktif/);
  assert.match(html,/1 transaksi/);
  assert.match(html,/subset transaksi dengan HPP terverifikasi/i);
});

test('P5 Batch-3 diagnostics never treats current WAC or current recipe as historical evidence',()=>{
  const row=tx({id:'LEGACY',ts:500,netRevenue:5000});
  row.currentWac=9999;row.recipe={ingredients:[{id:'TEA',qty:1}]};row.currentRecipeCost=1234;
  const d=buildCostingCoverageDiagnosticsV34([row]);
  assert.equal(d.knownTransactions,0);
  assert.equal(d.measuredCogs,null);
  assert.equal(d.reasonCohorts.NO_CONTEMPORANEOUS_COST_EVIDENCE.count,1);
});
