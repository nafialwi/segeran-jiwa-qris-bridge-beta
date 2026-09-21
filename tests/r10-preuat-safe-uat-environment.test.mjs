import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

import {
  injectUatHtml,
  UAT_ROUTER_MARKER,
  UAT_ROUTER_SCRIPT,
  buildUatRouterScript,
  UAT_PROJECT_ID,
  UAT_DATABASE_NAMESPACE
} from '../scripts/uat-html.mjs';

const read=rel=>fs.readFileSync(new URL('../'+rel,import.meta.url),'utf8');

test('PU-09 UAT injector routes every Firebase app to loopback emulators before legacy initializeApp runs',()=>{
  const html='<html><head><script src="https://www.gstatic.com/firebasejs/10.8.1/firebase-storage-compat.js"></script></head><body><script>firebase.initializeApp(fbCfg);</script></body></html>';
  const output=injectUatHtml(html);
  assert.match(output,/UAT TERISOLASI/);
  assert.match(output,new RegExp(UAT_ROUTER_MARKER));
  assert.ok(output.indexOf(UAT_ROUTER_MARKER)<output.indexOf('firebase.initializeApp'));
  assert.ok(output.includes('const emulatorHost="127.0.0.1";'));
  assert.ok(output.includes('db.useEmulator(emulatorHost,9000);'));
  assert.ok(output.includes("auth.useEmulator('http://'+emulatorHost+':9099'"));
  assert.ok(output.includes('storage.useEmulator(emulatorHost,9199);'));
});

test('PU-09 router rewrites production Firebase config to demo-only identity and binds database auth storage to emulators',()=>{
  const calls=[];
  const makeService=(kind)=>({
    useEmulator(...args){calls.push([kind,...args])}
  });
  const firebase={
    initializeApp(config,name){
      calls.push(['init',structuredClone(config),name||'']);
      return {
        database:()=>makeService('database'),
        auth:()=>makeService('auth'),
        storage:()=>makeService('storage'),
        delete:async()=>true
      };
    }
  };
  const context={
    window:{firebase},
    location:{hostname:'127.0.0.1'},
    document:{documentElement:{dataset:{}}},
    console:{warn(){}},
    Object,Error
  };
  vm.runInNewContext(UAT_ROUTER_SCRIPT,context);
  const app=context.window.firebase.initializeApp({
    apiKey:'PRODUCTION_KEY',
    authDomain:'segeranjiwa-id.firebaseapp.com',
    databaseURL:'https://segeranjiwa-id-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId:'segeranjiwa-id',
    storageBucket:'segeranjiwa-id.firebasestorage.app'
  });
  assert.ok(app);
  assert.equal(calls[0][0],'init');
  assert.equal(calls[0][1].projectId,UAT_PROJECT_ID);
  assert.equal(calls[0][1].databaseURL,`https://${UAT_DATABASE_NAMESPACE}.firebaseio.com`);
  assert.doesNotMatch(JSON.stringify(calls[0][1]),/segeranjiwa-id/);
  const routed=calls.slice(1).map(row=>row.slice(0,3));
  assert.equal(routed.length,3);
  assert.deepEqual(routed[0],['database','127.0.0.1',9000]);
  assert.equal(routed[1][0],'auth');
  assert.equal(routed[1][1],'http://127.0.0.1:9099');
  assert.equal(routed[1][2]?.disableWarnings,true);
  assert.deepEqual(routed[2],['storage','127.0.0.1',9199]);
  assert.equal(context.window.__SJ_UAT_ISOLATED,true);
  assert.equal(context.window.__SJ_UAT_ROUTER_ACTIVE,true);
  assert.equal(context.window.__SJ_LOCAL_QA_READ_ONLY,false);
  assert.match(UAT_ROUTER_SCRIPT,/UAT_EXTERNAL_MUTATION_BLOCKED/);
  assert.match(UAT_ROUTER_SCRIPT,/UAT_EXTERNAL_BACKEND_BLOCKED/);
});

test('PU-09 router fails closed on a non-loopback host',()=>{
  const context={
    window:{firebase:{initializeApp(){throw new Error('must not initialize')}}},
    location:{hostname:'example.com'},
    document:{documentElement:{dataset:{}}},
    console:{warn(){}},
    Object,Error
  };
  assert.throws(()=>vm.runInNewContext(UAT_ROUTER_SCRIPT,context),/UAT_LOOPBACK_REQUIRED/);
});


