import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyStockComponentRules,
  verifyStockComponentRulesCandidate,
  mappingWriteAllowedModel,
  balanceTransitionAllowedModel,
  APPLICATION_WRITE,
  BALANCE_WRITE,
  STOCK_COMPONENT_OP_VALIDATE
} from '../firebase/r10/stock-components-rules.mjs';

const base=()=>({rules:{toko_segeranjiwa_v58:{global:{inventoryV2:{
  balances:{ingredients:{'$ingredientId':{'.write':"auth != null && false"}}},
  movements:{'$movementId':{'.write':"auth != null && false"}},
  reservations:{'$reservationId':{'.write':'EXISTING_RESERVATION_RULE'}},
  ingredients:{'.write':'EXISTING_MASTER_RULE'},
  productWarehouse:{'.write':'EXISTING_PRODUCT_WAREHOUSE_RULE'}
}}}}});

test('Task 9 candidate changes only exact Product Stock Component authorization surfaces',()=>{
  const live=base(),candidate=applyStockComponentRules(live),report=verifyStockComponentRulesCandidate(live,candidate);
  assert.equal(report.ok,true);
  assert.equal(report.deployCommandCount,0);
  assert.equal(report.productionMutationCount,0);
  assert.ok(report.changedPaths.some(p=>p.includes('/productStockComponents/')));
  assert.ok(report.changedPaths.some(p=>p.includes('/stockApplications/')));
  assert.ok(report.changedPaths.some(p=>p.endsWith('/balances/ingredients/$ingredientId/.write')));
  assert.ok(report.changedPaths.some(p=>p.includes('/movements/')));
  assert.equal(candidate.rules.toko_segeranjiwa_v58.global.inventoryV2.reservations['$reservationId']['.write'],'EXISTING_RESERVATION_RULE');
  assert.equal(candidate.rules.toko_segeranjiwa_v58.global.inventoryV2.ingredients['.write'],'EXISTING_MASTER_RULE');
  assert.equal(candidate.rules.toko_segeranjiwa_v58.global.inventoryV2.productWarehouse['.write'],'EXISTING_PRODUCT_WAREHOUSE_RULE');
});

test('Owner mapping passes while Cashier, unauthenticated and malformed mappings are denied',()=>{
  assert.equal(mappingWriteAllowedModel({role:'manajemen',qty:1}),true);
  assert.equal(mappingWriteAllowedModel({role:'owner',qty:0.5}),false);
  assert.equal(mappingWriteAllowedModel({role:'transaksi',qty:1}),false);
  assert.equal(mappingWriteAllowedModel({role:'manajemen',qty:-1}),false);
  assert.equal(mappingWriteAllowedModel({role:'manajemen',qty:1,authenticated:false}),false);
});

test('legitimate sale balance transition passes; duplicate/shortage/restore remain non-negative and deterministic',()=>{
  const common={role:'transaksi',before:{outlet:10,warehouse:20},application:{status:'CLAIMED'}};
  assert.equal(balanceTransitionAllowedModel({...common,after:{outlet:8,warehouse:20},marker:{state:'APPLIED',qty:2}}),true);
  assert.equal(balanceTransitionAllowedModel({...common,after:{outlet:10,warehouse:20},marker:{state:'SHORTAGE',qty:99}}),true);
  assert.equal(balanceTransitionAllowedModel({...common,after:{outlet:-1,warehouse:20},marker:{state:'APPLIED',qty:11}}),false);
  assert.equal(balanceTransitionAllowedModel({...common,after:{outlet:8,warehouse:21},marker:{state:'APPLIED',qty:2}}),false);
  assert.equal(balanceTransitionAllowedModel({role:'transaksi',before:{outlet:8,warehouse:20},after:{outlet:9,warehouse:20},marker:{state:'APPLIED',qty:1,restoreId:'RF1'},application:{status:'COMPLETED'}}),true);
  assert.equal(balanceTransitionAllowedModel({role:'transaksi',before:{outlet:8,warehouse:20},after:{outlet:9,warehouse:20},marker:{state:'APPLIED',qty:1},application:{status:'CLAIMED'}}),false);
});

test('candidate contains no blanket write true and introduces no parallel stock authority',()=>{
  const candidate=applyStockComponentRules(base()),s=JSON.stringify(candidate);
  assert.doesNotMatch(s,/"\.write":true/);
  for(const bad of ['global/stockBalances','global/stockMovements','global/stockApplications','global/productStockComponents'])assert.equal(s.includes(bad),false);
});


test('Task 9 remediation covers writer shortage metadata and idempotent replay contract',()=>{
  assert.match(BALANCE_WRITE,/stockComponentOps/);
  assert.doesNotMatch(BALANCE_WRITE,/numChildren/);
  assert.match(BALANCE_WRITE,/lastOp/);
  assert.match(STOCK_COMPONENT_OP_VALIDATE,/SHORTAGE/);
  assert.match(STOCK_COMPONENT_OP_VALIDATE,/ROLLED_BACK/);
  assert.match(STOCK_COMPONENT_OP_VALIDATE,/restoreId/);
  assert.match(APPLICATION_WRITE,/snapshotSeal/);
  assert.doesNotMatch(APPLICATION_WRITE,/snapshot'\)\.val\(\)/);
});
