import test from 'node:test';
import assert from 'node:assert/strict';
import * as service from '../src/domain/finance-v33-service.js';

function purchase(){return {id:'P1',purchaseId:'P1',status:'COMMITTED',itemType:'ingredient',itemId:'ING_TEA',itemName:'TEH',qtyReceived:1,unit:'pack',landedCost:25000,fundSource:'OWNER',supplier:'Supplier A',shift:'2026-08-29-S1',expenseRef:'E1',movementRef:'M1',stockBefore:9,stockAfter:10,oldWac:20000,newWac:20500,createdTs:1000}}
function inventory(){return {balances:{ingredients:{ING_TEA:{outlet:2,warehouse:6}}},costs:{ingredients:{ING_TEA:{wac:21250}}},movements:{
  M1:{id:'M1',purchaseId:'P1',itemType:'ingredient',itemId:'ING_TEA',type:'PURCHASE',location:'warehouse',delta:1,ts:1000},
  M2:{id:'M2',itemType:'ingredient',itemId:'ING_TEA',type:'TRANSFER_OUT',location:'warehouse',delta:-1,ts:1100},
  M3:{id:'M3',itemType:'ingredient',itemId:'ING_TEA',type:'TRANSFER_IN',location:'outlet',delta:1,ts:1101},
  M4:{id:'M4',itemType:'ingredient',itemId:'ING_TEA',type:'SALE_CONSUMPTION',location:'outlet',delta:-0.5,ts:1200},
  M5:{id:'M5',itemType:'ingredient',itemId:'ING_TEA',type:'OPNAME',location:'warehouse',delta:-0.25,ts:1300}
},purchaseReconciliations:{P1:{}}}}

test('RC5-C LINK_REPAIR dry-run classifies exact expense target without mutation',()=>{
  assert.equal(typeof service.buildLinkRepairDryRunV33,'function');
  const missing=service.buildLinkRepairDryRunV33({purchase:purchase(),expense:null});
  assert.equal(missing.status,'MISSING');
  assert.equal(missing.canRepair,true);
  assert.deepEqual(missing.target,{shiftKey:'2026-08-29-S1',expenseRef:'E1'});
  assert.equal(missing.preview.purchaseRef,'P1');
  assert.equal(missing.preview.amount,25000);
  assert.equal(missing.preview.systemLinked,true);
  const valid=service.buildLinkRepairDryRunV33({purchase:purchase(),expense:{id:'E1',purchaseRef:'P1',amount:25000,systemLinked:true}});
  assert.equal(valid.status,'ALREADY_VALID');assert.equal(valid.canRepair,false);
  const occupied=service.buildLinkRepairDryRunV33({purchase:purchase(),expense:{id:'E1',purchaseRef:'OTHER',amount:999,systemLinked:true}});
  assert.equal(occupied.status,'OCCUPIED_MISMATCH');assert.equal(occupied.canRepair,false);
});

test('RC5-C downstream inventory evidence explains consumption and ambiguous movement blockers',()=>{
  assert.equal(typeof service.buildDownstreamInventoryEvidenceV33,'function');
  const evidence=service.buildDownstreamInventoryEvidenceV33({purchase:purchase(),inventory:inventory()});
  assert.equal(evidence.purchaseQty,1);
  assert.equal(evidence.currentWarehouse,6);
  assert.equal(evidence.currentOutlet,2);
  assert.equal(evidence.currentWac,21250);
  assert.equal(evidence.movements.length,4);
  assert.equal(evidence.movements.find(x=>x.id==='M4').classification,'CONSUMPTION');
  assert.equal(evidence.movements.find(x=>x.id==='M5').classification,'ADJUSTMENT_AMBIGUOUS');
  assert.equal(evidence.consumptiveQty,0.5);
  assert.equal(evidence.ambiguousCount,1);
});

test('RC5-C historical shift resolution is eligible for NOT_STARTED association and blocks duplicate acknowledgement',()=>{
  assert.equal(typeof service.buildHistoricalShiftResolutionV33,'function');
  const shiftAudit={shiftKey:'2026-08-29-S1',state:'NOT_STARTED',issues:['SHIFT_STATUS_INCOMPLETE'],sessionId:null,locked:false,closingSnapshot:false};
  const plan=service.buildHistoricalShiftResolutionV33({purchase:purchase(),shiftAudit,reconciliations:[]});
  assert.equal(plan.eligible,true);assert.deepEqual(plan.blockers,[]);assert.equal(plan.resolved,false);
  const resolved=service.buildHistoricalShiftResolutionV33({purchase:purchase(),shiftAudit,reconciliations:[{type:'HISTORICAL_SHIFT_ACK',status:'CONFIRMED',shiftKey:'2026-08-29-S1',operationId:'ACK-1'}]});
  assert.equal(resolved.eligible,false);assert.equal(resolved.resolved,true);assert.ok(resolved.blockers.includes('HISTORICAL_SHIFT_ALREADY_ACKNOWLEDGED'));
});

