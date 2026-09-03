import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyExpense,
  buildFinanceReadModel,
  buildCashFlowRows,
  qrisCashOutSemantics
} from '../src/domain/finance-v33-analytics.js';

test('inventory purchase linked expense is cashflow out but excluded from operating expense P&L',()=>{
  const e={id:'E1',category:'Belanja Bahan',amount:100000,source:'CASH',systemLinked:true,purchaseRef:'P1',ts:1};
  const c=classifyExpense(e);
  assert.equal(c.kind,'INVENTORY_PURCHASE');
  assert.equal(c.cashFlowOut,100000);
  assert.equal(c.profitExpense,0);
});

test('manual salary/electricity/rent remain business expenses in P&L',()=>{
  for(const category of ['Gaji','Listrik','Sewa']){
    const c=classifyExpense({category,amount:25000,source:'OWNER'});
    assert.equal(c.kind,'OPERATING_EXPENSE');
    assert.equal(c.profitExpense,25000);
  }
});

test('finance model separates cashflow, profit and owner equity semantics',()=>{
  const model=buildFinanceReadModel({
    transactions:[{id:'T1',status:'PAID',netRevenue:400000,cogs:180000,costKnown:true}],
    expenses:[
      {id:'E1',category:'Listrik',amount:50000,source:'CASH'},
      {id:'E2',category:'Belanja Bahan',amount:120000,source:'CASH',systemLinked:true,purchaseRef:'P1'}
    ],
    ownerEvents:[
      {type:'OPENING_CAPITAL',amount:300000},
      {type:'ADDITIONAL_CAPITAL',amount:100000},
      {type:'PRIVE',amount:80000}
    ]
  });
  assert.equal(model.profit.netSales,400000);
  assert.equal(model.profit.cogs,180000);
  assert.equal(model.profit.businessExpenses,50000);
  assert.equal(model.profit.netProfit,170000);
  assert.equal(model.ownerCapital.opening,300000);
  assert.equal(model.ownerCapital.additional,100000);
  assert.equal(model.ownerCapital.prive,80000);
  assert.equal(model.ownerCapital.calculatedEnding,490000); // 300 +100 +170 -80
});

test('unknown HPP never becomes zero-profit fiction',()=>{
  const model=buildFinanceReadModel({transactions:[
    {id:'T1',status:'PAID',netRevenue:100000,cogs:40000,costKnown:true},
    {id:'T2',status:'PAID',netRevenue:80000,cogs:null,costKnown:false}
  ]});
  assert.equal(model.profit.cogsKnown,false);
  assert.equal(model.profit.netProfit,null);
  assert.equal(model.profit.hppCoverage.knownTransactions,1);
  assert.equal(model.profit.hppCoverage.unknownTransactions,1);
});

test('cashflow rows include inventory purchase but do not double count linked expense',()=>{
  const rows=buildCashFlowRows({
    expenses:[{id:'E1',amount:100000,category:'Belanja Bahan',source:'CASH',purchaseRef:'P1',systemLinked:true,ts:20}],
    purchases:[{id:'P1',landedCost:100000,fundSource:'CASH',status:'COMMITTED',createdTs:19,expenseRef:'E1'}]
  });
  assert.equal(rows.filter(x=>x.kind==='INVENTORY_PURCHASE').length,1);
  assert.equal(rows.reduce((s,x)=>s+x.out,0),100000);
});

test('QRIS cash-out semantics keep omzet at sale value and cash-out outside expense/refund',()=>{
  const x=qrisCashOutSemantics({saleAmount:4000,qrisReceived:20000});
  assert.deepEqual(x,{saleRevenue:4000,qrisInflow:20000,cashOut:16000,businessExpense:0,refund:0,netLiquidityChange:4000});
});

test('RC4 finance read model exposes cash-flow totals, daily inspection, outstanding balances and observed monthly obligations without new writers',()=>{
  const ts=(day,hour)=>Date.parse(`2026-09-${String(day).padStart(2,'0')}T${String(hour).padStart(2,'0')}:00:00+07:00`);
  const model=buildFinanceReadModel({
    transactions:[
      {id:'T1',status:'PAID',netRevenue:100000,cogs:40000,costKnown:true,method:'CASH',ts:ts(2,9)},
      {id:'T2',status:'PAID',netRevenue:50000,cogs:null,costKnown:false,method:'QRIS',ts:ts(3,10)},
      {id:'TP',status:'PENDING',netRevenue:7000,cogs:2000,costKnown:true,method:'CASH',ts:ts(3,11)}
    ],
    expenses:[
      {id:'E1',category:'Listrik',amount:10000,source:'CASH',ts:ts(2,12)},
      {id:'E2',category:'Sewa',amount:20000,source:'BANK',ts:ts(3,12)}
    ],
    ownerEvents:[{operationId:'O1',type:'ADDITIONAL_CAPITAL',amount:25000,source:'OWNER',createdTs:ts(2,8)}],
    customerDebts:[{id:'H1',originalAmount:20000,paid:5000}],
    employeeAdvances:[{id:'K1',nominal:15000,paid:3000}]
  });
  assert.equal(model.cashFlow.totalIn,175000);
  assert.equal(model.cashFlow.totalOut,30000);
  assert.equal(model.cashFlow.netChange,145000);
  assert.equal(model.daily.length,2);
  assert.deepEqual(model.daily.map(x=>x.date),['2026-09-02','2026-09-03']);
  assert.equal(model.outstanding.customerDebt,15000);
  assert.equal(model.outstanding.employeeAdvance,12000);
  assert.equal(model.outstanding.pendingTransactions,1);
  assert.deepEqual(model.obligations.observed.map(x=>x.category),['Listrik','Sewa']);
  assert.equal(model.obligations.scheduleAuthorityAvailable,false);
});
