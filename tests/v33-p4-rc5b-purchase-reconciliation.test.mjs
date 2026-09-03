import test from 'node:test';
import assert from 'node:assert/strict';
import * as financeServiceModule from '../src/domain/finance-v33-service.js';
import { buildFinanceReadModel } from '../src/domain/finance-v33-analytics.js';

function basePurchase(){return {id:'P1',purchaseId:'P1',status:'COMMITTED',itemType:'ingredient',itemId:'ING_TEA',itemName:'TEH',qtyReceived:1,unit:'pack',landedCost:25000,fundSource:'OWNER',shift:'2026-08-29-S1',expenseRef:'E1',movementRef:'M1',stockBefore:9,stockAfter:10,oldWac:20000,newWac:20500,createdTs:1000}}
function baseInventory(){return {balances:{ingredients:{ING_TEA:{outlet:2,warehouse:8}}},costs:{ingredients:{ING_TEA:{wac:20500}}},movements:{M1:{id:'M1',purchaseId:'P1',itemType:'ingredient',itemId:'ING_TEA',type:'PURCHASE',location:'warehouse',delta:1,ts:1000}},purchaseReconciliations:{}}}

function baseFinanceInput(overrides={}){return {transactions:[],expenses:[],purchases:[basePurchase()],purchaseReconciliations:[],ownerEvents:[],refunds:[],customerDebts:[],employeeAdvances:[],qrisCashOut:[],debtPayments:[],advancePayments:[],advanceIssued:[],cashMovements:[],...overrides}}

test('RC5-B valid committed purchase with missing linked expense is eligible for LINK_REPAIR only',()=>{
  assert.equal(typeof financeServiceModule.buildPurchaseReconciliationPlanV33,'function');
  const plan=financeServiceModule.buildPurchaseReconciliationPlanV33({purchase:basePurchase(),expense:null,inventory:baseInventory(),reconciliations:[]});
  assert.equal(plan.linkRepair.eligible,true);
  assert.deepEqual(plan.linkRepair.blockers,[]);
  assert.equal(plan.reversal.eligible,true,'absence of downstream consumption can still permit explicit reversal');
  assert.equal(plan.reversal.cashCompensation,25000);
});

test('RC5-B automatic purchase reversal blocks after downstream consumption or ambiguous opname',()=>{
  const inv=baseInventory();
  inv.movements.M2={id:'M2',itemType:'ingredient',itemId:'ING_TEA',type:'SALE_CONSUMPTION',location:'outlet',delta:-0.25,ts:1200};
  const blocked=financeServiceModule.buildPurchaseReconciliationPlanV33({purchase:basePurchase(),expense:null,inventory:inv,reconciliations:[]});
  assert.equal(blocked.reversal.eligible,false);
  assert.ok(blocked.reversal.blockers.includes('DOWNSTREAM_CONSUMPTION_DETECTED'));

  const inv2=baseInventory();
  inv2.movements.M3={id:'M3',itemType:'ingredient',itemId:'ING_TEA',type:'OPNAME',location:'warehouse',delta:-1,ts:1300};
  const blocked2=financeServiceModule.buildPurchaseReconciliationPlanV33({purchase:basePurchase(),expense:null,inventory:inv2,reconciliations:[]});
  assert.equal(blocked2.reversal.eligible,false);
  assert.ok(blocked2.reversal.blockers.includes('DOWNSTREAM_INVENTORY_AMBIGUOUS'));
});

test('RC5-B transfer-only downstream movements do not block full purchase reversal',()=>{
  const inv=baseInventory();
  inv.movements.TO={id:'TO',itemType:'ingredient',itemId:'ING_TEA',type:'TRANSFER_OUT',location:'warehouse',delta:-1,ts:1100};
  inv.movements.TI={id:'TI',itemType:'ingredient',itemId:'ING_TEA',type:'TRANSFER_IN',location:'outlet',delta:1,ts:1100};
  const plan=financeServiceModule.buildPurchaseReconciliationPlanV33({purchase:basePurchase(),expense:{id:'E1',purchaseRef:'P1'},inventory:inv,reconciliations:[]});
  assert.equal(plan.reversal.eligible,true);
  assert.equal(plan.linkRepair.eligible,false);
});

