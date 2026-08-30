import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT=new URL('..', import.meta.url).pathname;
const MODULE_ROOT=join(ROOT,'src','modules');
const TARGET_FAMILIES=['dashboard','sales','payments','operational','reports','settings'];

async function featureFiles(){
  const files=[];
  for(const family of TARGET_FAMILIES){
    for(const name of await readdir(join(MODULE_ROOT,family))){
      if(name.endsWith('.js')) files.push(join(MODULE_ROOT,family,name));
    }
  }
  return files.sort();
}

function makeRouterLog(){
  const calls=[];
  const router={
    openHome:()=>calls.push(['home']),
    openSales:()=>calls.push(['sales']),
    openOperational:id=>calls.push(['operational',id]),
    closeOperational:()=>calls.push(['operational-close']),
    openReport:id=>calls.push(['report',id]),
    closeReport:()=>calls.push(['report-close']),
    openSettings:id=>calls.push(['settings',id]),
    closeSettings:()=>calls.push(['settings-close']),
    openCart:()=>calls.push(['cart']),
    openCheckout:()=>calls.push(['checkout']),
    openPayment:method=>calls.push(['payment',method]),
    invokeCommand:(alias,...args)=>calls.push(['command',alias,...args])
  };
  return {router,calls};
}

test('SC-03 target feature inventory contains no SC-01 placeholders and every module exports createFeature', async () => {
  const files=await featureFiles();
  assert.equal(files.length,42,'expected frozen SC-03 feature inventory');
  for(const file of files){
    const text=await readFile(file,'utf8');
    assert.doesNotMatch(text,/SC-01 scaffold placeholder/,relative(ROOT,file));
    const mod=await import(pathToFileURL(file).href+`?inventory=${Date.now()}-${Math.random()}`);
    assert.equal(typeof mod.createFeature,'function',`${relative(ROOT,file)} must export createFeature`);
    const feature=mod.createFeature({router:{}});
    assert.equal(typeof feature.id,'string',`${relative(ROOT,file)} id`);
    assert.ok(['active','deferred'].includes(feature.status),`${relative(ROOT,file)} status`);
  }
});

test('SC-03 feature facades preserve representative legacy route and transaction-parent mappings', async () => {
  const {router,calls}=makeRouterLog();
  const stock=(await import('../src/modules/operational/stock.js')).createFeature({router});
  const restock=(await import('../src/modules/operational/restock.js')).createFeature({router});
  const customers=(await import('../src/modules/settings/customers.js')).createFeature({router});
  const qris=(await import('../src/modules/payments/qris.js')).createFeature({router});
  const cart=(await import('../src/modules/sales/cart.js')).createFeature({router});
  const shiftReport=(await import('../src/modules/reports/sales-report.js')).createFeature({router});

  await stock.open();
  await restock.open();
  await customers.open();
  await qris.open();
  await cart.open();
  await shiftReport.open();

  assert.deepEqual(calls,[
    ['operational',3],
    ['operational',9],
    ['settings',9],
    ['payment','QRIS'],
    ['cart'],
    ['report',1]
  ]);
});

test('SC-03 REF-01-only feature boundaries are explicit deferred capabilities instead of invented runtime routes', async () => {
  for(const rel of [
    'settings/appearance.js',
    'settings/security-sync.js'
  ]){
    const mod=await import(pathToFileURL(join(MODULE_ROOT,rel)).href);
    const feature=mod.createFeature({router:{}});
    assert.equal(feature.status,'deferred',rel);
    assert.match(feature.reason,/REF-01|SC-04|future/i,rel);
    assert.throws(()=>feature.open(),/FEATURE_DEFERRED/,rel);
  }
});

test('SC-03 feature modules contain no direct Firebase mutation primitive', async () => {
  const forbidden=/\.(?:set|update|transaction|remove)\s*\(/g;
  for(const file of await featureFiles()){
    const text=await readFile(file,'utf8');
    assert.equal((text.match(forbidden)||[]).length,0,relative(ROOT,file));
  }
});
