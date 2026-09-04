import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));

test('S10C generated HTML installs sync authority after P3 definition and before lifecycle installs',()=>{
  execFileSync(process.execPath,[join(ROOT,'scripts','build-ref01.mjs')],{cwd:ROOT,stdio:'pipe'});
  const html=readFileSync(join(ROOT,'dist-ref01','index.html'),'utf8');
  const p3=html.indexOf('window.SJProductionArchitectureP3=SJProductionArchitectureP3;');
  const sync=html.indexOf('data-sj-rc01-s10c-sync-authority="true"');
  const installs=html.indexOf('try{SJMobileUX.install();');
  assert.ok(p3>=0&&sync>p3&&installs>sync,{p3,sync,installs});
  assert.ok(existsSync(join(ROOT,'dist-ref01','src','compat','rc01-sync-authority.js')));
});

test('S10C injection precedes P3 patchWrites execution and leaves QRIS S10A.2 shield entries present',()=>{
  const html=readFileSync(join(ROOT,'dist-ref01','index.html'),'utf8');
  const sync=html.indexOf('data-sj-rc01-s10c-sync-authority="true"');
  const p3Install=html.indexOf('SJProductionArchitectureP3.install();');
  assert.ok(sync>=0&&sync<p3Install,{sync,p3Install});
  assert.match(html,/data-sj-rc01-s10a1-event-shield="true"/);
  assert.match(html,/data-sj-rc01-s10a-qris="true"/);
});
