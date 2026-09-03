import test from 'node:test';
import assert from 'node:assert/strict';
import { createFinanceV33Service } from '../src/domain/finance-v33-service.js';
import { installP4FinanceRuntime } from '../src/app/p4-finance-bootstrap.js';
import { POS_ROOT } from '../src/data/firebase-client.js';

function repositoryStub(){
  const calls=[];
  const repo={calls,
    async readMonthShifts(period){calls.push(['shifts',period]);return {
      [`${period}-01-S1`]:{shiftStatus:'CLOSED',tx:{T1:{id:'T1',method:'CASH',netRevenue:100000,cogs:40000,costKnown:true,ts:1}},opex:{E1:{id:'E1',category:'Listrik',amount:10000,source:'CASH',ts:2}},cashMovements:{M1:{id:'M1',direction:'OUT',amount:5000,type:'OTHER',ts:3}}},
      [`${period}-01-S2`]:{shiftStatus:'CLOSED',kasAwal:250000,tunai:50000,tx:{T2:{id:'T2',method:'QRIS',netRevenue:50000,cogs:20000,costKnown:true,ts:4}},opex:{},cashMovements:{}}
    }},
    async readInventoryPurchases(){return {P1:{id:'P1',status:'COMMITTED',landedCost:25000,fundSource:'OWNER',createdTs:5}}},
    async readRefunds(){return {}},async readCustomerDebts(){return {H1:{originalAmount:20000,paid:5000}}},async readEmployeeAdvances(){return {K1:{nominal:15000,paid:3000}}},
    async readQrisSignals(){return {}},async readQrisEvents(){return {}},
    async readOwnerEvents(period){return {O1:{id:'O1',operationId:'O1',period,type:'OPENING_CAPITAL',amount:200000,createdTs:1}}},
    async readMonthCloseEvents(){return {}},async readQrisCashOut(){return {}}
  }; return repo;
}
function writerStub(){
  const calls=[];return {calls,
    async postOwnerEvent(input){calls.push(['postOwnerEvent',input]);return {ok:true,...input}},
    async reverseOwnerEvent(input){calls.push(['reverseOwnerEvent',input]);return {ok:true,...input}},
    async closeMonth(input){calls.push(['closeMonth',input]);return {ok:true,...input}},
    async reopenMonth(input){calls.push(['reopenMonth',input]);return {ok:true,...input}}
  };
}

test('P4 finance service aggregates month shifts into canonical finance model and close metadata',async()=>{
  const repository=repositoryStub(),writer=writerStub(),expenseCalls=[];
  const finance=createFinanceV33Service({repository,writer,openExpense:()=>expenseCalls.push('expense')});
  const loaded=await finance.loadMonth('2026-09');
  assert.equal(loaded.period,'2026-09');
  assert.equal(loaded.shiftCount,2);assert.equal(loaded.allShiftsClosed,true);
  assert.equal(loaded.input.transactions.length,2);assert.equal(loaded.input.expenses.length,1);assert.equal(loaded.input.cashMovements.length,1);
  assert.equal(loaded.model.profit.netSales,150000);assert.equal(loaded.model.profit.cogs,60000);assert.equal(loaded.model.profit.businessExpenses,10000);assert.equal(loaded.model.profit.netProfit,80000);
  assert.equal(loaded.model.ownerCapital.opening,200000);
  assert.equal(loaded.model.cashPosition.available,300000);assert.equal(loaded.model.cashPosition.latestShiftKey,'2026-09-01-S2');
  assert.equal(loaded.model.outstanding.customerDebt,15000);assert.equal(loaded.model.outstanding.employeeAdvance,12000);
  assert.deepEqual(repository.calls,[['shifts','2026-09']]);
});

test('P4 finance write methods delegate only owner-event/month-close authorities and expense CTA delegates existing operational route',async()=>{
  const repository=repositoryStub(),writer=writerStub(),expenseCalls=[];
  const finance=createFinanceV33Service({repository,writer,openExpense:()=>expenseCalls.push('expense')});
  const authorization={ok:true,role:'owner'};
  await finance.postOwnerEvent({operationId:'O2',period:'2026-09',type:'ADDITIONAL_CAPITAL',amount:50000,effectiveDate:'2026-09-02',authorization});
  await finance.reverseOwnerEvent({operationId:'R2',period:'2026-09',reversalOf:'O2',authorization});
  await finance.closeMonth({operationId:'C1',period:'2026-09',checklist:{cash:true},authorization});
  await finance.reopenMonth({operationId:'RO1',period:'2026-09',reopenOf:'C1',authorization});
  finance.openExpense();
  assert.deepEqual(writer.calls.map(x=>x[0]),['postOwnerEvent','reverseOwnerEvent','closeMonth','reopenMonth']);
  assert.deepEqual(expenseCalls,['expense']);
  assert.equal('createExpense' in finance,false);assert.equal('commitSale' in finance,false);assert.equal('writeTransaction' in finance,false);
  const close=writer.calls.find(x=>x[0]==='closeMonth')[1];
  assert.equal(close.snapshot.shiftCount,2);assert.equal(close.snapshot.allShiftsClosed,true);assert.equal(close.snapshot.netSales,150000);
  assert.equal(close.snapshot.outstandingDebt,15000);assert.equal(close.snapshot.outstandingAdvance,12000);
});

test('P4 runtime installs once, resolves the fixed legacy RTDB client, and exposes only approved services',()=>{
  const db={ref(path){return {path}}};
  const repository=repositoryStub(),writer=writerStub(),authorizer={authorize:async()=>({ok:true})},qrisCashOut={execute(){},recover(){}};
  const expenseCalls=[],sc03={features:{openOperational:id=>expenseCalls.push(id)},services:{transaction:{commitLegacy(){}}}};
  const runtime={Function(code){assert.match(code,/typeof db/);return ()=>db}};
  const first=installP4FinanceRuntime(runtime,{sc03,repository,writer,authorizer,qrisCashOut});
  const second=installP4FinanceRuntime(runtime,{sc03,repository:{bad:true},writer:{bad:true},authorizer:{bad:true},qrisCashOut:{bad:true}});
  assert.equal(first,second);assert.equal(runtime.__SJ_P4_FINANCE_RUNTIME,first);assert.equal(first.phase,'P4-v3.3');
  assert.equal(first.db,db);assert.equal(first.repository,repository);assert.equal(first.writer,writer);assert.equal(first.authorizer,authorizer);assert.equal(first.qrisCashOut,qrisCashOut);
  first.finance.openExpense();assert.deepEqual(expenseCalls,[7]);
  assert.equal('expenseWriter' in first,false);assert.equal('saleWriter' in first,false);
  assert.equal(first.roots.pos,POS_ROOT);
});
