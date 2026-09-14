import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

execFileSync(process.execPath,['scripts/build-ref01.mjs'],{stdio:'pipe'});
const html=readFileSync('dist-ref01/index.html','utf8');

test('CUP-01 canonical SJReliability.processSale returns exact txId after committed sale',()=>{
  const start=html.indexOf('  async processSale(){');
  const end=html.indexOf('  async createEmployeeAdvance(){',start);

  assert.ok(start>0,'SJReliability.processSale must exist');
  assert.ok(end>start,'processSale boundary must be found');

  const body=html.slice(start,end);

  assert.match(body,/txId='SJ-'/);
  assert.match(body,/committed=true;/);

  assert.match(
    body,
    /catch\(uiErr\)\{[\s\S]*?\}\s*return txId\s*\}catch\(e\)\{/,
    'a committed sale must return its exact txId even when post-commit receipt UI succeeds or has a minor UI error'
  );
});