test('RC5-C historical shift acknowledgement is never eligible for a genuinely ACTIVE shift',()=>{
  const plan=service.buildHistoricalShiftResolutionV33({purchase:purchase(),shiftAudit:{shiftKey:'2026-08-29-S1',state:'ACTIVE',issues:['SHIFT_STILL_ACTIVE']},reconciliations:[]});
  assert.equal(plan.eligible,false);assert.ok(plan.blockers.includes('SHIFT_STILL_ACTIVE'));
});

function clone(v){return v==null?v:JSON.parse(JSON.stringify(v))}
function getAt(root,path){const seg=String(path||'').split('/').filter(Boolean);let cur=root;for(const key of seg){if(cur==null)return null;cur=cur[key]}return cur??null}
function setAt(root,path,value){const seg=String(path||'').split('/').filter(Boolean);let cur=root;for(let i=0;i<seg.length-1;i++){cur[seg[i]]??={};cur=cur[seg[i]]}cur[seg.at(-1)]=clone(value)}
function fakeDb(initial={}){const data=clone(initial)||{},seen=[];return {data,seen,ref(path=''){seen.push(path);return {once:async type=>{assert.equal(type,'value');return{val:()=>clone(getAt(data,path))}},transaction:async fn=>{const current=clone(getAt(data,path)),next=fn(current);if(next===undefined)return{committed:false,snapshot:{val:()=>clone(current)}};setAt(data,path,next);return{committed:true,snapshot:{val:()=>clone(next)}}}}}}}
function ownerProof(ts=2000){return {ok:true,role:'owner',ownerId:'owner-a',ownerName:'Owner A',requesterId:'owner-a',requesterRole:'owner',reauthenticatedAt:ts}}
function writerSeed(){return {toko_segeranjiwa_v58:{global:{inventoryV2:{purchases:{P1:purchase()},purchaseReconciliations:{P1:{}}}},'2026-08-29-S1':{inventoryMarker:{legacy:true}}}}}

test('RC5-C historical shift acknowledgement appends evidence without mutating purchase or shift',async()=>{
  const {createPurchaseReconciliationWriter}=await import('../src/data/writers/purchase-reconciliation-writer.js'),db=fakeDb(writerSeed()),writer=createPurchaseReconciliationWriter({db,now:()=>2000});
  assert.equal(typeof writer.acknowledgeHistoricalShift,'function');
  const purchaseBefore=clone(getAt(db.data,'toko_segeranjiwa_v58/global/inventoryV2/purchases/P1'));
  const shiftBefore=clone(getAt(db.data,'toko_segeranjiwa_v58/2026-08-29-S1'));
  const event=await writer.acknowledgeHistoricalShift({operationId:'HIST-ACK-001',purchaseId:'P1',note:'Transaksi historis terhubung ke shift yang tidak pernah dimulai',authorization:ownerProof(2000)});
  assert.equal(event.type,'HISTORICAL_SHIFT_ACK');assert.equal(event.status,'CONFIRMED');assert.equal(event.shiftKey,'2026-08-29-S1');assert.equal(event.shiftState,'NOT_STARTED');
  assert.deepEqual(getAt(db.data,'toko_segeranjiwa_v58/global/inventoryV2/purchases/P1'),purchaseBefore);
  assert.deepEqual(getAt(db.data,'toko_segeranjiwa_v58/2026-08-29-S1'),shiftBefore);
  assert.equal(getAt(db.data,'toko_segeranjiwa_v58/global/inventoryV2/purchaseReconciliations/P1/HIST-ACK-001/type'),'HISTORICAL_SHIFT_ACK');
  const again=await writer.acknowledgeHistoricalShift({operationId:'HIST-ACK-001',purchaseId:'P1',note:'retry',authorization:ownerProof(2000)});assert.equal(again.operationId,'HIST-ACK-001');
});

