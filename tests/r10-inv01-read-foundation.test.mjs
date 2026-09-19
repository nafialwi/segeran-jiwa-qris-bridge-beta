import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as inventoryModule from '../src/data/repositories/inventory-repository.js';

function queryDb(values={}){
  const calls=[];
  return {
    calls,
    ref(path){
      const state={path,orderByChild:null,startAt:null,endAt:null,limitToLast:null};
      const query={
        orderByChild(child){state.orderByChild=child;return query},
        startAt(value){state.startAt=value;return query},
        endAt(value){state.endAt=value;return query},
        limitToLast(value){state.limitToLast=value;return query},
        async once(event){
          assert.equal(event,'value');
          calls.push({...state});
          return {val(){return values[path]??null}};
        }
      };
      return query;
    }
  };
}

test('INV01 repository builds workspace state from child paths, never the inventoryV2 root',async()=>{
  const base='toko_segeranjiwa_v58/global/inventoryV2';
  const db=queryDb({
    [`${base}/ingredients`]:{I1:{id:'I1',name:'Cup 16 Oz'}},
    [`${base}/balances/ingredients`]:{I1:{warehouse:10,outlet:5}},
    [`${base}/costs/ingredients`]:{I1:{wac:700,source:'PURCHASE'}},
    [`${base}/productWarehouse`]:{P1:8}
  });
  const repo=inventoryModule.createInventoryRepository({db});
  assert.equal(typeof repo.readWorkspaceState,'function');
  const state=await repo.readWorkspaceState();
  assert.equal(state.ingredients.I1.name,'Cup 16 Oz');
  assert.equal(state.balances.ingredients.I1.outlet,5);
  assert.equal(state.costs.ingredients.I1.wac,700);
  assert.equal(state.productWarehouse.P1,8);
  const paths=db.calls.map(x=>x.path).sort();
  assert.deepEqual(paths,[
    `${base}/balances/ingredients`,
    `${base}/costs/ingredients`,
    `${base}/ingredients`,
    `${base}/productWarehouse`
  ].sort());
  assert.equal(paths.includes(base),false);
});

test('INV01 recent movement read is server-bounded by ts and limitToLast',async()=>{
  const path='toko_segeranjiwa_v58/global/inventoryV2/movements';
  const db=queryDb({[path]:{M2:{id:'M2',ts:20},M1:{id:'M1',ts:10}}});
  const repo=inventoryModule.createInventoryRepository({db});
  assert.equal(typeof repo.readRecentMovements,'function');
  const rows=await repo.readRecentMovements({limit:120});
  assert.equal(rows.M2.ts,20);
  assert.deepEqual(db.calls,[{path,orderByChild:'ts',startAt:null,endAt:null,limitToLast:120}]);
});

test('INV01 keeps compatibility full-root reader explicit for recovery/audit consumers',async()=>{
  const path='toko_segeranjiwa_v58/global/inventoryV2';
  const db=queryDb({[path]:{purchases:{P1:{status:'COMMITTED'}}}});
  const repo=inventoryModule.createInventoryRepository({db});
  assert.equal((await repo.readInventoryV2()).purchases.P1.status,'COMMITTED');
  assert.equal(db.calls.at(-1).path,path);
});

test('INV01 diagnostics are in-memory and report estimated payload/read totals',async()=>{
  assert.equal(typeof inventoryModule.createInventoryReadDiagnostics,'function');
  const diagnostics=inventoryModule.createInventoryReadDiagnostics({limit:4});
  const base='toko_segeranjiwa_v58/global/inventoryV2';
  const db=queryDb({[`${base}/ingredients`]:{I1:{name:'Es Teh'}}});
  const repo=inventoryModule.createInventoryRepository({db,diagnostics,consumer:'test'});
  assert.equal(typeof repo.readIngredients,'function');
  await repo.readIngredients();
  const entries=diagnostics.entries();
  assert.equal(entries.length,1);
  assert.equal(entries[0].consumer,'test');
  assert.equal(entries[0].operation,'ingredients');
  assert.equal(entries[0].path,`${base}/ingredients`);
  assert.ok(entries[0].estimatedBytes>0);
  assert.ok(entries[0].durationMs>=0);
  const summary=diagnostics.summary();
  assert.equal(summary.totalReads,1);
  assert.equal(summary.byOperation.ingredients.reads,1);
  diagnostics.reset();
  assert.equal(diagnostics.entries().length,0);
});

test('INV01 workspace normal load no longer calls full inventoryV2 root',()=>{
  const src=readFileSync(new URL('../src/ui/inventory-workspace-v32.js',import.meta.url),'utf8');
  assert.equal(src.includes('repository.readInventoryV2()'),false);
  assert.match(src,/repository\.readWorkspaceState\(\)/);
  assert.match(src,/repository\.readRecentMovements\(\{limit:120\}\)/);
  assert.match(src,/repository\.readMovements\(\)/);
  assert.match(src,/__SJ_INV01_READ_DIAGNOSTICS/);
});
