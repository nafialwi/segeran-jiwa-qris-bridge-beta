import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateMutationSource, APPROVED_MUTATION_FILES } from '../scripts/sc04-mutation-policy.mjs';

test('RC01 S10A mutation policy exact-allows the three P4 writers plus the approved QRIS deferred-settlement writer',()=>{
  assert.deepEqual([...APPROVED_MUTATION_FILES].sort(),[
    'src/data/writers/finance-writer.js',
    'src/data/writers/purchase-reconciliation-writer.js',
    'src/data/writers/qris-cash-out-coordinator.js',
    'src/data/writers/qris-deferred-settlement-writer.js'
  ]);
  for(const rel of APPROVED_MUTATION_FILES){
    const source=readFileSync(new URL(`../${rel}`,import.meta.url),'utf8');
    assert.deepEqual(validateMutationSource(rel,source),[],rel);
  }
});

test('P4 SC04 mutation policy rejects any mutation from a non-allowlisted modular file',()=>{
  const violations=validateMutationSource('src/domain/rogue.js',`export async function bad(db){await db.ref('x').update({oops:true})}`);
  assert.ok(violations.some(x=>x.code==='UNAUTHORIZED_MUTATION_FILE'));
});

test('P4 SC04 mutation policy rejects unauthorized RTDB path even inside an approved writer file',()=>{
  const violations=validateMutationSource('src/data/writers/finance-writer.js',`import {posPath} from '../firebase-client.js'; export async function bad(db){await db.ref(posPath('global','users')).transaction(x=>x)}`);
  assert.ok(violations.some(x=>x.code==='FINANCE_WRITER_PATH_CONTRACT'));
});

test('P4 SC04 mutation policy keeps destructive remove forbidden everywhere including approved writers',()=>{
  const violations=validateMutationSource('src/data/writers/qris-cash-out-coordinator.js',`export async function bad(db){await db.ref('x').remove()}`);
  assert.ok(violations.some(x=>x.code==='DESTRUCTIVE_REMOVE_FORBIDDEN'));
});


test('S10A writer policy rejects POS-root or non-QRIS mutation paths from the deferred-settlement writer',()=>{
  const rel='src/data/writers/qris-deferred-settlement-writer.js';
  const violations=validateMutationSource(rel,`export async function bad(db){await db.ref('toko_segeranjiwa_v58/global/users').transaction(x=>x)}`);
  assert.ok(violations.some(x=>x.code==='QRIS_DEFERRED_SETTLEMENT_PATH_CONTRACT'));
});
