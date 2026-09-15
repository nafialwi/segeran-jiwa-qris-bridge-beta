import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  applyCup02AuthzRules,
  diffRuleScalars,
  LIFECYCLE_RULES,
  reservationCreateAllowed,
  reservationTransitionAllowed,
  verifyCup02AuthzCandidate
} from '../firebase/r9/cup02-authz-rules.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const fixture=path.join(here,'fixtures/r5/database.rules.v4_1.reference-only.json');
const load=()=>JSON.parse(fs.readFileSync(fixture,'utf8'));
const user={authenticated:true,active:true,role:'transaksi',username:'karyawan'};
const clone=v=>JSON.parse(JSON.stringify(v));
const preparing=()=>({
  id:'IR-TEST-001',status:'PREPARING',shift:'2026-09-15-S1',cashierId:'karyawan',cashierName:'Kasir',
  consumption:{ING_MTS1LG3R:1},estimatedConsumption:{ING_MTS1LG3R:1},shortageConsumption:{ING_MTS1LG3R:0},
  estimateMode:true,createdAt:'2026-09-15T06:00:00.000Z',ts:1789449600000
});

test('CUP02 candidate removes structured consumption val sentinel and limits post-create authority to lifecycle children',()=>{
  const live=load();
  const candidate=applyCup02AuthzRules(live);
  const node=candidate.rules.toko_segeranjiwa_v58.global.inventoryV2.reservations['$reservationId'];
  assert.doesNotMatch(node['.write'],/child\('consumption'\)\.val\(\).*data\.child\('consumption'\)\.val\(\)/);
  assert.equal(node.consumption?.['.write'],undefined);
  for(const [field,rule] of Object.entries(LIFECYCLE_RULES))assert.equal(node[field]?.['.write'],rule,field);
});

test('CUP02 patch changes only reservation create rule and explicit lifecycle child write rules',()=>{
  const live=load();
  const candidate=applyCup02AuthzRules(live);
  const report=verifyCup02AuthzCandidate(live,candidate);
  assert.equal(report.ok,true);
  assert.equal(report.diffCount,15);
  assert.equal(report.unexpectedPaths.length,0);
  assert.equal(report.missingPaths.length,0);
  assert.equal(report.changedPaths.some(p=>p.includes('/consumption/')),false);
  assert.deepEqual(candidate.rules.toko_segeranjiwa_v58.global.inventoryV2.balances,live.rules.toko_segeranjiwa_v58.global.inventoryV2.balances);
  assert.deepEqual(candidate.rules.toko_segeranjiwa_v58.global.inventoryV2.movements,live.rules.toko_segeranjiwa_v58.global.inventoryV2.movements);
});

test('CUP02 model allows legitimate existing lifecycle and rejects reservation evidence mutation',()=>{
  const before=preparing();
  assert.equal(reservationCreateAllowed({user,row:before,key:before.id}),true);
  assert.equal(reservationCreateAllowed({user:{...user,role:'viewer'},row:before,key:before.id}),false);

  const reserved={...clone(before),status:'RESERVED',reservedAt:'2026-09-15T06:00:01.000Z',reservedTs:1789449601000,reservedItems:[{ingredientId:'ING_MTS1LG3R',qty:1,requestedQty:1,shortageQty:0}]};
  assert.equal(reservationTransitionAllowed({user,before,after:reserved}),true);

  const fallbackBefore={...clone(before),id:'IR-TEST-FALLBACK',consumption:{ING_MTS1LG3R:0},shortageConsumption:{ING_MTS1LG3R:1}};
  const fallback={...clone(fallbackBefore),status:'RESERVED',reservedAt:'2026-09-15T06:00:01.000Z',reservedTs:1789449601000,reservedItems:[{ingredientId:'ING_MTS1LG3R',qty:0,requestedQty:1,shortageQty:1}],advisoryFallback:true,advisoryReason:'ESTIMATE_RACE'};
  assert.equal(reservationTransitionAllowed({user,before:fallbackBefore,after:fallback}),true);

  const rolled={...clone(before),status:'ROLLED_BACK',rollbackReason:'PERMISSION_DENIED',rolledBackAt:'2026-09-15T06:00:02.000Z'};
  assert.equal(reservationTransitionAllowed({user,before,after:rolled}),true);

  const committed={...clone(reserved),status:'COMMITTED',txId:'SJ-1',committedAt:'2026-09-15T06:00:03.000Z',committedTs:1789449603000};
  assert.equal(reservationTransitionAllowed({user,before:reserved,after:committed}),true);

  const uncertain={...clone(reserved),status:'COMMIT_UNCERTAIN',txId:'SJ-1',commitError:'NETWORK',commitErrorAt:'2026-09-15T06:00:03.000Z'};
  assert.equal(reservationTransitionAllowed({user,before:reserved,after:uncertain}),true);

  const changedConsumption=clone(reserved);changedConsumption.consumption.ING_MTS1LG3R=2;
  assert.equal(reservationTransitionAllowed({user,before,after:changedConsumption}),false);
  const changedShift={...clone(reserved),shift:'2026-09-15-S2'};
  assert.equal(reservationTransitionAllowed({user,before,after:changedShift}),false);
  const wrongCashier={...user,username:'other'};
  assert.equal(reservationTransitionAllowed({user:wrongCashier,before,after:reserved}),false);
});

test('CUP02 patch is idempotent and current reference contains the structured val defect',()=>{
  const live=load();
  const current=live.rules.toko_segeranjiwa_v58.global.inventoryV2.reservations['$reservationId']['.write'];
  assert.match(current,/newData\.child\('consumption'\)\.val\(\) === data\.child\('consumption'\)\.val\(\)/);
  const once=applyCup02AuthzRules(live);
  const twice=applyCup02AuthzRules(once);
  assert.deepEqual(twice,once);
  assert.equal(diffRuleScalars(once,twice).length,0);
});

test('CUP02 patch refuses structurally incompatible reservation rules',()=>{
  const bad=load();
  bad.rules.toko_segeranjiwa_v58.global.inventoryV2.reservations['$reservationId']['.write']='true';
  assert.throws(()=>applyCup02AuthzRules(bad),/CUP02_UNSUPPORTED_RESERVATION_RULE_BASELINE|CUP02_EXPECTED_SENTINEL_DEFECT_NOT_FOUND/);
});
