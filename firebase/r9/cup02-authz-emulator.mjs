import fs from 'node:fs';
import process from 'node:process';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { ref, set, update, get } from 'firebase/database';

const currentPath=process.env.SJ_CUP02_CURRENT_RULES;
const candidatePath=process.env.SJ_CUP02_CANDIDATE_RULES;
const host=process.env.FIREBASE_DATABASE_EMULATOR_HOST||'127.0.0.1:9000';
const [hostname,portRaw]=host.split(':');
const port=Number(portRaw||9000);
if(!currentPath||!candidatePath)throw new Error('CUP02_EMULATOR_RULE_PATHS_REQUIRED');

const ROOT='toko_segeranjiwa_v58';
const UID='uid-karyawan';
const USERNAME='karyawan';
const ING='ING_MTS1LG3R';
const RES='IR-EMU-001';
const resPath=`${ROOT}/global/inventoryV2/reservations/${RES}`;
const balPath=`${ROOT}/global/inventoryV2/balances/ingredients/${ING}`;
const authPath=`${ROOT}/global/authUsers/${UID}`;

function preparing(){
  return {
    id:RES,status:'PREPARING',shift:'2026-09-15-S1',cashierId:USERNAME,cashierName:'Karyawan',
    consumption:{[ING]:1},estimatedConsumption:{[ING]:1},shortageConsumption:{[ING]:0},
    estimateMode:true,createdAt:'2026-09-15T06:00:00.000Z',ts:1789449600000
  };
}
function reservedPatch(){
  return {status:'RESERVED',reservedAt:'2026-09-15T06:00:01.000Z',reservedTs:1789449601000,reservedItems:[{ingredientId:ING,qty:1,requestedQty:1,shortageQty:0}]};
}
async function envFor(projectId,rules){
  return initializeTestEnvironment({projectId,database:{host:hostname,port,rules}});
}
async function seed(env,row=preparing(),status='PREPARING'){
  await env.withSecurityRulesDisabled(async ctx=>{
    const db=ctx.database();
    await set(ref(db,authPath),{username:USERNAME,role:'transaksi',active:true});
    await set(ref(db,`${ROOT}/global/authUsers/uid-other`),{username:'other',role:'transaksi',active:true});
    await set(ref(db,`${ROOT}/global/authUsers/uid-viewer`),{username:'viewer',role:'viewer',active:true});
    await set(ref(db,balPath),{outlet:12,warehouse:299,lastOp:{id:'OLD',action:'RESERVE',cashierId:USERNAME,ts:1}});
    await set(ref(db,resPath),{...row,status});
  });
}

async function currentRed(){
  const rules=fs.readFileSync(currentPath,'utf8');
  const env=await envFor('demo-cup02-current',rules);
  try{
    await seed(env);
    const db=env.authenticatedContext(UID).database();
    await assertFails(update(ref(db,resPath),reservedPatch()));
    console.log('EMULATOR RED: CONFIRMED current deployed rule denies PREPARING->RESERVED writer-style update');
  }finally{await env.cleanup()}
}

async function candidateGreen(){
  const rules=fs.readFileSync(candidatePath,'utf8');
  const env=await envFor('demo-cup02-candidate',rules);
  try{
    // Existing writer-style parent update must work unchanged.
    await seed(env);
    let db=env.authenticatedContext(UID).database();
    await assertSucceeds(update(ref(db,resPath),reservedPatch()));
    const status=await get(ref(db,`${resPath}/status`));
    if(status.val()!=='RESERVED')throw new Error('CUP02_RESERVED_STATUS_NOT_PERSISTED');

    // Immutable evidence must remain protected.
    await assertFails(update(ref(db,resPath),{consumption:{[ING]:2}}));
    await assertFails(update(ref(db,resPath),{shift:'2026-09-15-S2'}));
    await assertFails(update(ref(env.authenticatedContext('uid-other').database(),resPath),reservedPatch()));
    await assertFails(update(ref(env.authenticatedContext('uid-viewer').database(),resPath),{status:'COMMITTED',txId:'X',committedAt:'x',committedTs:1}));

    // Legitimate creation still works.
    const res2=`${ROOT}/global/inventoryV2/reservations/IR-EMU-002`;
    const create={...preparing(),id:'IR-EMU-002'};
    await assertSucceeds(set(ref(db,res2),create));

    // Rollback lifecycle.
    await env.withSecurityRulesDisabled(async ctx=>set(ref(ctx.database(),resPath),preparing()));
    await assertSucceeds(update(ref(db,resPath),{status:'ROLLED_BACK',rollbackReason:'SALE_NOT_COMMITTED',rolledBackAt:'2026-09-15T06:00:02.000Z',rolledBackTs:1789449602000}));

    // Commit lifecycle from RESERVED.
    await env.withSecurityRulesDisabled(async ctx=>set(ref(ctx.database(),resPath),{...preparing(),...reservedPatch()}));
    await assertSucceeds(update(ref(db,resPath),{status:'COMMITTED',txId:'SJ-EMU-1',committedAt:'2026-09-15T06:00:03.000Z',committedTs:1789449603000}));

    // Commit uncertain lifecycle.
    await env.withSecurityRulesDisabled(async ctx=>set(ref(ctx.database(),resPath),{...preparing(),...reservedPatch()}));
    await assertSucceeds(update(ref(db,resPath),{status:'COMMIT_UNCERTAIN',txId:'SJ-EMU-2',commitError:'NETWORK',commitErrorAt:'2026-09-15T06:00:04.000Z'}));

    console.log('EMULATOR GREEN: PASS existing writer-style lifecycle update + immutable evidence guards');
  }finally{await env.cleanup()}
}

await currentRed();
await candidateGreen();
