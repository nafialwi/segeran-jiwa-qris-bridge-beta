import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const here=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(here,'..');
const fixture=path.join(here,'fixtures/r5/database.rules.v4_1.reference-only.json');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');

test('R5 candidate builder preserves exact live rollback and emits verified two-scalar candidate',()=>{
  const out=fs.mkdtempSync(path.join(os.tmpdir(),'sj-r5-'));
  const run=spawnSync(process.execPath,[path.join(repo,'firebase/r5/build-r5-candidate.mjs'),'--live',fixture,'--out-dir',out],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr||run.stdout);
  const live=fs.readFileSync(fixture);
  const rollback=fs.readFileSync(path.join(out,'database.rules.R5_ROLLBACK_EXACT.json'));
  assert.equal(Buffer.compare(live,rollback),0,'rollback must be byte-identical to exported live rules');
  assert.equal(sha(rollback),sha(live));

  const report=JSON.parse(fs.readFileSync(path.join(out,'R5_RULES_GATE_REPORT.json'),'utf8'));
  assert.equal(report.patchBuildPass,true);
  assert.equal(report.rootFailClosed,true);
  assert.equal(report.diffCount,2);
  assert.deepEqual(report.changedPaths,[
    'rules/segeranjiwa_qris_beta_v1/signals/$signalId/.validate',
    'rules/segeranjiwa_qris_beta_v1/signals/$signalId/.write'
  ]);
  assert.equal(report.liveRawSha256,'3d02fc3e5567e31208816d7990fb4234a808826edf3b51c719f98e0a98829481');
  assert.equal(report.lineage,'V4_1_REFERENCE');
  assert.equal(report.publishGate,'READY_FOR_MANUAL_REVIEW_NOT_PUBLISHED');

  const candidate=JSON.parse(fs.readFileSync(path.join(out,'database.rules.R5_LATE_QUARANTINE_CANDIDATE.json'),'utf8'));
  assert.equal(candidate.rules.segeranjiwa_qris_beta_v1['.write'],false);
});

test('R5 candidate builder hard-stops before output when live rules are structurally unsafe',()=>{
  const out=fs.mkdtempSync(path.join(os.tmpdir(),'sj-r5-bad-'));
  const bad=JSON.parse(fs.readFileSync(fixture,'utf8'));
  bad.rules.segeranjiwa_qris_beta_v1['.write']=true;
  const badPath=path.join(out,'unsafe-live.json');fs.writeFileSync(badPath,JSON.stringify(bad));
  const run=spawnSync(process.execPath,[path.join(repo,'firebase/r5/build-r5-candidate.mjs'),'--live',badPath,'--out-dir',path.join(out,'outputs')],{encoding:'utf8'});
  assert.notEqual(run.status,0);
  assert.match(run.stderr+run.stdout,/R5_QRIS_ROOT_NOT_FAIL_CLOSED/);
  assert.equal(fs.existsSync(path.join(out,'outputs','database.rules.R5_LATE_QUARANTINE_CANDIDATE.json')),false);
});
