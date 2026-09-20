import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

function arg(name){const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:''}
const rules=arg('--rules')||process.env.SJ_R10_RULES_CANDIDATE||'';
if(!rules||!fs.existsSync(rules)){console.error('R10_EMULATOR_RULES_REQUIRED');process.exit(2)}
if(spawnSync('java',['-version'],{stdio:'ignore'}).status!==0){console.error('R10_EMULATOR_JAVA_REQUIRED');process.exit(3)}

const home=path.join(os.homedir(),'.cache','segeran-jiwa','r10-checkpoints','B','emulator-node');
fs.mkdirSync(home,{recursive:true});
const pkg=path.join(home,'package.json');
if(!fs.existsSync(pkg))fs.writeFileSync(pkg,JSON.stringify({type:'module',private:true},null,2));
if(!fs.existsSync(path.join(home,'node_modules','@firebase','rules-unit-testing'))){
  const install=spawnSync('npm',['install','--silent','--no-audit','--no-fund','--legacy-peer-deps','@firebase/rules-unit-testing@latest','firebase@latest'],{cwd:home,stdio:'inherit'});
  if(install.status!==0)process.exit(install.status||4);
}
fs.copyFileSync(rules,path.join(home,'database.rules.json'));
fs.writeFileSync(path.join(home,'firebase.json'),JSON.stringify({database:{rules:'database.rules.json'}},null,2));

