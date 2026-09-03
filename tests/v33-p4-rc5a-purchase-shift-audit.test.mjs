import test from 'node:test';
import assert from 'node:assert/strict';
import * as financeServiceModule from '../src/domain/finance-v33-service.js';
import * as inventoryWorkspaceModule from '../src/ui/inventory-workspace-v32.js';
import { buildFinanceReadModel } from '../src/domain/finance-v33-analytics.js';
import { renderFinanceWorkspaceV33 } from '../src/ui/finance-v33-workspace.js';

function baseRepository(overrides={}){
  return {
    async readMonthShifts(){return {}},
    async readInventoryPurchases(){return {}},
    async readRefunds(){return {}},
    async readCustomerDebts(){return {}},
    async readEmployeeAdvances(){return {}},
    async readQrisSignals(){return {}},
    async readQrisEvents(){return {}},
    async readOwnerEvents(){return {}},
    async readMonthCloseEvents(){return {}},
    async readQrisCashOut(){return {}},
    ...overrides
  };
}
const writer={postOwnerEvent(){},reverseOwnerEvent(){},closeMonth(){},reopenMonth(){}};

test('RC5-A Finance uses canonical P3 shift state and ignores non-shift month nodes',async()=>{
  assert.equal(typeof financeServiceModule.canonicalShiftStateV33,'function','canonical shift helper must exist');
  assert.equal(financeServiceModule.canonicalShiftStateV33({sessionControl:{status:'CLOSED'}}),'CLOSED');
  assert.equal(financeServiceModule.canonicalShiftStateV33({shiftStatus:'ACTIVE',sessionControl:{status:'ACTIVE',currentSessionId:'SID-1'}}),'ACTIVE');
  assert.equal(financeServiceModule.canonicalShiftStateV33({shiftStatus:'ACTIVE'}),'NOT_STARTED','ACTIVE without session identity is not canonical ACTIVE');
  const repository=baseRepository({async readMonthShifts(){return {
    '2026-09-01-S1':{sessionControl:{status:'CLOSED'}},
    '2026-09-01-S2':{locked:true},
    '2026-09-diagnostic':{shiftStatus:'ACTIVE',currentSessionId:'BAD'},
    '2026-09-99-S9':{shiftStatus:'ACTIVE',currentSessionId:'BAD2'},
    global:{shiftStatus:'ACTIVE'}
  }}});
  const service=financeServiceModule.createFinanceV33Service({repository,writer});
  const loaded=await service.loadMonth('2026-09');
  assert.deepEqual(loaded.shiftKeys,['2026-09-01-S1','2026-09-01-S2']);
  assert.equal(loaded.shiftCount,2);
  assert.equal(loaded.allShiftsClosed,true);
});

test('RC5-A Inventory purchase delegation requires existing SJShift authority to report ACTIVE',()=>{
  assert.equal(typeof inventoryWorkspaceModule.assertActivePurchaseShiftV32,'function','purchase shift gate must exist');
  assert.throws(()=>inventoryWorkspaceModule.assertActivePurchaseShiftV32({SJShift:{currentData:()=>({}),state:()=> 'NOT_STARTED'}}),/PURCHASE_SHIFT_REQUIRED/);
  assert.throws(()=>inventoryWorkspaceModule.assertActivePurchaseShiftV32({SJShift:{currentData:()=>({locked:true}),state:()=> 'CLOSED'}}),/PURCHASE_SHIFT_REQUIRED/);
  const activeData={shiftStatus:'ACTIVE',sessionControl:{status:'ACTIVE',currentSessionId:'SID-1'}};
  const result=inventoryWorkspaceModule.assertActivePurchaseShiftV32({SJShift:{currentData:()=>activeData,state:d=>d===activeData?'ACTIVE':'NOT_STARTED',currentSessionId:()=> 'SID-1'}});
  assert.equal(result.state,'ACTIVE');
  assert.equal(result.sessionId,'SID-1');
});

