import test from 'node:test';
import assert from 'node:assert/strict';
import { installCupProductCostingV34 } from '../src/ui/cup-product-costing-v34.js';

function inventory(){
  const codes=[['c10','ING10','CUP 10 OZ'],['c10p','ING10P','CUP PAPER 10 OZ'],['c16','ING16','CUP 16 OZ'],['c22p','ING22P','CUP 22 OZ DATAR POLOS'],['c22d','ING22D','CUP 22 OZ DATAR'],['c22o','ING22O','CUP 22 OZ OVAL']];
  const ingredients={},balances={ingredients:{}};
  for(const [code,id,name] of codes){ingredients[id]={id,name,unit:'pcs'};balances.ingredients[id]={outlet:100,warehouse:0}}
  return {ingredients,balances};
}

test('CUP-01 waits for Firebase auth once, then resolves all mapped cup codes without opening Inventory',async()=>{
  let authCb=null,unsubscribed=false,reads=0;
  const auth={currentUser:null,onAuthStateChanged(cb){authCb=cb;queueMicrotask(()=>cb(null));return()=>{unsubscribed=true}}};
  const repository={async readInventoryV2(){reads++;if(!auth.currentUser){const e=new Error('permission_denied');e.code='PERMISSION_DENIED';throw e}return inventory()}};
  const runtime={firebase:{auth:()=>auth},SJInventoryV2:{recipeForProduct(){return{components:{}}}},Function};
  const api=installCupProductCostingV34(runtime,{inventoryWorkspace:{cupRows:()=>[]},repository,autoEnhance:false});
  await new Promise(r=>setTimeout(r,0));
  assert.equal(reads,0,'Inventory V2 must not be read before auth is restored');
  auth.currentUser={uid:'owner'};authCb(auth.currentUser);await api.ready;
  assert.equal(reads,1);assert.equal(unsubscribed,true,'auth listener must be one-shot');
  const cart=[['c10',1],['c10p',2],['c16',3],['c22p',4],['c22d',5],['c22o',6]].map(([cp,q],i)=>({id:'P'+i,cp,q}));
  assert.deepEqual({...runtime.__SJ_V34_CUP_SALE_USAGE(cart)},{ING10:1,ING10P:2,ING16:3,ING22P:4,ING22D:5,ING22O:6});
});

test('CUP-01 mapped product chips are observable in Product Master without changing data authority',()=>{
  const src=requireText('../src/compat/legacy-cup-01b-product-cup-ui.js');
  assert.match(src,/decorateMasterCupMappings/);
  assert.match(src,/data-sj-cup-mapping-chip/);
  assert.match(src,/Cup:\s*/);
  assert.doesNotMatch(src,/setInterval\s*\(/);
});
function requireText(rel){return (awaitImportFs()).readFileSync(new URL(rel,import.meta.url),'utf8')}
function awaitImportFs(){return globalThis.__cupFs||(globalThis.__cupFs=process.getBuiltinModule('fs'))}
