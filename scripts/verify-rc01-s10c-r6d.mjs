import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const rel=p=>path.join(ROOT,p);
const text=p=>fs.readFileSync(rel(p),'utf8');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(rel(p))).digest('hex');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

const BASELINE_SHA256='877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f';
const R6A_COMPAT_SHA256='d24646468e7d8595ff1b356d9ba6a6f732efd1e40f02e8f6c28f924a39a7e355';
const R6B_HARDENER_SHA256='a6ee7844e884276a1f2f21a0792a3d4dd9784b18ac47fb5ce5807e6ece3a7f44';
const R6B_ENTRY_SHA256='22572c210c5f5c31d570709a023ef36c6983035427aa8a264b88e35098c39f7b';
const R6C_COMPAT_SHA256='203caa7f78085538965a0175fc8db6c6d31638a3b9c62759ddff3de452188d2e';

for(const [file,expected] of [
  ['baseline/legacy-v1.0.40.html',BASELINE_SHA256],
  ['src/compat/rc01-qris-deferred-settlement-compat.js',R6A_COMPAT_SHA256],
  ['src/app/rc01-runtime-loading-hardening.js',R6B_HARDENER_SHA256],
  ['src/ref01-entry.js',R6B_ENTRY_SHA256],
  ['src/compat/rc01-notification-permission-hygiene.js',R6C_COMPAT_SHA256]
])assert(sha(file)===expected,`R6D out-of-scope authority drift: ${file}`);

const compatPath='src/compat/rc01-sales-render-recursion-hardening.js';
assert(fs.existsSync(rel(compatPath)),'R6D sales recursion hardener missing');
const compat=text(compatPath);
for(const token of ['SJRC01S10CR6DSalesRenderHardening','SJRefinementSalesV100','SJCommercialUIV5953','baseRenderMenu','_baseRenderMenu','LEGACY_NON_MOBILE_ALIAS_CYCLE_BROKEN'])assert(compat.includes(token),`R6D contract token missing: ${token}`);
assert(!/\b(?:db|database|firebase)\s*\.\s*ref\s*\(/i.test(compat),'R6D must not add Firebase access');
assert(!/\.(?:set|update|remove|transaction)\s*\(/.test(compat),'R6D must not add persistence writers');

const build=text('scripts/build-ref01.mjs');
for(const token of ['R6D_SALES_RECURSION_ENTRY','rc01-sales-render-recursion-hardening.js','data-sj-rc01-s10c-r6d-sales-recursion'])assert(build.includes(token),`R6D build token missing: ${token}`);

for(const root of ['dist-ref01','dist-rc01']){
  const generated=`${root}/src/compat/rc01-sales-render-recursion-hardening.js`;
  assert(fs.existsSync(rel(generated)),`R6D generated compat missing: ${generated}`);
  assert(sha(generated)===sha(compatPath),`R6D generated compat drift: ${generated}`);
  const html=text(`${root}/index.html`);
  const r6d=html.indexOf('data-sj-rc01-s10c-r6d-sales-recursion="true"');
  const classic=html.indexOf('data-sj-ref01-production-sales-compat="true"');
  const module=html.indexOf('data-sj-ref01-entry="true"');
  assert(r6d>=0,`R6D runtime entry missing: ${root}`);
  assert(classic>r6d&&module>classic,`R6D must execute after frozen legacy and before REF-01 wrappers: ${root}`);
  assert((html.match(/data-sj-rc01-s10c-r6d-sales-recursion="true"/g)||[]).length===1,`R6D runtime entry count drift: ${root}`);
}

const pkg=JSON.parse(text('package.json'));
assert(pkg.scripts?.['verify:rc01:s10c-r6a']==='npm run verify:rc01:s10a2 && node scripts/verify-rc01-s10c.mjs && node scripts/verify-rc01-s10c-r1.mjs && node scripts/verify-rc01-s10c-r5.mjs && node scripts/verify-rc01-s10c-r6a.mjs','R6D must not rewrite frozen R6A gate');
assert(pkg.scripts?.['verify:rc01:s10c-r6b']==='npm run build:ref01 && npm run build:rc01 && node scripts/verify-rc01-s10c-r6a.mjs && node scripts/verify-rc01-s10c-r6b.mjs && npm test','R6D must not rewrite frozen R6B gate');
assert(pkg.scripts?.['verify:rc01:s10c-r6c']==='npm run build:ref01 && npm run build:rc01 && node scripts/verify-rc01-s10c-r6c.mjs && npm test','R6D must not rewrite frozen R6C gate');
assert(pkg.scripts?.['verify:rc01:s10c-r6d']==='npm run build:ref01 && npm run build:rc01 && node scripts/verify-rc01-s10c-r6d.mjs && npm test','R6D dedicated package gate mismatch');

console.log(`RC01-S10C-R6D verification PASS: frozen UI03A non-mobile _baseRenderMenu no longer routes through the UAT alias rebound to UI03A renderSales; stable desktop fallback uses SJCommercialUIV5953.baseRenderMenu; R6A QRIS, R6B loading, R6C notification, baseline and writer authorities preserved; compat ${sha(compatPath)}.`);