test('RC5-B confirmed CASH-funded purchase reversal compensates cash flow but never becomes P&L expense or refund',()=>{
  const model=buildFinanceReadModel(baseFinanceInput({purchases:[{...basePurchase(),fundSource:'CASH'}],purchaseReconciliations:[{id:'R1',operationId:'R1',purchaseId:'P1',type:'PURCHASE_REVERSAL',status:'CONFIRMED',cashCompensation:25000,fundSource:'CASH',createdTs:2000}]}));
  assert.equal(model.inventoryPurchases.cashOut,25000);
  assert.equal(model.profit.businessExpenses,0);
  assert.equal(model.cashFlow.totalOut,25000);
  assert.equal(model.cashFlow.totalIn,25000);
  assert.equal(model.cashFlow.netChange,0);
  const reversal=model.cashFlow.rows.find(x=>x.kind==='PURCHASE_REVERSAL');
  assert.equal(reversal?.in,25000);
  assert.equal(reversal?.out,0);
});

test('RC5-B previous confirmed reversal makes another reversal ineligible',()=>{
  const plan=financeServiceModule.buildPurchaseReconciliationPlanV33({purchase:basePurchase(),expense:null,inventory:baseInventory(),reconciliations:[{operationId:'REV-OLD',purchaseId:'P1',type:'PURCHASE_REVERSAL',status:'CONFIRMED'}]});
  assert.equal(plan.reversal.eligible,false);
  assert.ok(plan.reversal.blockers.includes('PURCHASE_ALREADY_REVERSED'));
});

function clone(v){return v==null?v:JSON.parse(JSON.stringify(v))}
function getAt(root,path){const seg=String(path||'').split('/').filter(Boolean);let cur=root;for(const key of seg){if(cur==null)return null;cur=cur[key]}return cur??null}
function setAt(root,path,value){const seg=String(path||'').split('/').filter(Boolean);let cur=root;for(let i=0;i<seg.length-1;i++){cur[seg[i]]??={};cur=cur[seg[i]]}cur[seg.at(-1)]=clone(value)}
function fakeDb(initial={}){const data=clone(initial)||{},seen=[];return {data,seen,ref(path=''){seen.push(path);return {once:async type=>{assert.equal(type,'value');return{val:()=>clone(getAt(data,path))}},transaction:async fn=>{const current=clone(getAt(data,path)),next=fn(current);if(next===undefined)return{committed:false,snapshot:{val:()=>clone(current)}};setAt(data,path,next);return{committed:true,snapshot:{val:()=>clone(next)}}}}}}}
function ownerProof(ts=1000){return {ok:true,role:'owner',ownerId:'owner-a',ownerName:'Owner A',requesterId:'owner-a',requesterRole:'owner',reauthenticatedAt:ts}}
function writerSeed({expense=null,downstream=null}={}){const inv=baseInventory();inv.purchases={P1:basePurchase()};if(downstream)inv.movements.M2=downstream;const root={toko_segeranjiwa_v58:{global:{inventoryV2:inv},'2026-08-29-S1':{opex:{}}}};if(expense)root.toko_segeranjiwa_v58['2026-08-29-S1'].opex.E1=expense;return root}

async function loadReconciliationWriter(){return await import('../src/data/writers/purchase-reconciliation-writer.js')}

