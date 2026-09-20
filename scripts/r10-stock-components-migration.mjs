#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import {
  buildLegacyCupMigration,
  validateMigrationPlan
} from '../src/domain/stock-component-migration.js';

function fail(code,detail=''){
  const error=new Error(detail?`${code}:${detail}`:code);
  error.code=code;
  throw error;
}

function parseArgs(argv){
  const out={mode:'dry-run',input:'',help:false};
  for(let i=0;i<argv.length;i++){
    const arg=argv[i];
    if(arg==='--dry-run')out.mode='dry-run';
    else if(arg==='--input')out.input=String(argv[++i]||'');
    else if(arg==='--help')out.help=true;
    else if(arg==='--apply')out.mode='apply';
    else if(arg==='--project'||arg==='--base'||arg==='--expected-source-hash'){
      i++;
      out.mode='apply';
    }else fail('ARG_UNKNOWN',arg);
  }
  return out;
}

function main(){
  const args=parseArgs(process.argv.slice(2));
  if(args.help){
    console.log([
      'R10 legacy cp -> Product Stock Components migration is RETIRED.',
      'Cup authority is CUP-CONTROL-V1.',
      '',
      'Historical audit only:',
      '  node scripts/r10-stock-components-migration.mjs --dry-run --input <fixture.json>',
      '',
      'Live Firebase reads/writes are intentionally unsupported.'
    ].join('\n'));
    return;
  }

  if(args.mode==='apply')fail('LEGACY_CUP_MIGRATION_RETIRED');
  if(!args.input)fail('INPUT_PATH_REQUIRED');

  const raw=JSON.parse(readFileSync(args.input,'utf8'));
  const plan=buildLegacyCupMigration({
    products:raw.products||{},
    cupRows:raw.cupRows||[],
    existingMappings:raw.existingMappings||{}
  });
  const validation=validateMigrationPlan(plan);

  console.log('STATUS                 : RETIRED / HISTORICAL AUDIT ONLY');
  console.log('AUTHORITY              : CUP-CONTROL-V1');
  console.log(`SOURCE HASH            : ${plan.sourceHash}`);
  console.log(`MAPPED PRODUCTS        : ${plan.coverage.mappedProducts}`);
  console.log(`VALIDATION              : ${validation.ok?'PASS':'FAIL'}`);
  console.log('LIVE FIREBASE READS    : 0');
  console.log('LIVE FIREBASE WRITES   : 0');
  console.log('WRITE                  : NONE');
}

try{main()}
catch(error){
  console.error(error?.code||error?.message||String(error));
  if(error?.message&&error?.code)console.error(error.message);
  process.exit(1);
}
