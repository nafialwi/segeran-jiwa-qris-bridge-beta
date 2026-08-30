import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createTransactionRepository } from '../src/data/repositories/transaction-repository.js';
import { createInventoryRepository } from '../src/data/repositories/inventory-repository.js';
import { createPurchaseRepository } from '../src/data/repositories/purchase-repository.js';
import { createDebtRepository } from '../src/data/repositories/debt-repository.js';
import { createShiftRepository } from '../src/data/repositories/shift-repository.js';
import { createReportRepository } from '../src/data/repositories/report-repository.js';
import { createReportService } from '../src/domain/report-service.js';

function fakeDb(values={}){
  const calls=[];
  return {calls,ref(path){calls.push(path);return {async once(event){assert.equal(event,'value');return {val(){return values[path]??null},exists(){return values[path]!=null}}}}}};
}

test('SC-02 repositories perform read-only access through fixed POS paths',async()=>{
  const vals={
    'toko_segeranjiwa_v58/2026-08-30-S1/tx':{T1:{total:1000}},
    'toko_segeranjiwa_v58/global/inventory':{P1:5},
    'toko_segeranjiwa_v58/global/inventoryV2':{purchases:{PUR1:{status:'COMMITTED'}}},
    'toko_segeranjiwa_v58/global/inventoryV2/purchases/PUR1':{status:'COMMITTED'},
    'toko_segeranjiwa_v58/global/hutang':{H1:{nama:'Nafi'}},
    'toko_segeranjiwa_v58/global/kasbonKaryawan':{K1:{nama:'Ani'}},
    'toko_segeranjiwa_v58/2026-08-30-S1':{shiftStatus:'ACTIVE'},
    'toko_segeranjiwa_v58/global':{settings:{}}
  };
  const db=fakeDb(vals);
  assert.deepEqual(await createTransactionRepository({db}).readShiftTransactions('2026-08-30-S1'),{T1:{total:1000}});
  assert.deepEqual(await createInventoryRepository({db}).readLegacyStock(),{P1:5});
  assert.equal((await createInventoryRepository({db}).readInventoryV2()).purchases.PUR1.status,'COMMITTED');
  assert.equal((await createPurchaseRepository({db}).readPurchase('PUR1')).status,'COMMITTED');
  assert.equal((await createDebtRepository({db}).readCustomerDebts()).H1.nama,'Nafi');
  assert.equal((await createDebtRepository({db}).readEmployeeAdvances()).K1.nama,'Ani');
  assert.equal((await createShiftRepository({db}).readShift('2026-08-30-S1')).shiftStatus,'ACTIVE');
  assert.deepEqual(await createReportRepository({db}).readGlobal(),{settings:{}});
});

test('repository/domain extraction contains no direct Firebase mutation calls',()=>{
  const urls=[
    '../src/data/repositories/transaction-repository.js','../src/data/repositories/inventory-repository.js','../src/data/repositories/purchase-repository.js','../src/data/repositories/debt-repository.js','../src/data/repositories/shift-repository.js','../src/data/repositories/report-repository.js',
    '../src/domain/transaction-service.js','../src/domain/inventory-service.js','../src/domain/purchase-wac-service.js','../src/domain/debt-service.js','../src/domain/shift-service.js','../src/domain/refund-void-service.js'
  ];
  for(const rel of urls){const src=readFileSync(new URL(rel,import.meta.url),'utf8');for(const token of ['.set(','.update(','.transaction(','.remove('])assert.equal(src.includes(token),false,`${rel} contains ${token}`)}
});

test('report service delegates read-only evidence calculations and keeps missing HPP unavailable',()=>{
  const calls=[];const core={priceFromTx(tx){calls.push(['price',tx.id]);return {total:tx.total}},transactionDetail(tx){calls.push(['tx',tx.id]);return {id:tx.id}},purchaseDetail(p){calls.push(['purchase',p.id]);return {id:p.id}},debtDetail(d,p){calls.push(['debt',d.id,p.length]);return {id:d.id}}};
  const svc=createReportService({legacyCore:core});
  assert.deepEqual(svc.priceFromTx({id:'T',total:900}),{total:900});
  assert.deepEqual(svc.transactionDetail({id:'T'}),{id:'T'});
  assert.deepEqual(svc.purchaseDetail({id:'P'}),{id:'P'});
  assert.deepEqual(svc.debtDetail({id:'D'},[{}]),{id:'D'});
  assert.deepEqual(svc.profitability(50000,null),{netRevenue:50000,hpp:null,grossProfit:null,grossMargin:null,costKnown:false});
  assert.deepEqual(calls,[['price','T'],['tx','T'],['purchase','P'],['debt','D',1]]);
});
