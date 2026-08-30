import test from 'node:test';
import assert from 'node:assert/strict';
import { createTransactionService } from '../src/domain/transaction-service.js';
import { createInventoryService } from '../src/domain/inventory-service.js';
import { remainingDebt, outstandingFor, createDebtService } from '../src/domain/debt-service.js';
import { createShiftService } from '../src/domain/shift-service.js';
import { createRefundVoidService } from '../src/domain/refund-void-service.js';

test('transaction service delegates final commit to active processTransaction once',async()=>{
  const calls=[];const bridge={async call(name,...args){calls.push([name,...args]);return 'saved'}};
  const svc=createTransactionService({bridge});
  assert.equal(await svc.commitLegacy({source:'test'}),'saved');
  assert.deepEqual(calls,[['processTransaction',{source:'test'}]]);
  const q=svc.quote([{id:'A',p:1000,q:2}],{settings:{}});assert.equal(q.total,2000);
});

test('inventory service delegates recipe lifecycle to existing SJInventoryV2',async()=>{
  const calls=[];const engine={status(){calls.push(['status']);return {started:true}},recipeForProduct(id){calls.push(['recipe',id]);return {id}},async reserveRecipeConsumption(c){calls.push(['reserve',c]);return {reservationId:'R'}},async rollbackRecipeReservation(r,why){calls.push(['rollback',r,why]);return true},async commitRecipeReservation(r,tx,s,c){calls.push(['commit',r,tx,s,c]);return true},async recoverVoidTransactions(){calls.push(['recover']);return 2}};
  const svc=createInventoryService({engine});
  assert.deepEqual(svc.status(),{started:true});assert.deepEqual(svc.recipeForProduct('P1'),{id:'P1'});assert.deepEqual(await svc.reserveRecipeConsumption(['x']),{reservationId:'R'});assert.equal(await svc.rollbackRecipeReservation('R','ERR'),true);assert.equal(await svc.commitRecipeReservation('R','T','S',['x']),true);assert.equal(await svc.recoverVoidTransactions(),2);
  assert.equal(calls.length,6);
});

test('debt helpers preserve legacy remaining and same-name outstanding semantics',()=>{
  assert.equal(remainingDebt({originalAmount:10000,paid:2500}),7500);
  assert.equal(remainingDebt({nominal:10000,paid:1000,remaining:1234}),1234);
  assert.equal(outstandingFor([{nama:'Nafi',originalAmount:4000,paid:0},{nama:' nafi ',nom:3000,paid:1000},{nama:'Other',remaining:9000}], 'NAFI'),6000);
  assert.equal(outstandingFor([],''),0);
});

test('debt service delegates mutations to existing global authorities only',async()=>{
  const calls=[];const bridge={async call(n,...a){calls.push([n,...a]);return true}};const svc=createDebtService({bridge});
  await svc.openCustomerPayment('H1');await svc.openEmployeeAdvancePayment('K1');await svc.saveEmployeeAdvance();
  assert.deepEqual(calls,[['lunasiHutang','H1'],['lunasiKasbonKaryawan','K1'],['simpanKasbonKaryawan']]);
});

test('shift service delegates state/guard/start/handover/close to SJShift',async()=>{
  const calls=[];const engine={state(d){calls.push(['state',d]);return 'ACTIVE'},guardTransaction(){calls.push(['guard']);return true},async startShift(){calls.push(['start']);return 'S'},async submitHandover(){calls.push(['handover']);return 'H'},async submitClose(){calls.push(['close']);return 'C'}};
  const svc=createShiftService({engine});assert.equal(svc.state({x:1}),'ACTIVE');assert.equal(svc.guardTransaction(),true);assert.equal(await svc.startShift(),'S');assert.equal(await svc.handover(),'H');assert.equal(await svc.closeShift(),'C');assert.deepEqual(calls.map(x=>x[0]),['state','guard','start','handover','close']);
});

test('refund/VOID service chooses the final hardening authority and calls it once',async()=>{
  const calls=[];const hardening={async processRefund(){calls.push('refund');return 'R'},async voidTx(i){calls.push(['void',i]);return 'V'},searchRefund(){calls.push('search');return 'S'}};
  const bridge={get(n){if(n==='SJOperationalHardening')return hardening}};const svc=createRefundVoidService({bridge});
  assert.equal(svc.searchRefund(),'S');assert.equal(await svc.processRefund(),'R');assert.equal(await svc.voidTransaction(3),'V');assert.deepEqual(calls,['search','refund',['void',3]]);
});