test('RC5-C historical acknowledgement requires explicit note and fresh Owner self re-auth',async()=>{
  const {createPurchaseReconciliationWriter}=await import('../src/data/writers/purchase-reconciliation-writer.js'),db=fakeDb(writerSeed()),writer=createPurchaseReconciliationWriter({db,now:()=>200000,maxProofAgeMs:120000});
  await assert.rejects(()=>writer.acknowledgeHistoricalShift({operationId:'HIST-ACK-002',purchaseId:'P1',note:'',authorization:ownerProof(200000)}),/HISTORICAL_SHIFT_ACK_NOTE_REQUIRED/);
  await assert.rejects(()=>writer.acknowledgeHistoricalShift({operationId:'HIST-ACK-003',purchaseId:'P1',note:'ack',authorization:ownerProof(1)}),/OWNER_REAUTH_EXPIRED/);
});

test('RC5-C historical acknowledgement refuses a genuinely ACTIVE canonical shift',async()=>{
  const seed=writerSeed();seed.toko_segeranjiwa_v58['2026-08-29-S1']={shiftStatus:'ACTIVE',sessionControl:{status:'ACTIVE',currentSessionId:'SID-1'}};
  const {createPurchaseReconciliationWriter}=await import('../src/data/writers/purchase-reconciliation-writer.js'),db=fakeDb(seed),writer=createPurchaseReconciliationWriter({db,now:()=>2000});
  await assert.rejects(()=>writer.acknowledgeHistoricalShift({operationId:'HIST-ACK-004',purchaseId:'P1',note:'ack',authorization:ownerProof(2000)}),/HISTORICAL_SHIFT_ACTIVE/);
});

import { renderPurchaseAuditV33, renderFinanceWorkspaceV33, createFinanceWorkspaceControllerV33 } from '../src/ui/finance-v33-workspace.js';
function readRepo(overrides={}){return {async readMonthShifts(){return{}},async readInventoryPurchases(){return{}},async readPurchaseReconciliations(){return{}},async readRefunds(){return{}},async readCustomerDebts(){return{}},async readEmployeeAdvances(){return{}},async readQrisSignals(){return{}},async readQrisEvents(){return{}},async readOwnerEvents(){return{}},async readMonthCloseEvents(){return{}},async readQrisCashOut(){return{}},...overrides}}
const financeWriterStub={postOwnerEvent(){},reverseOwnerEvent(){},closeMonth(){},reopenMonth(){}};

test('RC5-C purchase audit aggregates dry-run, downstream evidence, and historical shift resolution',async()=>{
  const inv=inventory();inv.purchaseReconciliations={P1:{}};
  const repository=readRepo({
    async readInventoryPurchase(){return purchase()},
    async readInventoryV2(){return inv},
    async readShiftExpense(){return null},
    async readShift(){return {inventoryMarker:{legacy:true}}}
  });
  const finance=service.createFinanceV33Service({repository,writer:financeWriterStub});
  const audit=await finance.loadPurchaseAudit('P1');
  assert.equal(audit.linkRepairDryRun.status,'MISSING');
  assert.equal(audit.linkRepairDryRun.canRepair,true);
  assert.equal(audit.downstreamInventory.consumptiveQty,0.5);
  assert.equal(audit.downstreamInventory.ambiguousCount,1);
  assert.equal(audit.historicalShiftResolution.eligible,true);
  assert.equal(audit.shiftAudit.state,'NOT_STARTED');
});

test('RC5-C confirmed historical acknowledgement resolves NOT_STARTED shift warning without rewriting shift state',async()=>{
  const repository=readRepo({
    async readMonthShifts(){return {'2026-08-29-S1':{inventoryMarker:{legacy:true}}}},
    async readInventoryPurchases(){return {P1:purchase()}},
    async readPurchaseReconciliations(){return {P1:{A1:{operationId:'A1',purchaseId:'P1',type:'HISTORICAL_SHIFT_ACK',status:'CONFIRMED',shiftKey:'2026-08-29-S1',createdTs:2000}}}}
  });
  const finance=service.createFinanceV33Service({repository,writer:financeWriterStub});
  const loaded=await finance.loadMonth('2026-08');
  assert.equal(loaded.shiftMap['2026-08-29-S1'].inventoryMarker.legacy,true,'shift source stays untouched');
  assert.equal(loaded.allShiftsClosed,true,'acknowledged historical NOT_STARTED association is resolved for Finance close warning');
  assert.deepEqual(loaded.historicalResolvedShiftKeys,['2026-08-29-S1']);
  assert.deepEqual(loaded.openShiftKeys,[]);
});

