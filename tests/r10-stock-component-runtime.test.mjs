import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {installLegacyStockComponentsRuntime,stockSaleFingerprint,matchCompletedStockSale} from '../src/compat/legacy-stock-components-runtime.js';

function memoryStorage(){let value=null;return{read:()=>structuredClone(value),write:v=>(value=structuredClone(v)),dump:()=>structuredClone(value)}}
function fixture({cart=[{id:'P1',q:1,p:5000}],actor={id:'cashier-1',name:'Kasir',role:'transaksi'},mapping={},stockItems={},baseResult='TX1',transactions={}}={}){
  let baseCalls=0,intervalCalls=0;const storage=memoryStorage(),applied=[];let txs=structuredClone(transactions);
  const runtime={localStorage:storage,console:{warn(){}},setTimeout(){return 0},setInterval(){intervalCalls++;return 1},showToast(){},async processTransaction(){baseCalls++;return typeof baseResult==='function'?baseResult({txs,setTxs:v=>txs=structuredClone(v)}):baseResult}};
  const repository={async readProductStockComponents(id){return structuredClone(mapping[id]||{})},async readStockItem(id){return structuredClone(stockItems[id]||{name:id,unit:'pcs'})}};
  const writer={async applyCompletedSale(input){applied.push(structuredClone(input));return{status:'COMPLETED',result:'APPLIED'}}};
  const legacyContext={snapshotSale:()=>({shiftKey:'2026-09-19-S1',cart:structuredClone(cart),actor:structuredClone(actor),preTxKeys:['OLD'],capturedAt:1000})};
  const transactionReader={async readById(_shift,id){return structuredClone(txs[id]||null)},async readRecent(){return structuredClone(txs)}};
  return{runtime,repository,writer,legacyContext,transactionReader,storage,applied,setTxs:v=>txs=structuredClone(v),baseCalls:()=>baseCalls,intervalCalls:()=>intervalCalls};
}
function install(f){return installLegacyStockComponentsRuntime(f.runtime,{inventoryRepository:f.repository,stockComponentWriter:f.writer,legacyContext:f.legacyContext,transactionReader:f.transactionReader,storage:f.storage,now:()=>1500,autoRecover:false})}

test('fingerprint normalizes normal and recipe product identity',()=>{assert.equal(stockSaleFingerprint([{id:'P1',q:2,p:0}]),JSON.stringify([['P:P1',2,0]]));assert.equal(stockSaleFingerprint([{id:'V1',baseProductId:'P2',recipeVariantId:'R1',inventoryMode:'RECIPE',q:1,p:7000}]),JSON.stringify([['R:P2:R1',1,7000]]))});

test('matcher requires new key + COMPLETED + fingerprint + bounded timestamp',()=>{const fp=stockSaleFingerprint([{id:'P1',q:1,p:5000}]);const hit=matchCompletedStockSale({beforeKeys:['OLD'],fingerprint:fp,startedAt:1000,endedAt:1500,after:{OLD:{status:'COMPLETED',ts:1100,cartData:[{id:'P1',q:1,p:5000}]},NEW:{status:'COMPLETED',ts:1200,cartData:[{id:'P1',q:1,p:5000}]}}});assert.equal(hit.txId,'NEW')});

test('no mapping delegates to base exactly once and adds no polling',async()=>{const f=fixture({baseResult:true});const api=install(f);assert.equal(api.installed,true);assert.equal(await f.runtime.processTransaction(),true);assert.equal(f.baseCalls(),1);assert.equal(f.applied.length,0);assert.equal(f.intervalCalls(),0)});

test('genuine Recipe with no Product Stock Components remains on base Recipe lifecycle only',async()=>{const cart=[{id:'V1',baseProductId:'P1',recipeVariantId:'R1',inventoryMode:'RECIPE',q:1,p:8000}],f=fixture({cart,baseResult:'TXR'});install(f);assert.equal(await f.runtime.processTransaction(),'TXR');assert.equal(f.baseCalls(),1);assert.equal(f.applied.length,0)});

test('mapped sale validates exact returned tx id and applies once',async()=>{const cart=[{id:'P1',q:2,p:5000}],tx={status:'COMPLETED',ts:1200,cartData:cart};const f=fixture({cart,mapping:{P1:{CUP:{stockItemId:'CUP',qtyPerUnit:1,active:true}}},transactions:{TX1:tx},baseResult:'TX1'});install(f);assert.equal(await f.runtime.processTransaction(),'TX1');assert.equal(f.applied.length,1);assert.equal(f.applied[0].txId,'TX1');assert.equal(f.baseCalls(),1)});

