#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import {
  LEGACY_CUP_CODES,
  buildLegacyCupMigration,
  validateMigrationPlan
} from '../src/domain/stock-component-migration.js';

const PROJECT_DEFAULT='segeranjiwa-id';
const BASE_DEFAULT='/toko_segeranjiwa_v58';
const LIVE_CUP_INGREDIENT_IDS=Object.freeze({
  c10:'ING_MTS1LFGW',
  c10p:'ING_MTS1LFMK',
  c16:'ING_MTS1LFSE',
  c22p:'ING_MTS1LFY2',
  c22d:'ING_MTS1LG3R',
  c22o:'ING_MTS1LG94'
});

function fail(code,detail=''){
  const error=new Error(detail?`${code}:${detail}`:code);
  error.code=code;
  throw error;
}

function argsOf(argv){
  const out={mode:'dry-run',input:'',project:PROJECT_DEFAULT,base:BASE_DEFAULT,expectedSourceHash:''};
  for(let i=0;i<argv.length;i++){
    const arg=argv[i];
    if(arg==='--dry-run')out.mode='dry-run';
    else if(arg==='--apply')out.mode='apply';
    else if(arg==='--input')out.input=String(argv[++i]||'');
    else if(arg==='--project')out.project=String(argv[++i]||'');
    else if(arg==='--base')out.base=String(argv[++i]||'');
    else if(arg==='--expected-source-hash')out.expectedSourceHash=String(argv[++i]||'');
    else if(arg==='--help'){
      console.log(`Usage:
  node scripts/r10-stock-components-migration.mjs --dry-run [--input fixture.json]
  node scripts/r10-stock-components-migration.mjs --apply --expected-source-hash <HASH>

Live apply is hash-guarded and writes only:
  <base>/global/inventoryV2/productStockComponents/<productId>`);
      process.exit(0);
    }else fail('ARG_UNKNOWN',arg);
  }
  if(out.mode==='apply'&&!/^[0-9a-f]{64}$/.test(out.expectedSourceHash)){
    fail('EXPECTED_SOURCE_HASH_REQUIRED');
  }
  if(out.mode==='apply'&&out.input)fail('APPLY_REQUIRES_LIVE_SOURCE');
  return out;
}

function firebase(args,project){
  const result=spawnSync(
    'npx',
    ['--yes','firebase-tools@latest',...args,'--project',project],
    {encoding:'utf8',maxBuffer:16*1024*1024}
  );
  if(result.status!==0){
    fail('FIREBASE_TOOL_FAILED',(result.stderr||result.stdout||args.join(' ')).trim());
  }
  return result.stdout;
}

function getJson(path,project){
  const raw=firebase(['database:get',path],project);
  try{return JSON.parse(raw||'null')}
  catch(error){fail('LIVE_JSON_INVALID',`${path}:${error.message}`)}
}

function canonical(value){
  if(Array.isArray(value))return value.map(canonical);
  if(value&&typeof value==='object'){
    return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])]));
  }
  return value;
}

function equal(a,b){
  return JSON.stringify(canonical(a??null))===JSON.stringify(canonical(b??null));
}

function loadFixture(path){
  if(!path)fail('INPUT_PATH_REQUIRED');
  const input=JSON.parse(readFileSync(path,'utf8'));
  return {
    products:input.products||{},
    cupRows:input.cupRows||[],
    existingMappings:input.existingMappings||{}
  };
}

function loadLive({project,base}){
  const products=getJson(`${base}/global/menu`,project)||{};
  const existingMappings=getJson(
    `${base}/global/inventoryV2/productStockComponents`,
    project
  )||{};

  const cupRows=[];
  for(const cupCode of LEGACY_CUP_CODES){
    const ingredientId=LIVE_CUP_INGREDIENT_IDS[cupCode];
    const master=getJson(
      `${base}/global/inventoryV2/ingredients/${ingredientId}`,
      project
    );
    const balance=getJson(
      `${base}/global/inventoryV2/balances/ingredients/${ingredientId}`,
      project
    );

    if(!master||typeof master!=='object'){
      fail('LIVE_CUP_MASTER_MISSING',`${cupCode}:${ingredientId}`);
    }

    cupRows.push({
      cupCode,
      ingredientId,
      outlet:Number(balance?.outlet??0),
      warehouse:Number(balance?.warehouse??0)
    });
  }

  return {products,cupRows,existingMappings};
}

function plannedWrites(plan,existingMappings){
  return Object.entries(plan.productMappings)
    .filter(([productId,mapping])=>!equal(existingMappings?.[productId],mapping))
    .sort((a,b)=>a[0].localeCompare(b[0]));
}

function printSummary({mode,plan,writes}){
  console.log(`MODE                   : ${mode==='apply'?'APPLY':'DRY_RUN'}`);
  console.log(`SOURCE HASH            : ${plan.sourceHash}`);
  console.log(`MAPPED PRODUCTS        : ${plan.coverage.mappedProducts}`);
  console.log(`RESOLVED CUP CODES     : ${Object.keys(plan.resolvedCupItems).sort().join(',')}`);
  console.log(`UNMAPPED CUP CODES     : ${plan.coverage.unmappedCupCodes.join(',')||'NONE'}`);
  console.log(`INVALID PRODUCTS       : ${plan.coverage.invalidProducts.length}`);
  console.log(`MASTER WRITES          : 0`);
  console.log(`BALANCE WRITES         : 0`);
  console.log(`MOVEMENT WRITES        : 0`);
  console.log(`DELETE WRITES          : 0`);
  console.log(`PLANNED MAPPING WRITES : ${writes.length}`);
  for(const [productId] of writes){
    console.log(`MAP WRITE              : global/inventoryV2/productStockComponents/${productId}`);
  }
}

function applyMappings({base,project,writes}){
  for(const [productId,mapping] of writes){
    const path=`${base}/global/inventoryV2/productStockComponents/${productId}`;
    firebase(
      ['database:set',path,JSON.stringify(mapping),'--force'],
      project
    );
  }
}

async function main(){
  const args=argsOf(process.argv.slice(2));
  const input=args.input?loadFixture(args.input):loadLive(args);
  const plan=buildLegacyCupMigration(input);
  const validation=validateMigrationPlan(plan);
  if(!validation.ok)fail('MIGRATION_PLAN_INVALID',validation.errors.join(','));

  const writes=plannedWrites(plan,input.existingMappings);
  printSummary({mode:args.mode,plan,writes});

  if(args.mode==='dry-run'){
    console.log('WRITE                  : NONE');
    return;
  }

  const fresh=loadLive(args);
  const freshPlan=buildLegacyCupMigration(fresh);
  if(freshPlan.sourceHash!==args.expectedSourceHash){
    fail('SOURCE_HASH_MISMATCH',`expected=${args.expectedSourceHash},actual=${freshPlan.sourceHash}`);
  }
  if(plan.sourceHash!==freshPlan.sourceHash){
    fail('SOURCE_CHANGED_BEFORE_APPLY',`planned=${plan.sourceHash},fresh=${freshPlan.sourceHash}`);
  }

  const freshWrites=plannedWrites(freshPlan,fresh.existingMappings);
  applyMappings({base:args.base,project:args.project,writes:freshWrites});
  console.log(`APPLIED MAPPING WRITES : ${freshWrites.length}`);
}

main().catch(error=>{
  console.error(error?.code||error?.message||String(error));
  if(error?.message&&error?.code)console.error(error.message);
  process.exit(1);
});