test('RC5-B LINK_REPAIR reconstructs only missing system-linked expense and appends reconciliation evidence',async()=>{
  const {createPurchaseReconciliationWriter}=await loadReconciliationWriter(),db=fakeDb(writerSeed()),writer=createPurchaseReconciliationWriter({db,now:()=>2000});
  const event=await writer.repairExpenseLink({operationId:'PUR-LINK-001',purchaseId:'P1',note:'Pulihkan evidence',authorization:ownerProof(2000)});
  assert.equal(event.type,'LINK_REPAIR');assert.equal(event.status,'CONFIRMED');
  const expense=getAt(db.data,'toko_segeranjiwa_v58/2026-08-29-S1/opex/E1');
  assert.equal(expense.purchaseRef,'P1');assert.equal(expense.systemLinked,true);assert.equal(expense.amount,25000);
  assert.equal(getAt(db.data,'toko_segeranjiwa_v58/global/inventoryV2/purchases/P1/status'),'COMMITTED','original purchase stays immutable');
  const stored=getAt(db.data,'toko_segeranjiwa_v58/global/inventoryV2/purchaseReconciliations/P1/PUR-LINK-001');assert.equal(stored.status,'CONFIRMED');
  const again=await writer.repairExpenseLink({operationId:'PUR-LINK-001',purchaseId:'P1',authorization:ownerProof(2000)});assert.equal(again.operationId,'PUR-LINK-001');
});

test('RC5-B LINK_REPAIR refuses to overwrite an occupied/nonmatching expenseRef',async()=>{
  const {createPurchaseReconciliationWriter}=await loadReconciliationWriter(),db=fakeDb(writerSeed({expense:{id:'E1',purchaseRef:'OTHER',amount:999}})),writer=createPurchaseReconciliationWriter({db,now:()=>2000});
  await assert.rejects(()=>writer.repairExpenseLink({operationId:'PUR-LINK-002',purchaseId:'P1',authorization:ownerProof(2000)}),/PURCHASE_EXPENSE_REF_OCCUPIED/);
  assert.equal(getAt(db.data,'toko_segeranjiwa_v58/2026-08-29-S1/opex/E1/purchaseRef'),'OTHER');
});

test('RC5-B PURCHASE_REVERSAL atomically compensates safe ingredient quantity/WAC and appends movement/event',async()=>{
  const {createPurchaseReconciliationWriter}=await loadReconciliationWriter(),db=fakeDb(writerSeed()),writer=createPurchaseReconciliationWriter({db,now:()=>3000});
  const event=await writer.reversePurchase({operationId:'PUR-REV-001',purchaseId:'P1',reason:'Transaksi test',authorization:ownerProof(3000)});
  assert.equal(event.type,'PURCHASE_REVERSAL');assert.equal(event.status,'CONFIRMED');assert.equal(event.cashCompensation,25000);
  assert.equal(getAt(db.data,'toko_segeranjiwa_v58/global/inventoryV2/balances/ingredients/ING_TEA/warehouse'),7);
  assert.equal(getAt(db.data,'toko_segeranjiwa_v58/global/inventoryV2/costs/ingredients/ING_TEA/wac'),20000);
  assert.equal(getAt(db.data,'toko_segeranjiwa_v58/global/inventoryV2/purchases/P1/status'),'COMMITTED');
  const movement=getAt(db.data,'toko_segeranjiwa_v58/global/inventoryV2/movements/PUR-REV-PUR-REV-001');
  assert.equal(movement.type,'PURCHASE_REVERSAL');assert.equal(movement.delta,-1);assert.equal(movement.purchaseId,'P1');
  const again=await writer.reversePurchase({operationId:'PUR-REV-001',purchaseId:'P1',reason:'retry',authorization:ownerProof(3000)});assert.equal(again.operationId,'PUR-REV-001');
});

test('RC5-B PURCHASE_REVERSAL fails closed when downstream consumption exists',async()=>{
  const downstream={id:'M2',itemType:'ingredient',itemId:'ING_TEA',type:'SALE_CONSUMPTION',location:'outlet',delta:-0.25,ts:1200};
  const {createPurchaseReconciliationWriter}=await loadReconciliationWriter(),db=fakeDb(writerSeed({downstream})),writer=createPurchaseReconciliationWriter({db,now:()=>3000});
  await assert.rejects(()=>writer.reversePurchase({operationId:'PUR-REV-002',purchaseId:'P1',reason:'test',authorization:ownerProof(3000)}),/DOWNSTREAM_CONSUMPTION_DETECTED/);
  assert.equal(getAt(db.data,'toko_segeranjiwa_v58/global/inventoryV2/balances/ingredients/ING_TEA/warehouse'),8);
});