test('Rp0 sale still applies physical component',async()=>{const cart=[{id:'P1',q:1,p:0}],f=fixture({cart,mapping:{P1:{CUP:{stockItemId:'CUP',qtyPerUnit:1,active:true}}},transactions:{TX0:{status:'COMPLETED',ts:1200,total:0,cartData:cart}},baseResult:'TX0'});install(f);await f.runtime.processTransaction();assert.equal(f.applied.length,1)});

test('Owner and Cashier actors are both passed to dedicated writer',async()=>{for(const role of ['manajemen','transaksi']){const cart=[{id:'P1',q:1,p:1}],f=fixture({cart,actor:{id:role,name:role,role},mapping:{P1:{C:{stockItemId:'C',qtyPerUnit:1,active:true}}},transactions:{TX1:{status:'COMPLETED',ts:1200,cartData:cart}}});install(f);await f.runtime.processTransaction();assert.equal(f.applied[0].actor.role,role)}});

test('returned tx id disambiguates concurrent identical sales',async()=>{const cart=[{id:'P1',q:1,p:5000}],rows={A:{status:'COMPLETED',ts:1200,cartData:cart},B:{status:'COMPLETED',ts:1201,cartData:cart}};const f=fixture({cart,mapping:{P1:{C:{stockItemId:'C',qtyPerUnit:1,active:true}}},transactions:rows,baseResult:'B'});install(f);await f.runtime.processTransaction();assert.equal(f.applied.length,1);assert.equal(f.applied[0].txId,'B')});

test('ambiguous fallback fails closed and persists recoverable evidence',async()=>{const cart=[{id:'P1',q:1,p:5000}],rows={A:{status:'COMPLETED',ts:1200,cartData:cart},B:{status:'COMPLETED',ts:1201,cartData:cart}};const f=fixture({cart,mapping:{P1:{C:{stockItemId:'C',qtyPerUnit:1,active:true}}},transactions:rows,baseResult:true});install(f);await f.runtime.processTransaction();assert.equal(f.applied.length,0);assert.match(JSON.stringify(f.storage.dump()),/SALE_MATCH/)});

test('genuine Recipe + distinct component coexist; overlap fails closed',async()=>{const cart=[{id:'V1',baseProductId:'P1',recipeVariantId:'R1',inventoryMode:'RECIPE',q:1,p:8000}],mapping={P1:{CUP:{stockItemId:'CUP',qtyPerUnit:1,active:true}}};const ok=fixture({cart,mapping,transactions:{TX1:{status:'COMPLETED',ts:1200,cartData:cart,inventoryRecipeAppliedConsumption:{SUGAR:10}}}});install(ok);await ok.runtime.processTransaction();assert.equal(ok.applied.length,1);const bad=fixture({cart,mapping,transactions:{TX1:{status:'COMPLETED',ts:1200,cartData:cart,inventoryRecipeAppliedConsumption:{CUP:1}}}});install(bad);await bad.runtime.processTransaction();assert.equal(bad.applied.length,0);assert.match(JSON.stringify(bad.storage.dump()),/SALE_MATCH/)});

test('reinstall is idempotent and stop restores prior processTransaction',()=>{const f=fixture(),original=f.runtime.processTransaction,first=install(f),wrapped=f.runtime.processTransaction,second=install(f);assert.equal(first,second);assert.equal(f.runtime.processTransaction,wrapped);first.stop();assert.equal(f.runtime.processTransaction,original)});

test('build/bootstrap contract keeps frozen tail while installing classic context before module runtime',()=>{const build=readFileSync('scripts/build-ref01.mjs','utf8'),bootstrap=readFileSync('src/app/ref01-bootstrap.js','utf8');assert.match(build,/STOCK_COMPONENT_CONTEXT_ENTRY/);const candidate=build.slice(build.indexOf('const candidate='));assert.ok(candidate.indexOf('${STOCK_COMPONENT_CONTEXT_ENTRY}')<candidate.indexOf('${CLASSIC_ENTRY}'));assert.match(candidate,/\$\{S10A_CLASSIC_ENTRY\}\\n\$\{QRIS_MANUAL_ENTRY\}\\n\$\{ENTRY\}/);assert.match(bootstrap,/installLegacyStockComponentsRuntime/);assert.match(bootstrap,/legacyStockComponentsRuntime/)});

test('new runtime/context add no permanent listener or polling loop',()=>{const runtime=readFileSync('src/compat/legacy-stock-components-runtime.js','utf8'),context=readFileSync('src/compat/legacy-stock-components-context.js','utf8');assert.doesNotMatch(runtime,/setInterval\s*\(/);assert.doesNotMatch(context,/setInterval\s*\(/);assert.doesNotMatch(runtime,/\.on\s*\(\s*['\"](?:value|child_)/);assert.doesNotMatch(context,/\.on\s*\(\s*['\"](?:value|child_)/)});
