import test from 'node:test';
import assert from 'node:assert/strict';
import { installCupCatalogRuntimeV1 } from '../src/app/cup-catalog-runtime-v1.js';

function fakeDb(initial={}){
  let value=structuredClone(initial);
  return {
    ref(path){
      assert.equal(path,'toko_segeranjiwa_v58/global/settings/cupCatalogV1');
      return {
        once:async()=>({val:()=>structuredClone(value)}),
        transaction:async fn=>{
          const next=fn(structuredClone(value));
          if(next===undefined)return {committed:false,snapshot:{val:()=>structuredClone(value)}};
          value=structuredClone(next);
          return {committed:true,snapshot:{val:()=>structuredClone(value)}};
        }
      };
    }
  };
}

test('runtime catalog falls back to built-ins then updates immediately after Owner save',async()=>{
  const runtime={
    firebase:{database:()=>fakeDb(),auth:()=>({currentUser:{uid:'u1'}})},
    cloudData:{global:{settings:{},menu:[]}}
  };
  const api=installCupCatalogRuntimeV1(runtime,{readRole:()=> 'owner',readActorId:()=> 'owner1'});
  await api.ready;
  assert.equal(api.activeCatalog().length,6);
  await api.saveItem({code:'cup24',name:'Cup 24 Oz'});
  assert.equal(api.activeCatalog().some(x=>x.code==='cup24'),true);
  assert.equal(runtime.cloudData.global.settings.cupCatalogV1.items.cup24.name,'Cup 24 Oz');
});

test('runtime refuses to deactivate a Cup still mapped by an active product',async()=>{
  const db=fakeDb({items:{cup24:{code:'cup24',name:'Cup 24 Oz',active:true}}});
  const runtime={
    firebase:{database:()=>db,auth:()=>({currentUser:{uid:'u1'}})},
    cloudData:{global:{settings:{},menu:[{id:'P1',cp:'cup24'}]}}
  };
  const api=installCupCatalogRuntimeV1(runtime,{readRole:()=> 'manajemen'});
  await api.ready;
  await assert.rejects(()=>api.setActive('cup24',false),e=>e.code==='CUP_CATALOG_STILL_MAPPED');
  assert.equal(api.activeCatalog().some(x=>x.code==='cup24'),true);
});

test('operational catalog retains inactive Cup while physical carry remains',async()=>{
  const db=fakeDb({items:{cup24:{code:'cup24',name:'Cup 24 Oz',active:false}}});
  const runtime={firebase:{database:()=>db},cloudData:{global:{settings:{},menu:[]}}};
  const api=installCupCatalogRuntimeV1(runtime,{readRole:()=> 'owner'});
  await api.ready;
  assert.equal(api.activeCatalog().some(x=>x.code==='cup24'),false);
  assert.equal(api.operationalCatalog({carryCounts:{cup24:2}}).some(x=>x.code==='cup24'),true);
});