test('RC5-B reconciliation writer requires fresh Owner self-reauth',async()=>{
  const {createPurchaseReconciliationWriter}=await loadReconciliationWriter(),db=fakeDb(writerSeed()),writer=createPurchaseReconciliationWriter({db,now:()=>200000,maxProofAgeMs:120000});
  await assert.rejects(()=>writer.repairExpenseLink({operationId:'PUR-LINK-003',purchaseId:'P1',authorization:null}),/OWNER_REAUTH_REQUIRED/);
  await assert.rejects(()=>writer.reversePurchase({operationId:'PUR-REV-003',purchaseId:'P1',reason:'auth test',authorization:ownerProof(1)}),/OWNER_REAUTH_EXPIRED/);
});

test('RC5-B purchase reversal requires an explicit reason even when writer is called directly',async()=>{
  const {createPurchaseReconciliationWriter}=await loadReconciliationWriter(),db=fakeDb(writerSeed()),writer=createPurchaseReconciliationWriter({db,now:()=>3000});
  await assert.rejects(()=>writer.reversePurchase({operationId:'PUR-REV-NOREASON',purchaseId:'P1',reason:'',authorization:ownerProof(3000)}),/PURCHASE_REVERSAL_REASON_REQUIRED/);
  assert.equal(getAt(db.data,'toko_segeranjiwa_v58/global/inventoryV2/balances/ingredients/ING_TEA/warehouse'),8);
});

import { renderPurchaseAuditV33, createFinanceWorkspaceControllerV33 } from '../src/ui/finance-v33-workspace.js';

function readRepo(overrides={}){return {async readMonthShifts(){return{}},async readInventoryPurchases(){return{}},async readRefunds(){return{}},async readCustomerDebts(){return{}},async readEmployeeAdvances(){return{}},async readQrisSignals(){return{}},async readQrisEvents(){return{}},async readOwnerEvents(){return{}},async readMonthCloseEvents(){return{}},async readQrisCashOut(){return{}},...overrides}}
const financeWriterStub={postOwnerEvent(){},reverseOwnerEvent(){},closeMonth(){},reopenMonth(){}};

test('RC5-B monthly Finance scopes Inventory Purchase to purchase month and reconciliation cash compensation to correction month',async()=>{
  const augTs=Date.parse('2026-08-29T19:15:00+07:00'),sepTs=Date.parse('2026-09-03T07:00:00+07:00');
  const repository=readRepo({
    async readInventoryPurchases(){return {A:{id:'A',status:'COMMITTED',shift:'2026-08-29-S1',itemName:'TEH',landedCost:25000,fundSource:'CASH',createdTs:augTs},B:{id:'B',status:'COMMITTED',shift:'2026-09-01-S1',itemName:'SUSU',landedCost:40000,fundSource:'CASH',createdTs:sepTs}}},
    async readPurchaseReconciliations(){return {A:{RA:{operationId:'RA',purchaseId:'A',type:'PURCHASE_REVERSAL',status:'CONFIRMED',itemName:'TEH',cashCompensation:25000,fundSource:'CASH',createdTs:sepTs}}}}
  });
  const service=financeServiceModule.createFinanceV33Service({repository,writer:financeWriterStub});
  const august=await service.loadMonth('2026-08');
  assert.equal(august.model.inventoryPurchases.cashOut,25000);
  assert.equal(august.model.cashFlow.rows.some(x=>x.kind==='PURCHASE_REVERSAL'),false,'September correction must not leak into August cash flow');
  const september=await service.loadMonth('2026-09');
  assert.equal(september.model.inventoryPurchases.cashOut,40000);
  assert.equal(september.model.cashFlow.rows.filter(x=>x.kind==='PURCHASE_REVERSAL').length,1);
});