test('RC5-A Finance service loads linked purchase, expense, and movement evidence read-only',async()=>{
  const purchase={id:'P1',purchaseId:'P1',status:'COMMITTED',itemType:'ingredient',itemId:'ING_TEA',itemName:'TEH',qtyReceived:1,unit:'pack',landedCost:25000,fundSource:'CASH',shift:'2026-08-29-S1',expenseRef:'E1',movementRef:'M1',supplier:'TOKO A',stockBefore:9,stockAfter:10,oldWac:20000,newWac:20500,createdTs:1000};
  const expense={id:'E1',purchaseRef:'P1',amount:25000,category:'Belanja Bahan',source:'CASH'};
  const movement={id:'M1',purchaseId:'P1',type:'PURCHASE',itemId:'ING_TEA',delta:1,location:'warehouse'};
  const repository=baseRepository({
    async readInventoryPurchase(id){assert.equal(id,'P1');return purchase},
    async readInventoryMovement(id){assert.equal(id,'M1');return movement},
    async readShiftExpense(shift,id){assert.equal(shift,'2026-08-29-S1');assert.equal(id,'E1');return expense}
  });
  const service=financeServiceModule.createFinanceV33Service({repository,writer});
  assert.equal(typeof service.loadPurchaseAudit,'function');
  const audit=await service.loadPurchaseAudit('P1');
  assert.equal(audit.purchaseId,'P1');
  assert.equal(audit.status,'COMMITTED');
  assert.equal(audit.itemName,'TEH');
  assert.equal(audit.landedCost,25000);
  assert.equal(audit.shiftKey,'2026-08-29-S1');
  assert.equal(audit.evidence.expense,'verified');
  assert.equal(audit.evidence.movement,'verified');
  assert.equal(audit.evidence.stock,'verified');
  assert.equal(audit.evidence.wac,'verified');
  assert.deepEqual(audit.warnings,[]);
  assert.equal(audit.correctionPolicy,'AUDIT_FIRST_NO_DELETE');
});

test('RC5-A Arus Kas makes Inventory Purchase auditable and labels it separate from business expense',()=>{
  const input={
    transactions:[],expenses:[{id:'E1',purchaseRef:'P1',systemLinked:true,amount:25000,category:'Belanja Bahan',source:'CASH',ts:1000}],
    purchases:[{id:'P1',status:'COMMITTED',itemName:'TEH',landedCost:25000,fundSource:'CASH',shift:'2026-08-29-S1',expenseRef:'E1',movementRef:'M1',createdTs:1000}],
    ownerEvents:[],refunds:[],customerDebts:[],employeeAdvances:[],qrisCashOut:[],debtPayments:[],advancePayments:[],advanceIssued:[],cashMovements:[]
  };
  const model=buildFinanceReadModel(input);
  const loaded={period:'2026-08',model:{...model,cashPosition:{available:0,source:'Ekspektasi kas shift'}},input,allShiftsClosed:true,shiftCount:1,shiftKeys:['2026-08-29-S1'],activeClose:null};
  const html=renderFinanceWorkspaceV33({loaded,tab:'cashflow',readOnly:true});
  assert.match(html,/data-v33-purchase-audit="P1"/);
  assert.match(html,/Pembelian TEH/);
  assert.match(html,/Belanja Stok/);
});

test('RC5-A purchase audit detail shows immutable evidence and explains why it is not granular business expense',()=>{
  assert.equal(typeof financeServiceModule.buildPurchaseAuditEvidenceV33,'function','purchase audit evidence builder must exist');
  const audit=financeServiceModule.buildPurchaseAuditEvidenceV33({
    purchase:{id:'P1',status:'COMMITTED',itemName:'TEH',qtyReceived:1,unit:'pack',landedCost:25000,fundSource:'CASH',shift:'2026-08-29-S1',expenseRef:'E1',movementRef:'M1',stockBefore:9,stockAfter:10,oldWac:20000,newWac:20500},
    expense:{id:'E1',purchaseRef:'P1',amount:25000},
    movement:{id:'M1',purchaseId:'P1',delta:1}
  });
  assert.equal(audit.purchaseId,'P1');
  assert.equal(audit.businessExpense,0);
  assert.equal(audit.cashOut,25000);
});


test('RC5-A Finance exposes the exact canonical open shift keys behind the warning',async()=>{
  const repository=baseRepository({async readMonthShifts(){return {
    '2026-09-02-S1':{shiftStatus:'ACTIVE',currentSessionId:'SID-OPEN',sessionControl:{status:'ACTIVE',currentSessionId:'SID-OPEN'}},
    '2026-09-02-S2':{sessionControl:{status:'CLOSED'}},
    '2026-09-debug':{shiftStatus:'ACTIVE',currentSessionId:'NOISE'}
  }}});
  const service=financeServiceModule.createFinanceV33Service({repository,writer});
  const loaded=await service.loadMonth('2026-09');
  assert.deepEqual(loaded.openShiftKeys,['2026-09-02-S1']);
  const html=renderFinanceWorkspaceV33({loaded,tab:'summary',readOnly:true});
  assert.match(html,/2026-09-02-S1/);
  assert.doesNotMatch(html,/2026-09-debug/);
});