const runner=String.raw`
import fs from 'node:fs';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {ref,set,get,update,runTransaction} from 'firebase/database';

const rulesText=fs.readFileSync('database.rules.json','utf8');
const env=await initializeTestEnvironment({projectId:'demo-r10-stock-components',database:{rules:rulesText}});
await env.clearDatabase();
const ROOT='toko_segeranjiwa_v58';
const inv=p=>ROOT+'/global/inventoryV2/'+p;
const owner=env.authenticatedContext('uid-owner').database();
const cashier=env.authenticatedContext('uid-cashier').database();
const anon=env.unauthenticatedContext().database();

async function tx(db,p,fn){
  const snap=await get(ref(db,p));
  const fallback=structuredClone(snap.val());
  return runTransaction(ref(db,p),current=>fn(current===null?structuredClone(fallback):current));
}

async function step(name,fn){
  try{await fn();console.log('STEP '+name+' : PASS')}
  catch(e){
    console.error('FAILED_STEP='+name);
    console.error(e?.stack||e);
    try{await env.cleanup()}catch{}
    process.exit(91);
  }
}

await env.withSecurityRulesDisabled(async ctx=>{
  const db=ctx.database();
  await set(ref(db,ROOT+'/global/authUsers'),{
    'uid-owner':{username:'owner',role:'manajemen',active:true},
    'uid-cashier':{username:'cashier',role:'transaksi',active:true}
  });
  await set(ref(db,ROOT+'/S1/tx/T1'),{status:'COMPLETED'});
  await set(ref(db,ROOT+'/S1/tx/T2'),{status:'COMPLETED'});
  await set(ref(db,inv('balances/ingredients/ING1')),{outlet:10,warehouse:20});
});

await step('RULES_BOUND_TO_TEST_NAMESPACE',()=>assertFails(set(ref(cashier,ROOT+'/global/settings/R10_TASK9_SENTINEL'),{value:true})));

await step('OWNER_MAPPING',()=>assertSucceeds(set(ref(owner,inv('productStockComponents/P1')),{ING1:{stockItemId:'ING1',qtyPerUnit:1,active:true}})));
await step('CASHIER_MAPPING_DENY',()=>assertFails(set(ref(cashier,inv('productStockComponents/P1')),{ING1:{stockItemId:'ING1',qtyPerUnit:2,active:true}})));
await step('UNAUTHENTICATED_DENY',()=>assertFails(set(ref(anon,inv('productStockComponents/P2')),{ING1:{stockItemId:'ING1',qtyPerUnit:1,active:true}})));
await step('MALFORMED_DENY',()=>assertFails(set(ref(owner,inv('productStockComponents/P2')),{ING1:{stockItemId:'ING1',qtyPerUnit:-1,active:true}})));

const APP='APP1';
const app={id:APP,kind:'SALE',status:'CLAIMED',shiftKey:'S1',txId:'T1',
  snapshot:{id:APP,shiftKey:'S1',txId:'T1',actorId:'cashier',actorName:'Cashier',lineFingerprint:'sc1:test',lines:[{lineIndex:0,productId:'P1',soldQty:2}],components:[{stockItemId:'ING1',stockItemName:'Cup',unit:'pcs',qtyPerUnit:1,soldQty:2,appliedQty:2,allocations:[{lineIndex:0,productId:'P1',soldQty:2,qtyPerUnit:1,appliedQty:2}]}]},
  snapshotSeal:'sc1:emulator-seal',createdAt:1000,createdBy:'cashier'};
await step('APPLICATION_CLAIM',()=>assertSucceeds(set(ref(cashier,inv('stockApplications/'+APP)),app)));
await step('SNAPSHOT_SEAL_MUTATION_DENY',()=>assertFails(update(ref(cashier,inv('stockApplications/'+APP)),{snapshotSeal:'sc1:tampered'})));

await step('SALE_BALANCE_APPLY',()=>assertSucceeds(tx(cashier,inv('balances/ingredients/ING1'),current=>{
  const next=structuredClone(current);next.outlet=8;next.stockComponentOps={...(next.stockComponentOps||{}),OP1:{state:'APPLIED',applicationId:APP,qty:2,at:1001}};next.lastOp='OP1';return next;
})));
let bal=(await get(ref(cashier,inv('balances/ingredients/ING1')))).val();
if(bal.outlet!==8)throw new Error('SALE_DECREMENT_NOT_EXACT');

await step('DUPLICATE_NOOP_RETRY',async()=>{
  const result=await tx(cashier,inv('balances/ingredients/ING1'),current=>{
    if(current?.stockComponentOps?.OP1?.state==='APPLIED')return;
    throw new Error('DUPLICATE_MARKER_MISSING');
  });
  if(result.committed)throw new Error('DUPLICATE_RETRY_WROTE_AGAIN');
});
bal=(await get(ref(cashier,inv('balances/ingredients/ING1')))).val();
if(bal.outlet!==8)throw new Error('DUPLICATE_DECREMENT');

await step('SALE_MOVEMENT',()=>assertSucceeds(set(ref(cashier,inv('movements/M1')),{id:'M1',itemType:'ingredient',itemId:'ING1',itemName:'Cup',type:'SALE_COMPONENT',location:'outlet',delta:-2,applicationId:APP,refId:'T1',shift:'S1',user:'Cashier',userId:'cashier',ts:1002,at:'1970-01-01T00:00:01.002Z'})));
await step('CASHIER_WAREHOUSE_DENY',()=>assertFails(update(ref(cashier,inv('balances/ingredients/ING1')),{warehouse:21})));
await step('ARBITRARY_OUTLET_DENY',()=>assertFails(update(ref(cashier,inv('balances/ingredients/ING1')),{outlet:7})));

const APP2='APP2';
await step('SHORTAGE_APPLICATION_CLAIM',()=>assertSucceeds(set(ref(cashier,inv('stockApplications/'+APP2)),{...app,id:APP2,txId:'T2',snapshot:{...app.snapshot,id:APP2,txId:'T2'},createdAt:2000})));
await step('SHORTAGE_MARKER_WITH_LASTOP',()=>assertSucceeds(tx(cashier,inv('balances/ingredients/ING1'),current=>{
  const next=structuredClone(current);next.stockComponentOps={...(next.stockComponentOps||{}),OP2:{state:'SHORTAGE',applicationId:APP2,qty:99,at:2001}};next.lastOp='OP2';return next;
})));
bal=(await get(ref(cashier,inv('balances/ingredients/ING1')))).val();
if(bal.outlet<0)throw new Error('SHORTAGE_NEGATIVE');
await step('ARBITRARY_METADATA_DENY',()=>assertFails(update(ref(cashier,inv('balances/ingredients/ING1')),{arbitrary:'DENY'})));

await step('APPLICATION_STATUS_COMPLETED',()=>assertSucceeds(update(ref(cashier,inv('stockApplications/'+APP)),{status:'COMPLETED',completedAt:3000})));
await step('REFUND_CLAIM',()=>assertSucceeds(tx(cashier,inv('stockApplications/'+APP),current=>{
  const next=structuredClone(current);next.restores={...(next.restores||{}),RF1:{id:'RF1',kind:'REFUND',status:'CLAIMED',correctionId:'RF1',components:[{stockItemId:'ING1',restoredQty:1}],lineRestores:{0:1},createdAt:3001,createdBy:'cashier'}};next.restoredLines={0:1};return next;
})));
await step('REFUND_BALANCE_RESTORE',()=>assertSucceeds(tx(cashier,inv('balances/ingredients/ING1'),current=>{
  const next=structuredClone(current);next.outlet=9;next.stockComponentOps={...(next.stockComponentOps||{}),RFOP:{state:'APPLIED',applicationId:APP,restoreId:'RF1',kind:'REFUND',qty:1,at:3002}};next.lastOp='RFOP';return next;
})));
await step('REFUND_MOVEMENT',()=>assertSucceeds(set(ref(cashier,inv('movements/MRF')),{id:'MRF',itemType:'ingredient',itemId:'ING1',itemName:'Cup',type:'REFUND_COMPONENT',location:'outlet',delta:1,applicationId:APP,restoreId:'RF1',originalTxId:'T1',refId:'RF1',shift:'S1',user:'Cashier',userId:'cashier',ts:3003,at:'1970-01-01T00:00:03.003Z'})));
await step('REFUND_NOOP_RETRY',async()=>{
  const result=await tx(cashier,inv('balances/ingredients/ING1'),current=>{
    if(current?.stockComponentOps?.RFOP?.state==='APPLIED')return;
    throw new Error('REFUND_RETRY_MARKER_MISSING');
  });
  if(result.committed)throw new Error('REFUND_RETRY_WROTE_AGAIN');
});
bal=(await get(ref(cashier,inv('balances/ingredients/ING1')))).val();
if(bal.outlet!==9)throw new Error('REFUND_RETRY_DOUBLE_RESTORE');

await env.withSecurityRulesDisabled(async ctx=>{
  await set(ref(ctx.database(),inv('stockApplications/APPV')),{...app,id:'APPV',status:'COMPLETED',snapshot:{...app.snapshot,id:'APPV'},createdAt:4000});
});
await step('VOID_BALANCE_RESTORE',()=>assertSucceeds(tx(cashier,inv('balances/ingredients/ING1'),current=>{
  const next=structuredClone(current);next.outlet=10;next.stockComponentOps={...(next.stockComponentOps||{}),VOP:{state:'APPLIED',applicationId:'APPV',restoreId:'V1',kind:'VOID',qty:1,at:4001}};next.lastOp='VOP';return next;
})));
await step('VOID_MOVEMENT',()=>assertSucceeds(set(ref(cashier,inv('movements/MV')),{id:'MV',itemType:'ingredient',itemId:'ING1',itemName:'Cup',type:'VOID_COMPONENT',location:'outlet',delta:1,applicationId:'APPV',restoreId:'V1',originalTxId:'T1',refId:'V1',shift:'S1',user:'Cashier',userId:'cashier',ts:4002,at:'1970-01-01T00:00:04.002Z'})));

console.log('TASK9_EMULATOR_GATE : PASS');
await env.cleanup();
`;
fs.writeFileSync(path.join(home,'runner.mjs'),runner);
const run=spawnSync('npx',['--yes','firebase-tools@latest','emulators:exec','--only','database','--project','demo-r10-stock-components','--config','firebase.json','node runner.mjs'],{cwd:home,stdio:'inherit',env:{...process.env}});
process.exit(run.status??1);
