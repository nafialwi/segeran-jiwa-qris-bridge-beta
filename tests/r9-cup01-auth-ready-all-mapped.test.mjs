import test from 'node:test';
import assert from 'node:assert/strict';
import { installCupProductCostingV34 } from '../src/ui/cup-product-costing-v34.js';

function masters(){return {
  ING10:{id:'ING10',name:'CUP 10 OZ',unit:'pcs'},ING10P:{id:'ING10P',name:'CUP PAPER 10 OZ',unit:'pcs'},
  ING16:{id:'ING16',name:'CUP 16 OZ',unit:'pcs'},ING22P:{id:'ING22P',name:'CUP 22 OZ DATAR POLOS',unit:'pcs'},
  ING22D:{id:'ING22D',name:'CUP 22 OZ DATAR',unit:'pcs'},ING22O:{id:'ING22O',name:'CUP 22 OZ OVAL',unit:'pcs'}
}}

test('CUP-01 waits for auth once, then reads only Cup master/cost references and returns Cup Control codes',async()=>{
  let authCb=null,unsubscribed=false,masterReads=0,costReads=0,fullReads=0;
  const auth={currentUser:null,onAuthStateChanged(cb){authCb=cb;queueMicrotask(()=>cb(null));return()=>{unsubscribed=true}}};
  const repository={
    async readIngredientMasters(){masterReads++;if(!auth.currentUser){const e=new Error('permission_denied');e.code='PERMISSION_DENIED';throw e}return masters()},
    async readIngredientCosts(){costReads++;return {ING10:{wac:350,source:'PURCHASE'},ING10P:{wac:400,source:'PURCHASE'},ING16:{wac:450,source:'PURCHASE'},ING22P:{wac:500,source:'PURCHASE'},ING22D:{wac:550,source:'PURCHASE'},ING22O:{wac:600,source:'PURCHASE'}}},
    async readInventoryV2(){fullReads++;throw new Error('must not read full inventory')}
  };
  const runtime={firebase:{auth:()=>auth},Function};
  const api=installCupProductCostingV34(runtime,{repository,autoEnhance:false});
  await new Promise(r=>setTimeout(r,0));
  assert.equal(masterReads,0);assert.equal(costReads,0);assert.equal(fullReads,0);
  auth.currentUser={uid:'owner'};authCb(auth.currentUser);await api.ready;
  assert.equal(masterReads,1);assert.equal(costReads,1);assert.equal(fullReads,0);assert.equal(unsubscribed,true);
  const cart=[['c10',1],['c10p',2],['c16',3],['c22p',4],['c22d',5],['c22o',6]].map(([cp,q],i)=>({id:'P'+i,cp,q}));
  assert.deepEqual({...runtime.__SJ_V34_CUP_SALE_USAGE(cart)},{c10:1,c10p:2,c16:3,c22p:4,c22d:5,c22o:6});
  assert.deepEqual(api.costForCode('c22d'),{code:'c22d',name:'Cup 22 Oz Datar',known:true,unitCost:550,source:'PURCHASE',inventoryTracked:false});
});

test('CUP-01 mapped product chips remain observable without introducing polling',()=>{
  const src=requireText('../src/compat/legacy-cup-01b-product-cup-ui.js');
  assert.match(src,/decorateMasterCupMappings/);assert.match(src,/data-sj-cup-mapping-chip/);assert.match(src,/Cup:\s*/);assert.doesNotMatch(src,/setInterval\s*\(/);
});
function requireText(rel){return (awaitImportFs()).readFileSync(new URL(rel,import.meta.url),'utf8')}
function awaitImportFs(){return globalThis.__cupFs||(globalThis.__cupFs=process.getBuiltinModule('fs'))}
