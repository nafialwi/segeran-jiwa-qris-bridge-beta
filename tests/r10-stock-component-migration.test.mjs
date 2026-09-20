import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,writeFileSync,rmSync,readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

import {
  LEGACY_CUP_CODES,
  buildLegacyCupMigration,
  validateMigrationPlan
} from '../src/domain/stock-component-migration.js';

const CODES=['c10','c10p','c16','c22p','c22d','c22o'];

function cupRows(){
  return CODES.map((cupCode,index)=>({
    cupCode,
    ingredientId:`ING_EXISTING_${index+1}`,
    outlet:index+1,
    warehouse:(index+1)*10,
    master:{name:`Cup ${cupCode}`,unit:'pcs',shouldNotCopy:true}
  }));
}

function products(){
  return Object.fromEntries([
    ...CODES.map((cp,index)=>[`P${index+1}`,{id:`P${index+1}`,name:`Product ${index+1}`,cp}]),
    ['P_NONE',{id:'P_NONE',name:'No Cup',cp:''}],
    ['P_BAD',{id:'P_BAD',name:'Bad Cup',cp:'unknown-cup'}]
  ]);
}

test('legacy cup migration covers exactly all six supported cp codes using existing ingredient ids',()=>{
  assert.deepEqual([...LEGACY_CUP_CODES],CODES);

  const plan=buildLegacyCupMigration({
    products:products(),
    cupRows:cupRows(),
    existingMappings:{}
  });

  assert.equal(plan.coverage.mappedProducts,6);
  assert.deepEqual(plan.coverage.unmappedCupCodes,[]);
  assert.equal(plan.coverage.invalidProducts.length,1);
  assert.equal(plan.coverage.invalidProducts[0].productId,'P_BAD');
  assert.equal(plan.coverage.invalidProducts[0].cp,'unknown-cup');

  CODES.forEach((cp,index)=>{
    const productId=`P${index+1}`;
    const ingredientId=`ING_EXISTING_${index+1}`;
    assert.deepEqual(plan.productMappings[productId],{
      [ingredientId]:{
        stockItemId:ingredientId,
        qtyPerUnit:1,
        active:true,
        source:'LEGACY_CP_MIGRATION'
      }
    });
    assert.deepEqual(plan.resolvedCupItems[cp],{cupCode:cp,ingredientId});
  });

  assert.equal('P_NONE' in plan.productMappings,false);
  assert.equal('P_BAD' in plan.productMappings,false);
});

test('migration never emits stock master balance movement or deletion authorities',()=>{
  const plan=buildLegacyCupMigration({
    products:products(),
    cupRows:cupRows(),
    existingMappings:{}
  });

  for(const forbidden of ['stockItems','stockBalances','stockMovements','deletes','deletePaths']){
    assert.equal(Object.hasOwn(plan,forbidden),false,forbidden);
  }

  const serialized=JSON.stringify(plan.productMappings);
  assert.equal(serialized.includes('"outlet"'),false);
  assert.equal(serialized.includes('"warehouse"'),false);
  assert.equal(serialized.includes('"master"'),false);
  assert.equal(serialized.includes('"shouldNotCopy"'),false);

  assert.deepEqual(
    plan.sourceCupRows.map(row=>Object.keys(row).sort()),
    Array(6).fill(['cupCode','ingredientId','outlet','warehouse'])
  );
});

test('migration merges existing product components without overwriting unrelated mappings',()=>{
  const plan=buildLegacyCupMigration({
    products:{P1:{id:'P1',name:'Drink',cp:'c10'},P2:{id:'P2',name:'No Cup',cp:''}},
    cupRows:cupRows(),
    existingMappings:{
      P1:{ING_STRAW:{stockItemId:'ING_STRAW',qtyPerUnit:1,active:true,source:'OWNER'}},
      P2:{ING_BOX:{stockItemId:'ING_BOX',qtyPerUnit:1,active:true,source:'OWNER'}}
    }
  });

  assert.deepEqual(plan.productMappings.P1,{
    ING_STRAW:{stockItemId:'ING_STRAW',qtyPerUnit:1,active:true,source:'OWNER'},
    ING_EXISTING_1:{
      stockItemId:'ING_EXISTING_1',
      qtyPerUnit:1,
      active:true,
      source:'LEGACY_CP_MIGRATION'
    }
  });
  assert.equal('P2' in plan.productMappings,false);
});

