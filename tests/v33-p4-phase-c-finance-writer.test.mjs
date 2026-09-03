import test from 'node:test';
import assert from 'node:assert/strict';
import { createFinanceRepository } from '../src/data/repositories/finance-repository.js';
import { buildFinanceReadModel, buildCashFlowRows } from '../src/domain/finance-v33-analytics.js';

function clone(v){return v==null?v:JSON.parse(JSON.stringify(v))}
function getAt(root,path){
  const seg=String(path||'').split('/').filter(Boolean);let cur=root;
  for(const key of seg){if(cur==null)return null;cur=cur[key]}
  return cur??null;
}
function setAt(root,path,value){
  const seg=String(path||'').split('/').filter(Boolean);let cur=root;
  for(let i=0;i<seg.length-1;i++){cur[seg[i]]??={};cur=cur[seg[i]]}
  cur[seg.at(-1)]=clone(value);
}
function fakeDb(initial={}){
  const data=clone(initial)||{},seen=[];
  return {
    data,seen,
    ref(path=''){
      seen.push(path);
      return {
        once:async type=>{assert.equal(type,'value');return {val:()=>clone(getAt(data,path))}},
        transaction:async fn=>{
          const current=clone(getAt(data,path));
          const next=fn(current);
          if(next===undefined)return {committed:false,snapshot:{val:()=>clone(current)}};
          setAt(data,path,next);
          return {committed:true,snapshot:{val:()=>clone(next)}};
        }
      };
    }
  };
}
function ownerProof(ts=1000){return {ok:true,role:'owner',ownerId:'owner-a',ownerName:'Owner A',requesterId:'owner-a',requesterRole:'owner',reauthenticatedAt:ts}}

async function loadWriter(){
  const mod=await import('../src/data/writers/finance-writer.js');
  return mod.createFinanceWriter;
}

test('P4 finance writer appends owner events idempotently and permits only one unreversed opening capital per month',async()=>{
  const createFinanceWriter=await loadWriter(),db=fakeDb(),writer=createFinanceWriter({db,now:()=>1000});
  const first=await writer.postOwnerEvent({operationId:'FIN-OPEN-001',period:'2026-09',type:'OPENING_CAPITAL',amount:500000,effectiveDate:'2026-09-01',source:'OWNER',note:'Modal awal',authorization:ownerProof()});
  assert.equal(first.type,'OPENING_CAPITAL');
  await assert.rejects(()=>writer.postOwnerEvent({operationId:'FIN-OPEN-001',period:'2026-09',type:'OPENING_CAPITAL',amount:500000,effectiveDate:'2026-09-01',source:'OWNER',authorization:ownerProof()}),/DUPLICATE_OPERATION_ID/);
  await assert.rejects(()=>writer.postOwnerEvent({operationId:'FIN-OPEN-002',period:'2026-09',type:'OPENING_CAPITAL',amount:100000,effectiveDate:'2026-09-02',source:'OWNER',authorization:ownerProof()}),/OPENING_CAPITAL_ALREADY_ACTIVE/);
  assert.equal(getAt(db.data,'toko_segeranjiwa_v58/global/financeV1/ownerEvents/2026-09/FIN-OPEN-001').amount,500000);
});

test('P4 owner event correction is append-only REVERSAL and a new opening is allowed only after reversal',async()=>{
  const createFinanceWriter=await loadWriter(),db=fakeDb(),writer=createFinanceWriter({db,now:()=>2000});
  await writer.postOwnerEvent({operationId:'FIN-OPEN-101',period:'2026-09',type:'OPENING_CAPITAL',amount:300000,effectiveDate:'2026-09-01',source:'OWNER',authorization:ownerProof(2000)});
  const reversal=await writer.reverseOwnerEvent({operationId:'FIN-REV-101',period:'2026-09',reversalOf:'FIN-OPEN-101',note:'Salah input',authorization:ownerProof(2000)});
  assert.equal(reversal.type,'REVERSAL');
  assert.equal(reversal.reversalOf,'FIN-OPEN-101');
  assert.equal(reversal.amount,300000);
  await assert.rejects(()=>writer.reverseOwnerEvent({operationId:'FIN-REV-102',period:'2026-09',reversalOf:'FIN-OPEN-101',authorization:ownerProof(2000)}),/OWNER_EVENT_ALREADY_REVERSED/);
  const replacement=await writer.postOwnerEvent({operationId:'FIN-OPEN-102',period:'2026-09',type:'OPENING_CAPITAL',amount:350000,effectiveDate:'2026-09-01',source:'OWNER',authorization:ownerProof(2000)});
  assert.equal(replacement.amount,350000);
  assert.ok(getAt(db.data,'toko_segeranjiwa_v58/global/financeV1/ownerEvents/2026-09/FIN-OPEN-101'));
});

test('P4 finance writer requires fresh Owner self-reauth for capital and month close writes',async()=>{
  const createFinanceWriter=await loadWriter(),db=fakeDb(),writer=createFinanceWriter({db,now:()=>200000,maxProofAgeMs:120000});
  await assert.rejects(()=>writer.postOwnerEvent({operationId:'FIN-CAP-001',period:'2026-09',type:'ADDITIONAL_CAPITAL',amount:1000,effectiveDate:'2026-09-02',source:'OWNER',authorization:null}),/OWNER_REAUTH_REQUIRED/);
  await assert.rejects(()=>writer.postOwnerEvent({operationId:'FIN-CAP-002',period:'2026-09',type:'ADDITIONAL_CAPITAL',amount:1000,effectiveDate:'2026-09-02',source:'OWNER',authorization:ownerProof(1)}),/OWNER_REAUTH_EXPIRED/);
  await assert.rejects(()=>writer.postOwnerEvent({operationId:'FIN-CAP-003',period:'2026-09',type:'ADDITIONAL_CAPITAL',amount:1000,effectiveDate:'2026-09-02',source:'OWNER',authorization:{...ownerProof(200000),requesterRole:'cashier',requesterId:'kasir-a'}}),/OWNER_SELF_REAUTH_REQUIRED/);
});

