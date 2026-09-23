import test from 'node:test';
import assert from 'node:assert/strict';
import {
  activeCupCatalogV1,
  effectiveCupCatalogV1,
  operationalCupCatalogV1,
  setCupCatalogActiveV1,
  upsertCupCatalogSettingsV1
} from '../src/domain/cup-catalog-v1.js';
import { createCupCatalogWriter } from '../src/data/writers/cup-catalog-writer.js';

test('built-in Cup catalog remains the zero-config fallback',()=>{
  const rows=effectiveCupCatalogV1({});
  assert.deepEqual(rows.map(x=>x.code),['c10','c10p','c16','c22p','c22d','c22o']);
  assert.ok(rows.every(x=>x.active===true));
});

test('Owner can add a custom Cup and rename it without changing its code',()=>{
  let settings=upsertCupCatalogSettingsV1({},{
    code:'cup24',name:'Cup 24 Oz',active:true
  },{id:'owneruat'},()=>1000);
  assert.equal(activeCupCatalogV1(settings).find(x=>x.code==='cup24').name,'Cup 24 Oz');
  settings=upsertCupCatalogSettingsV1(settings,{
    originalCode:'cup24',code:'cup24',name:'Cup 24 Oz Datar',active:true
  },{id:'owneruat'},()=>2000);
  const row=effectiveCupCatalogV1(settings).find(x=>x.code==='cup24');
  assert.equal(row.name,'Cup 24 Oz Datar');
  assert.equal(settings.items.cup24.createdAt,1000);
  assert.equal(settings.items.cup24.updatedAt,2000);
  assert.throws(()=>upsertCupCatalogSettingsV1(settings,{
    originalCode:'cup24',code:'cup26',name:'Cup 26 Oz'
  }),e=>e.code==='CUP_CATALOG_CODE_IMMUTABLE');
});

test('names must stay unique and codes use a stable safe format',()=>{
  assert.throws(()=>upsertCupCatalogSettingsV1({},{
    code:'24 oz',name:'Cup Baru'
  }),e=>e.code==='CUP_CATALOG_CODE_INVALID');
  assert.throws(()=>upsertCupCatalogSettingsV1({},{
    code:'cupx',name:'Cup 10 Oz'
  }),e=>e.code==='CUP_CATALOG_NAME_DUPLICATE');
});

test('inactive Cup disappears from new choices but remains operational when mapped or carrying physical stock',()=>{
  let settings=upsertCupCatalogSettingsV1({},{
    code:'cup24',name:'Cup 24 Oz',active:true
  },{id:'owner'},()=>1);
  settings=setCupCatalogActiveV1(settings,'cup24',false,{id:'owner'},()=>2);
  assert.equal(activeCupCatalogV1(settings).some(x=>x.code==='cup24'),false);
  assert.equal(operationalCupCatalogV1(settings).some(x=>x.code==='cup24'),false);
  assert.equal(operationalCupCatalogV1(settings,{menu:[{id:'P1',cp:'cup24'}]}).some(x=>x.code==='cup24'),true);
  assert.equal(operationalCupCatalogV1(settings,{carryCounts:{cup24:3}}).some(x=>x.code==='cup24'),true);
});

function fakeDb(initial={}){
  let value=structuredClone(initial);
  return {
    get value(){return value},
    ref(path){
      assert.equal(path,'toko_segeranjiwa_v58/global/settings/cupCatalogV1');
      return {
        once:async()=>({val:()=>structuredClone(value)}),
        transaction:async(fn)=>{
          const next=fn(structuredClone(value));
          if(next===undefined)return {committed:false,snapshot:{val:()=>structuredClone(value)}};
          value=structuredClone(next);
          return {committed:true,snapshot:{val:()=>structuredClone(value)}};
        }
      };
    }
  };
}

test('dedicated writer is Owner-only, transactional, and never deletes historical catalog rows',async()=>{
  const db=fakeDb();
  const writer=createCupCatalogWriter({db,now:()=>1234});
  await assert.rejects(
    ()=>writer.saveItem({item:{code:'cup24',name:'Cup 24 Oz'},actor:{id:'k1',role:'kasir'}}),
    e=>e.code==='CUP_CATALOG_OWNER_REQUIRED'
  );
  await writer.saveItem({item:{code:'cup24',name:'Cup 24 Oz'},actor:{id:'o1',role:'owner'}});
  assert.equal(db.value.items.cup24.name,'Cup 24 Oz');
  await writer.setActive({code:'cup24',active:false,actor:{id:'o1',role:'manajemen'}});
  assert.equal(db.value.items.cup24.active,false);
  assert.equal(db.value.items.cup24.code,'cup24');
});