test('existing conflicting mapping fails closed instead of guessing or overwriting',()=>{
  const plan=buildLegacyCupMigration({
    products:{P1:{id:'P1',name:'Drink',cp:'c10'}},
    cupRows:cupRows(),
    existingMappings:{
      P1:{ING_EXISTING_1:{stockItemId:'ING_EXISTING_1',qtyPerUnit:2,active:true,source:'OWNER'}}
    }
  });

  assert.equal(plan.coverage.mappedProducts,0);
  assert.equal('P1' in plan.productMappings,false);
  assert.equal(plan.coverage.invalidProducts.length,1);
  assert.equal(plan.coverage.invalidProducts[0].reason,'EXISTING_MAPPING_CONFLICT');
});

test('known cp without an existing ingredient row is reported as unmapped and never guessed',()=>{
  const rows=cupRows().filter(row=>row.cupCode!=='c22o');
  const plan=buildLegacyCupMigration({
    products:{P1:{id:'P1',name:'Drink',cp:'c22o'}},
    cupRows:rows,
    existingMappings:{}
  });

  assert.deepEqual(plan.coverage.unmappedCupCodes,['c22o']);
  assert.equal(plan.coverage.mappedProducts,0);
  assert.deepEqual(plan.productMappings,{});
});

test('migration domain remains persistence-free under the SC02 mutation detector',()=>{
  const source=readFileSync('src/domain/stock-component-migration.js','utf8');
  const mutationPattern=/\.(?:set|update|transaction|remove)\s*\(/;
  assert.equal(mutationPattern.test(source),false);
});

test('same source yields the same immutable migration plan and source hash',()=>{
  const input={
    products:products(),
    cupRows:cupRows(),
    existingMappings:{}
  };
  const first=buildLegacyCupMigration(input);
  const second=buildLegacyCupMigration(JSON.parse(JSON.stringify(input)));

  assert.deepEqual(second,first);
  assert.match(first.sourceHash,/^[0-9a-f]{64}$/);
  assert.equal(validateMigrationPlan(first).ok,true);
});

test('source hash changes when products cup rows or existing mappings change',()=>{
  const base={products:products(),cupRows:cupRows(),existingMappings:{}};
  const a=buildLegacyCupMigration(base);
  const changedProducts=structuredClone(base);
  changedProducts.products.P1.cp='c16';
  const b=buildLegacyCupMigration(changedProducts);
  assert.notEqual(a.sourceHash,b.sourceHash);

  const changedRows=structuredClone(base);
  changedRows.cupRows[0].ingredientId='ING_OTHER';
  const c=buildLegacyCupMigration(changedRows);
  assert.notEqual(a.sourceHash,c.sourceHash);

  const changedMappings=structuredClone(base);
  changedMappings.existingMappings.P1={ING_STRAW:{stockItemId:'ING_STRAW',qtyPerUnit:1,active:true}};
  const d=buildLegacyCupMigration(changedMappings);
  assert.notEqual(a.sourceHash,d.sourceHash);
});

test('CLI retirement contains no live Firebase access or mutation command',()=>{
  const source=readFileSync('scripts/r10-stock-components-migration.mjs','utf8');
  assert.match(source,/LEGACY_CUP_MIGRATION_RETIRED/);
  assert.doesNotMatch(source,/firebase-tools|database:get|database:set|spawnSync/);
});


test('CLI retired migration allows fixture-only historical audit with zero live access',()=>{
  const dir=mkdtempSync(join(tmpdir(),'r10-stock-migration-retired-'));
  try{
    const inputPath=join(dir,'input.json');
    writeFileSync(inputPath,JSON.stringify({
      products:products(),
      cupRows:cupRows(),
      existingMappings:{}
    }));
    const result=spawnSync(
      process.execPath,
      ['scripts/r10-stock-components-migration.mjs','--dry-run','--input',inputPath],
      {encoding:'utf8'}
    );
    assert.equal(result.status,0,result.stderr||result.stdout);
    assert.match(result.stdout,/RETIRED \/ HISTORICAL AUDIT ONLY/);
    assert.match(result.stdout,/LIVE FIREBASE READS\s*: 0/);
    assert.match(result.stdout,/LIVE FIREBASE WRITES\s*: 0/);
    assert.match(result.stdout,/WRITE\s*: NONE/);
  }finally{
    rmSync(dir,{recursive:true,force:true});
  }
});

test('CLI legacy Cup migration refuses apply unconditionally',()=>{
  const result=spawnSync(
    process.execPath,
    ['scripts/r10-stock-components-migration.mjs','--apply'],
    {encoding:'utf8'}
  );
  assert.notEqual(result.status,0);
  assert.match((result.stdout||'')+'\n'+(result.stderr||''),/LEGACY_CUP_MIGRATION_RETIRED/);
});