test('P4 month close is append-only CLOSE/REOPEN and cannot overwrite an active close',async()=>{
  const createFinanceWriter=await loadWriter(),db=fakeDb(),writer=createFinanceWriter({db,now:()=>3000});
  const snapshot={netSales:400000,hpp:180000,hppKnown:true,businessExpenses:50000,cashFlowIn:500000,cashFlowOut:160000,cashFlowNet:340000,modalOpening:300000,modalAdditional:100000,prive:80000,calculatedEnding:490000,shiftCount:3,allShiftsClosed:true,sourceFingerprint:'abc',dataThrough:'2026-09-30T23:59:59.000Z'};
  const close=await writer.closeMonth({operationId:'FIN-CLOSE-001',period:'2026-09',snapshot,authorization:ownerProof(3000)});
  assert.equal(close.type,'CLOSE');
  assert.equal(close.netSales,400000);
  await assert.rejects(()=>writer.closeMonth({operationId:'FIN-CLOSE-002',period:'2026-09',snapshot,authorization:ownerProof(3000)}),/MONTH_ALREADY_CLOSED/);
  const reopen=await writer.reopenMonth({operationId:'FIN-REOPEN-001',period:'2026-09',reopenOf:'FIN-CLOSE-001',note:'Koreksi',authorization:ownerProof(3000)});
  assert.equal(reopen.type,'REOPEN');
  await assert.rejects(()=>writer.reopenMonth({operationId:'FIN-REOPEN-002',period:'2026-09',reopenOf:'FIN-CLOSE-001',authorization:ownerProof(3000)}),/MONTH_CLOSE_ALREADY_REOPENED/);
  const close2=await writer.closeMonth({operationId:'FIN-CLOSE-003',period:'2026-09',snapshot:{...snapshot,netSales:410000},authorization:ownerProof(3000)});
  assert.equal(close2.netSales,410000);
});

test('P4 finance repository reads only approved financeV1 paths',async()=>{
  const db=fakeDb({
    toko_segeranjiwa_v58:{global:{financeV1:{
      ownerEvents:{'2026-09':{A:{type:'PRIVE'}}},
      monthCloseEvents:{'2026-09':{B:{type:'CLOSE'}}},
      qrisCashOut:{PX:{status:'CONFIRMED'}}
    }}}
  });
  const repo=createFinanceRepository({db});
  assert.deepEqual(await repo.readOwnerEvents('2026-09'),{A:{type:'PRIVE'}});
  assert.deepEqual(await repo.readMonthCloseEvents('2026-09'),{B:{type:'CLOSE'}});
  assert.deepEqual(await repo.readQrisCashOut(),{PX:{status:'CONFIRMED'}});
  assert.ok(db.seen.includes('toko_segeranjiwa_v58/global/financeV1/ownerEvents/2026-09'));
  assert.ok(db.seen.includes('toko_segeranjiwa_v58/global/financeV1/monthCloseEvents/2026-09'));
  assert.ok(db.seen.includes('toko_segeranjiwa_v58/global/financeV1/qrisCashOut'));
});

test('P4 finance read model nets reversed capital events without deleting history',()=>{
  const model=buildFinanceReadModel({transactions:[{id:'T1',netRevenue:100000,cogs:40000,costKnown:true}],ownerEvents:{
    O1:{id:'O1',type:'OPENING_CAPITAL',amount:300000,createdTs:1},
    R1:{id:'R1',type:'REVERSAL',amount:300000,reversalOf:'O1',createdTs:2},
    O2:{id:'O2',type:'OPENING_CAPITAL',amount:350000,createdTs:3},
    P1:{id:'P1',type:'PRIVE',amount:50000,createdTs:4}
  }});
  assert.equal(model.ownerCapital.opening,350000);
  assert.equal(model.ownerCapital.prive,50000);
  assert.equal(model.ownerCapital.calculatedEnding,360000);
  const cash=buildCashFlowRows({ownerEvents:{O1:{id:'O1',type:'OPENING_CAPITAL',amount:300000,createdTs:1},R1:{id:'R1',type:'REVERSAL',amount:300000,reversalOf:'O1',createdTs:2}}});
  assert.equal(cash.reduce((s,row)=>s+row.in-row.out,0),0);
  assert.equal(cash.length,2);
});

test('P4 confirmed QRIS cash-out uses actual QRIS receipt for cash flow while P&L revenue stays at sale amount',()=>{
  const input={
    transactions:[{id:'TX-1',status:'PAID',netRevenue:4000,cogs:1000,costKnown:true,method:'QRIS',ts:10}],
    cashMovements:[{id:'CM-1',direction:'OUT',amount:16000,type:'QRIS_CASH_OUT',transactionId:'TX-1',providerTransactionId:'PROV-1',ts:11}],
    qrisCashOut:[{providerTransactionId:'PROV-1',transactionId:'TX-1',saleAmount:4000,qrisReceived:20000,cashOutAmount:16000,status:'CONFIRMED',createdTs:11}]
  };
  const model=buildFinanceReadModel(input);
  assert.equal(model.profit.netSales,4000);
  assert.equal(model.profit.netProfit,3000);
  assert.equal(model.cashFlow.rows.reduce((s,row)=>s+row.in,0),20000);
  assert.equal(model.cashFlow.rows.reduce((s,row)=>s+row.out,0),16000);
  assert.equal(model.cashFlow.rows.reduce((s,row)=>s+row.in-row.out,0),4000);
});