test('PU-11 Mobile UAT routes an approved private LAN host to the same isolated emulators',async()=>{
  const calls=[];
  const makeService=(kind)=>({useEmulator(...args){calls.push([kind,...args])}});
  const firebase={
    initializeApp(config,name){
      calls.push(['init',structuredClone(config),name||'']);
      return {
        database:()=>makeService('database'),
        auth:()=>makeService('auth'),
        storage:()=>makeService('storage')
      };
    }
  };
  const script=buildUatRouterScript('192.168.100.92');
  const fetchCalls=[];
  const context={
    window:{firebase,fetch:async(input,options={})=>{fetchCalls.push([String(input),String(options.method||'GET')]);return{ok:true}}},
    location:{hostname:'192.168.100.92',href:'http://192.168.100.92:4174/'},
    document:{documentElement:{dataset:{}}},
    console:{warn(){}},
    Object,Error,Promise,URL
  };
  vm.runInNewContext(script,context);
  context.window.firebase.initializeApp({projectId:'production-must-be-rewritten'});
  assert.deepEqual(calls[1],['database','192.168.100.92',9000]);
  assert.equal(calls[2][0],'auth');
  assert.equal(calls[2][1],'http://192.168.100.92:9099');
  assert.deepEqual(calls[3],['storage','192.168.100.92',9199]);
  const local=await context.window.fetch('http://192.168.100.92:9000/.json',{method:'PUT'});
  assert.equal(local.ok,true);
  await assert.rejects(
    context.window.fetch('https://example.com/write',{method:'POST'}),
    error=>error?.code==='UAT_EXTERNAL_MUTATION_BLOCKED'
  );
  assert.equal(context.window.__SJ_UAT_MOBILE_LAN,true);
});

test('PU-11 Mobile UAT rejects public or unapproved browser hosts',()=>{
  assert.throws(()=>buildUatRouterScript('8.8.8.8'),/UAT_BROWSER_HOST_NOT_PRIVATE/);
  const script=buildUatRouterScript('192.168.100.92');
  const context={
    window:{firebase:{initializeApp(){throw new Error('must not initialize')}}},
    location:{hostname:'192.168.100.93',href:'http://192.168.100.93:4174/'},
    document:{documentElement:{dataset:{}}},
    console:{warn(){}},
    Object,Error,Promise,URL
  };
  assert.throws(()=>vm.runInNewContext(script,context),/UAT_HOST_NOT_ALLOWED/);
});

test('PU-11 Mobile UAT exposes only a private Windows bridge while Firebase emulators stay WSL-loopback-only',()=>{
  const bridge=read('scripts/uat-windows-lan-bridge.cjs');
  const local=read('scripts/uat-local.mjs');
  const server=read('scripts/dev-server.mjs');
  const pkg=JSON.parse(read('package.json'));
  assert.equal(pkg.scripts['uat:mobile'],'npm run build:ref01 && SJ_UAT_MOBILE=1 node scripts/uat-local.mjs');
  assert.match(bridge,/4174/);
  assert.match(bridge,/9000/);
  assert.match(bridge,/9099/);
  assert.match(bridge,/9199/);
  assert.doesNotMatch(bridge,/0.0.0.0/);
  assert.match(bridge,/127.0.0.1/);
  assert.match(bridge,/isPrivateIpv4/);
  assert.match(local,/SJ_UAT_MOBILE/);
  assert.match(local,/SJ_UAT_MOBILE_HOST/);
  assert.match(local,/uat-windows-lan-bridge.cjs/);
  assert.match(server,/SJ_UAT_MOBILE_HOST/);
});

test('PU-09 production HTML remains untouched unless the explicit UAT injector is used',()=>{
  const html='<html><body><main>production</main></body></html>';
  assert.equal(html.includes(UAT_ROUTER_MARKER),false);
  assert.equal(html.includes('UAT TERISOLASI'),false);
});

test('PU-09 dev server exposes mutually exclusive LOCAL QA and isolated UAT modes',()=>{
  const source=read('scripts/dev-server.mjs');
  assert.match(source,/SJ_UAT/);
  assert.match(source,/injectUatHtml/);
  assert.match(source,/LOCAL_QA_AND_UAT_MUTUALLY_EXCLUSIVE/);
  assert.match(source,/x-segeran-jiwa-mode/);
});

test('PU-09 launcher keeps Firebase emulators loopback-only, demo-project-only and contains no deployment or production mutation command',()=>{
  const source=read('scripts/uat-local.mjs');
  assert.match(source,/demo-segeran-jiwa-uat/);
  assert.match(source,/127\.0\.0\.1/);
  assert.match(source,/emulators:start/);
  assert.doesNotMatch(source,/firebase\s+deploy|database:set|database:update|database:remove|segeranjiwa-id-default-rtdb|--project\s+segeranjiwa-id/);
  const pkg=JSON.parse(read('package.json'));
  assert.equal(pkg.scripts['uat:local'],'npm run build:ref01 && node scripts/uat-local.mjs');
  assert.match(pkg.scripts['uat:emulator:smoke'],/demo-segeran-jiwa-uat/);
  assert.match(pkg.scripts['uat:emulator:smoke'],/emulators:exec/);
});

