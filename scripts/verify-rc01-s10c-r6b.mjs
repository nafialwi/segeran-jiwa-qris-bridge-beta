import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const rel=p=>path.join(ROOT,p);
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const text=p=>fs.readFileSync(p,'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

const BASELINE_SHA256='877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f';
const R6A_COMPAT_SHA256='d24646468e7d8595ff1b356d9ba6a6f732efd1e40f02e8f6c28f924a39a7e355';
const R4_RUNTIME_SHA256='219149affb2844e67d9dfde5d2d98a0ef8776275def2d75f13a73724c346934c';
const R6A_GATE='npm run verify:rc01:s10a2 && node scripts/verify-rc01-s10c.mjs && node scripts/verify-rc01-s10c-r1.mjs && node scripts/verify-rc01-s10c-r5.mjs && node scripts/verify-rc01-s10c-r6a.mjs';
const R6B_GATE='npm run build:ref01 && npm run build:rc01 && node scripts/verify-rc01-s10c-r6a.mjs && node scripts/verify-rc01-s10c-r6b.mjs && npm test';

for(const [file,expected] of [
  ['baseline/legacy-v1.0.40.html',BASELINE_SHA256],
  ['src/compat/rc01-qris-deferred-settlement-compat.js',R6A_COMPAT_SHA256]
]){
  const p=rel(file);assert(fs.existsSync(p),`R6B authority missing: ${file}`);assert(sha(p)===expected,`R6B out-of-scope authority drift: ${file}`);
}

const modulePath=rel('src/app/rc01-runtime-loading-hardening.js');
assert(fs.existsSync(modulePath),'R6B runtime hardening module missing');
const hardening=text(modulePath);
for(const token of [
  'R6B_DASH_REFRESH_TIMEOUT',
  'async readDayRemote(date)',
  'async readShiftDayRemote(date)',
  'function scheduleDashboardRefresh(date)',
  'function installShift()',
  'shift.render=function()',
  'function installReports()',
  'function reportLocalPreview()',
  'state.reports.inFlight',
  'function installInsight()',
  'state.insight.inFlight'
]) assert(hardening.includes(token),`R6B contract token missing: ${token}`);

// R6B is read-only hardening. Map#set is allowed; direct Firebase writes are not.
assert(!/\b(?:db|database)\s*\.\s*ref\([^;\n]*?\)\s*\.\s*(?:set|update|remove|transaction)\s*\(/.test(hardening),'R6B direct RTDB mutation authority detected');
assert(!/\bshift\s*\.\s*loadDay\s*=/.test(hardening),'R6B must preserve authoritative SJShift.loadDay implementation');

const entryPath=rel('src/ref01-entry.js');
const entry=text(entryPath);
assert(entry.includes("import { installRc01RuntimeLoadingHardening } from './app/rc01-runtime-loading-hardening.js';"),'R6B entry import missing');
assert(entry.includes('installRc01RuntimeLoadingHardening(globalThis);'),'R6B entry install missing');

for(const file of [
  'tests/rc01-s10c-r6a-qris-cancel-deadlock.test.mjs',
  'tests/rc01-s10c-r6a-release-gate.test.mjs',
  'tests/rc01-s10c-r6b-loading-resilience.test.mjs',
  'tests/rc01-s10c-r6b-release-gate.test.mjs'
]) assert(fs.existsSync(rel(file)),`R6B regression test missing: ${file}`);

const pkg=JSON.parse(text(rel('package.json')));
assert(pkg.scripts?.['verify:rc01:s10c-r5']==='npm run verify:rc01:s10c-r4 && node scripts/verify-rc01-s10c-r5.mjs','R6B must not weaken frozen R5 gate');
assert(pkg.scripts?.['verify:rc01:s10c-r6a']===R6A_GATE,'R6B must not weaken frozen R6A gate');
assert(pkg.scripts?.['verify:rc01:s10c-r6b']===R6B_GATE,'R6B dedicated package gate mismatch');

const sourceModuleSha=sha(modulePath),sourceEntrySha=sha(entryPath);
for(const root of ['dist-ref01','dist-rc01']){
  const generatedModule=rel(`${root}/src/app/rc01-runtime-loading-hardening.js`);
  const generatedEntry=rel(`${root}/src/ref01-entry.js`);
  assert(fs.existsSync(generatedModule),`R6B generated module missing: ${root}`);
  assert(fs.existsSync(generatedEntry),`R6B generated entry missing: ${root}`);
  assert(sha(generatedModule)===sourceModuleSha,`R6B generated module drift: ${root}`);
  assert(sha(generatedEntry)===sourceEntrySha,`R6B generated entry drift: ${root}`);
}

// R6B changes the module graph only; the frozen monolith/index remains byte-identical.
const runtime=rel('dist-rc01/index.html');
assert(fs.existsSync(runtime),'R6B dist-rc01/index.html missing');
assert(sha(runtime)===R4_RUNTIME_SHA256,'R6B must not rewrite frozen monolith runtime');

console.log(`RC01-S10C-R6B verification PASS: Dashboard cache-first/single-flight/stale suppression active; Shift authority preserved with read-only background refresh; Reports navigation single-flight with safe local first paint; previous-day insight non-blocking; R6A QRIS + R5 authority preserved; module ${sourceModuleSha}.`);
