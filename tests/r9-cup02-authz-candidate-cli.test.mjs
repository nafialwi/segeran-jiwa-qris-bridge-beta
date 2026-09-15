import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(here,'..');
const fixture=path.join(here,'fixtures/r5/database.rules.v4_1.reference-only.json');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');

test('CUP02 builder preserves byte-identical rollback and emits a fail-closed candidate only',()=>{
  const out=fs.mkdtempSync(path.join(os.tmpdir(),'sj-cup02-'));
  const run=spawnSync(process.execPath,[path.join(repo,'firebase/r9/build-cup02-authz-candidate.mjs'),'--live',fixture,'--out-dir',out],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr||run.stdout);
  const live=fs.readFileSync(fixture);
  const rollback=fs.readFileSync(path.join(out,'database.rules.CUP02_AUTHZ_ROLLBACK_EXACT.json'));
  assert.equal(Buffer.compare(live,rollback),0);
  assert.equal(sha(live),sha(rollback));
  const gate=JSON.parse(fs.readFileSync(path.join(out,'CUP02_AUTHZ_GATE_REPORT.json'),'utf8'));
  assert.equal(gate.patchBuildPass,true);
  assert.equal(gate.rollbackByteIdentical,true);
  assert.equal(gate.diffCount,15);
  assert.equal(gate.runtimeSourceChanged,false);
  assert.equal(gate.firebaseWritePerformed,false);
  assert.equal(gate.rulesPublished,false);
  assert.equal(gate.publishGate,'CANDIDATE_ONLY_EMULATOR_REQUIRED_NOT_PUBLISHED');
  const candidate=JSON.parse(fs.readFileSync(path.join(out,'database.rules.CUP02_AUTHZ_CANDIDATE.json'),'utf8'));
  assert.equal(candidate.rules['.write'],false);
});

test('CUP02 builder hard-stops on unsupported live reservation rules',()=>{
  const out=fs.mkdtempSync(path.join(os.tmpdir(),'sj-cup02-bad-'));
  const bad=JSON.parse(fs.readFileSync(fixture,'utf8'));
  bad.rules.toko_segeranjiwa_v58.global.inventoryV2.reservations['$reservationId']['.write']='true';
  const badPath=path.join(out,'bad.json');fs.writeFileSync(badPath,JSON.stringify(bad));
  const run=spawnSync(process.execPath,[path.join(repo,'firebase/r9/build-cup02-authz-candidate.mjs'),'--live',badPath,'--out-dir',path.join(out,'candidate')],{encoding:'utf8'});
  assert.notEqual(run.status,0);
  assert.equal(fs.existsSync(path.join(out,'candidate','database.rules.CUP02_AUTHZ_CANDIDATE.json')),false);
});