test('PU-09 emulator configuration is isolated and the deterministic seed contains only synthetic UAT identities',()=>{
  const cfg=JSON.parse(read('firebase/uat/firebase.json'));
  assert.equal(cfg.emulators.database.host,'127.0.0.1');
  assert.equal(cfg.emulators.database.port,9001);
  assert.equal(cfg.emulators.auth.port,9099);
  assert.equal(cfg.emulators.storage.port,9199);
  assert.equal(cfg.emulators.ui.enabled,false);

  const seed=JSON.parse(read('firebase/uat/seed.json'));
  const root=seed.toko_segeranjiwa_v58;
  assert.ok(root?.global);
  assert.equal(root.global.security.authMode,'LEGACY');
  assert.equal(root.global.users.owneruat.role,'manajemen');
  assert.equal(root.global.users.kasiruat.role,'transaksi');
  assert.ok(Array.isArray(root.global.menu));
  assert.ok(root.global.menu.some(row=>row.id==='UAT-RENT-4K'));
  assert.equal(root.global.inventoryV2.balances.ingredients.UAT_SACHET.outlet,40);
  assert.equal(root.global.inventoryV2.productStockComponents['UAT-RENT-4K'].UAT_SACHET.qtyPerUnit,1);
  assert.doesNotMatch(JSON.stringify(seed),/authUid|@|segeranjiwa-id/);
});

test('PU-09 emulator-only rules are never referenced by a deploy script and smoke test writes only loopback demo namespace',()=>{
  const dbRules=JSON.parse(read('firebase/uat/database.rules.json'));
  assert.equal(dbRules.rules['.read'],true);
  assert.equal(dbRules.rules['.write'],true);
  const smoke=read('scripts/uat-seed-smoke.mjs');
  const backend=read('scripts/uat-backend.mjs');
  assert.match(smoke,/127\.0\.0\.1:9001/);
  assert.match(smoke,/UAT_DATABASE_NAMESPACE/);
  assert.match(backend,/demo-segeran-jiwa-uat-default-rtdb/);
  assert.doesNotMatch(smoke+backend,/https:\/\/segeranjiwa-id|firebase\s+deploy|database:set/);
});

test('PU-12 UAT browser RTDB bridge keeps Java emulator internal and browser proxy loopback-only',()=>{
  const cfg=JSON.parse(read('firebase/uat/firebase.json'));
  const proxy=read('scripts/uat-rtdb-proxy.mjs');
  const local=read('scripts/uat-local.mjs');
  const backend=read('scripts/uat-backend.mjs');
  const router=read('scripts/uat-html.mjs');
  assert.equal(cfg.emulators.database.host,'127.0.0.1');
  assert.equal(cfg.emulators.database.port,9001);
  assert.match(backend,/127\.0\.0\.1:9001/);
  const loopbackRouter=buildUatRouterScript('127.0.0.1');
  assert.ok(loopbackRouter.includes('const emulatorHost="127.0.0.1";'));
  assert.ok(loopbackRouter.includes('db.useEmulator(emulatorHost,9000);'));
  assert.match(proxy,/createServer/);
  assert.match(proxy,/127\.0\.0\.1/);
  assert.match(proxy,/9000/);
  assert.match(proxy,/9001/);
  assert.doesNotMatch(proxy,/0\.0\.0\.0/);
  assert.match(local,/uat-rtdb-proxy\.mjs/);
});

test('PU-09 UAT network firewall blocks external mutations and emergency backend access while allowing loopback emulator calls',async()=>{
  const fetchCalls=[];
  const makeService=()=>({useEmulator(){}});
  const firebase={initializeApp(){return{database:makeService,auth:makeService,storage:makeService}}};
  const context={
    window:{firebase,fetch:async(input,options={})=>{fetchCalls.push([String(input),String(options.method||'GET')]);return{ok:true}}},
    location:{hostname:'127.0.0.1',href:'http://127.0.0.1:4174/'},
    document:{documentElement:{dataset:{}}},
    console:{warn(){}},
    Object,Error,Promise,URL
  };
  vm.runInNewContext(UAT_ROUTER_SCRIPT,context);
  await assert.rejects(
    context.window.fetch('https://example.com/write',{method:'POST'}),
    error=>error?.code==='UAT_EXTERNAL_MUTATION_BLOCKED'
  );
  await assert.rejects(
    context.window.fetch('https://segeran-jiwa-emergency.nafialwizain.workers.dev/v1/health'),
    error=>error?.code==='UAT_EXTERNAL_BACKEND_BLOCKED'
  );
  const local=await context.window.fetch('http://127.0.0.1:9000/.json',{method:'PUT'});
  assert.equal(local.ok,true);
  assert.deepEqual(fetchCalls,[['http://127.0.0.1:9000/.json','PUT']]);
});

test('PU-09 actual legacy baseline receives the emulator router before its first Firebase app initialization',()=>{
  const baseline=read('baseline/legacy-v1.0.40.html');
  const output=injectUatHtml(baseline);
  const routerIndex=output.indexOf(UAT_ROUTER_MARKER);
  const initIndex=output.indexOf('firebase.initializeApp');
  assert.ok(routerIndex>=0,'UAT router must be injected');
  assert.ok(initIndex>=0,'legacy Firebase initialization must remain present');
  assert.ok(routerIndex<initIndex,'UAT router must own Firebase initialization before legacy config is consumed');
  assert.match(output,/UAT TERISOLASI/);
});