test('RC5-C purchase audit UI shows dry-run and downstream evidence plus disabled historical resolution in LOCAL QA',()=>{
  const p=purchase(),inv=inventory(),shiftAudit={shiftKey:'2026-08-29-S1',state:'NOT_STARTED',sessionId:null,locked:false,closingSnapshot:false,issues:['SHIFT_STATUS_INCOMPLETE']};
  const base=service.buildPurchaseAuditEvidenceV33({purchase:p,expense:null,movement:inv.movements.M1});
  const audit={...base,reconciliation:{linkRepair:{eligible:true,blockers:[]},reversal:{eligible:false,blockers:['DOWNSTREAM_CONSUMPTION_DETECTED','DOWNSTREAM_INVENTORY_AMBIGUOUS']},events:[]},shiftAudit,linkRepairDryRun:service.buildLinkRepairDryRunV33({purchase:p,expense:null}),downstreamInventory:service.buildDownstreamInventoryEvidenceV33({purchase:p,inventory:inv}),historicalShiftResolution:service.buildHistoricalShiftResolutionV33({purchase:p,shiftAudit,reconciliations:[]})};
  const html=renderPurchaseAuditV33(audit,{readOnly:true});
  assert.match(html,/Dry-run Link Expense/);
  assert.match(html,/MISSING/);
  assert.match(html,/Belanja Bahan/);
  assert.match(html,/Pembelian TEH/);
  assert.match(html,/Supplier A/);
  assert.match(html,/Evidence Inventory Setelah Pembelian/);
  assert.match(html,/SALE_CONSUMPTION/);
  assert.match(html,/OPNAME/);
  assert.match(html,/Resolusi Shift Historis/);
  assert.match(html,/Acknowledgement/);
  assert.match(html,/disabled/);
  assert.match(html,/LOCAL QA/);
});

test('RC5-C controller blocks historical acknowledgement in LOCAL QA and delegates with Owner re-auth when writable',async()=>{
  const calls=[],p4={finance:{loadMonth(){},loadPurchaseAudit(){},acknowledgeHistoricalShift:async x=>{calls.push(x);return x}},authorizer:{authorize:async({pin})=>({ok:true,role:'owner',ownerId:'owner-a',ownerName:'Owner A',requesterId:'owner-a',requesterRole:'owner',reauthenticatedAt:1000,pinSeen:pin})}};
  const ro=createFinanceWorkspaceControllerV33({p4,readOnly:true});
  await assert.rejects(()=>ro.acknowledgeHistoricalShift({purchaseId:'P1',note:'historis',pin:'1234'}),/LOCAL_QA_READ_ONLY/);
  const rw=createFinanceWorkspaceControllerV33({p4,readOnly:false,now:()=>1000,random:()=>0.1});
  await rw.acknowledgeHistoricalShift({purchaseId:'P1',note:'historis',pin:'1234'});
  assert.equal(calls.length,1);assert.equal(calls[0].purchaseId,'P1');assert.equal(calls[0].note,'historis');assert.ok(calls[0].authorization);
});


test('RC5-C writer refuses a second confirmed historical acknowledgement with a different operationId',async()=>{
  const seed=writerSeed();seed.toko_segeranjiwa_v58.global.inventoryV2.purchaseReconciliations.P1.OLD={operationId:'OLD',purchaseId:'P1',type:'HISTORICAL_SHIFT_ACK',status:'CONFIRMED',shiftKey:'2026-08-29-S1'};
  const {createPurchaseReconciliationWriter}=await import('../src/data/writers/purchase-reconciliation-writer.js'),db=fakeDb(seed),writer=createPurchaseReconciliationWriter({db,now:()=>3000});
  await assert.rejects(()=>writer.acknowledgeHistoricalShift({operationId:'HIST-ACK-NEW',purchaseId:'P1',note:'duplicate',authorization:ownerProof(3000)}),/HISTORICAL_SHIFT_ALREADY_ACKNOWLEDGED/);
});

test('RC5-C Finance summary labels reconciled historical shift accurately instead of claiming every shift was closed',()=>{
  const loaded={period:'2026-08',allShiftsClosed:true,historicalResolvedShiftKeys:['2026-08-29-S1'],openShiftKeys:[],incompleteShiftKeys:[],input:{expenses:[],ownerEvents:[]},model:{profit:{netSales:0,cogs:0,cogsKnown:true,businessExpenses:0,netProfit:0,hppCoverage:{unknownTransactions:0}},ownerCapital:{opening:0,additional:0,prive:0,calculatedEnding:0},cashPosition:{available:0,source:'Ekspektasi kas shift'},outstanding:{pendingTransactions:0,customerDebt:0,employeeAdvance:0},obligations:{scheduleAuthorityAvailable:false,observed:[]},cashFlow:{rows:[]},daily:[]}};
  const html=renderFinanceWorkspaceV33({loaded,tab:'summary',readOnly:true});
  assert.match(html,/shift historis/i);
  assert.doesNotMatch(html,/Semua shift tertutup/);
});
