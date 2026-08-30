import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT=new URL('..',import.meta.url).pathname;
const BASE=join(ROOT,'baseline','legacy-v1.0.40.html');
const COMPAT=join(ROOT,'dist','index.html');
const CANDIDATE=join(ROOT,'dist-sc03','index.html');
const EXPECTED='877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f';
const sha=file=>createHash('sha256').update(readFileSync(file)).digest('hex');

test('SC-03 candidate build appends exactly one late modular runtime entry and leaves frozen/compatibility artifacts untouched',()=>{
  execFileSync(process.execPath,[join(ROOT,'scripts','build-sc03.mjs')],{cwd:ROOT,stdio:'pipe'});
  assert.equal(sha(BASE),EXPECTED);
  assert.equal(sha(COMPAT),EXPECTED);
  assert.ok(existsSync(CANDIDATE));
  const html=readFileSync(CANDIDATE,'utf8');
  assert.equal((html.match(/data-sj-sc03-entry="true"/g)||[]).length,1);
  assert.match(html,/<script type="module" src="\.\/src\/sc03-entry\.js" data-sj-sc03-entry="true"><\/script>/);
  assert.ok(html.indexOf('data-sj-sc03-entry="true"')>html.lastIndexOf('</script>',html.indexOf('data-sj-sc03-entry="true"')-1),'SC-03 entry must load after the full legacy inline patch chain');
  assert.ok(existsSync(join(ROOT,'dist-sc03','src','app','bootstrap.js')));
  assert.ok(existsSync(join(ROOT,'dist-sc03','src','sc03-entry.js')));
});

test('SC-03 package exposes candidate build/preview without removing compatibility verification',()=>{
  const pkg=JSON.parse(readFileSync(join(ROOT,'package.json'),'utf8'));
  assert.equal(pkg.scripts['build:sc03'],'node scripts/build-sc03.mjs');
  assert.equal(pkg.scripts['dev:sc03'],'node scripts/dev-server.mjs dist-sc03');
  assert.ok(pkg.scripts['verify:sc02']);
});

test('SC-03 dev server keeps dist as default and accepts an explicit candidate output root',()=>{
  const src=readFileSync(join(ROOT,'scripts','dev-server.mjs'),'utf8');
  assert.match(src,/process\.argv\[2\]/);
  assert.match(src,/dist-sc03/);
});