test('RC5-B purchase audit loads reconciliation eligibility and canonical shift audit evidence',async()=>{
  const purchase=basePurchase(),inventory=baseInventory();inventory.purchaseReconciliations={P1:{}};
  const repository=readRepo({
    async readInventoryPurchase(){return purchase},
    async readInventoryV2(){return inventory},
    async readShiftExpense(){return null},
    async readShift(){return {shiftStatus:'ACTIVE',sessionControl:{status:'ACTIVE',currentSessionId:'SID-TEH'},kasAwal:100000}}
  });
  const service=financeServiceModule.createFinanceV33Service({repository,writer:financeWriterStub});
  const audit=await service.loadPurchaseAudit('P1');
  assert.equal(audit.reconciliation.linkRepair.eligible,true);
  assert.equal(audit.reconciliation.reversal.eligible,true);
  assert.equal(audit.shiftAudit.shiftKey,'2026-08-29-S1');
  assert.equal(audit.shiftAudit.state,'ACTIVE');
  assert.equal(audit.shiftAudit.sessionId,'SID-TEH');
  assert.ok(audit.shiftAudit.issues.includes('SHIFT_STILL_ACTIVE'));
});

test('RC5-B purchase audit UI exposes reconciliation and shift audit while LOCAL QA actions stay disabled',()=>{
  const audit={...financeServiceModule.buildPurchaseAuditEvidenceV33({purchase:basePurchase(),expense:null,movement:{id:'M1',purchaseId:'P1'}}),reconciliation:{linkRepair:{eligible:true,blockers:[]},reversal:{eligible:true,blockers:[],cashCompensation:25000,currentWarehouse:8,correctedWarehouse:7,currentWac:20500,correctedWac:20000},events:[]},shiftAudit:{shiftKey:'2026-08-29-S1',state:'ACTIVE',sessionId:'SID-TEH',locked:false,closingSnapshot:false,issues:['SHIFT_STILL_ACTIVE']}};
  const html=renderPurchaseAuditV33(audit,{readOnly:true});
  assert.match(html,/Rekonsiliasi Pembelian/);
  assert.match(html,/Pulihkan Link Expense/);
  assert.match(html,/Reversal Pembelian/);
  assert.match(html,/Audit Shift/);
  assert.match(html,/2026-08-29-S1/);
  assert.match(html,/disabled/);
  assert.match(html,/LOCAL QA/);
});

test('RC5-B controller requires writable mode and Owner re-auth before reconciliation delegates',async()=>{
  const calls=[],p4={finance:{loadMonth(){},loadPurchaseAudit(){},repairPurchaseLink:async x=>{calls.push(['link',x]);return x},reversePurchase:async x=>{calls.push(['reverse',x]);return x}},authorizer:{authorize:async({pin})=>({ok:true,role:'owner',ownerId:'owner-a',requesterId:'owner-a',requesterRole:'owner',reauthenticatedAt:1,pinSeen:pin})}};
  const ro=createFinanceWorkspaceControllerV33({p4,readOnly:true});
  await assert.rejects(()=>ro.repairPurchaseLink({purchaseId:'P1',pin:'1234'}),/LOCAL_QA_READ_ONLY/);
  await assert.rejects(()=>ro.reversePurchase({purchaseId:'P1',reason:'test',pin:'1234'}),/LOCAL_QA_READ_ONLY/);
  const rw=createFinanceWorkspaceControllerV33({p4,readOnly:false,now:()=>1000,random:()=>0.1});
  await rw.repairPurchaseLink({purchaseId:'P1',note:'repair',pin:'1234'});
  await rw.reversePurchase({purchaseId:'P1',reason:'test',pin:'1234'});
  assert.deepEqual(calls.map(x=>x[0]),['link','reverse']);
  assert.equal(calls[0][1].purchaseId,'P1');assert.ok(calls[0][1].authorization);
  assert.equal(calls[1][1].reason,'test');
});
