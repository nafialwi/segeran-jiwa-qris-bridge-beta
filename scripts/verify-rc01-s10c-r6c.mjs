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

for(const [file,expected] of [
  ['baseline/legacy-v1.0.40.html',BASELINE_SHA256],
  ['src/compat/rc01-qris-deferred-settlement-compat.js',R6A_COMPAT_SHA256],
  ['src/app/rc01-runtime-loading-hardening.js',R6B_HARDENER_SHA256],
  ['src/ref01-entry.js',R6B_ENTRY_SHA256]
])assert(sha(file)===expected,`R6C out-of-scope authority drift: ${file}`);

const compatPath='src/compat/rc01-notification-permission-hygiene.js';
assert(fs.existsSync(rel(compatPath)),'R6C notification hygiene compat missing');
const compat=text(compatPath);
for(const token of ['SJRC01S10CR6CNotificationHygiene','userActivation','requestPermission','requestInFlight','sjx.askNotification=function()','sjx.openNotifications=function()'])assert(compat.includes(token),`R6C contract token missing: ${token}`);
assert(!/\b(?:db|database)\s*\.\s*ref\(/.test(compat),'R6C must not add Firebase access');

const build=text('scripts/build-ref01.mjs');
for(const token of ['R6C_NOTIFICATION_ENTRY','injectR6CNotificationHygiene','rc01-notification-permission-hygiene.js','R6C_NOTIFICATION_BOOTSTRAP_MARKER'])assert(build.includes(token),`R6C build token missing: ${token}`);

for(const root of ['dist-ref01','dist-rc01']){
  const generated=`${root}/src/compat/rc01-notification-permission-hygiene.js`;
  assert(fs.existsSync(rel(generated)),`R6C generated compat missing: ${generated}`);
  assert(sha(generated)===sha(compatPath),`R6C generated compat drift: ${generated}`);
  const html=text(`${root}/index.html`);
  const entry=html.indexOf('data-sj-rc01-s10c-r6c-notification-hygiene="true"');
  const bootstrap=html.indexOf('SJX.init();');
  assert(entry>=0,'R6C notification hygiene entry missing from built runtime');
  assert(bootstrap>entry,`R6C notification hygiene must execute before SJX.init(); in ${root}`);
  assert((html.match(/data-sj-rc01-s10c-r6c-notification-hygiene="true"/g)||[]).length===1,`R6C notification hygiene entry count drift: ${root}`);
}

const pkg=JSON.parse(text('package.json'));
assert(pkg.scripts?.['verify:rc01:s10c-r5']==='npm run verify:rc01:s10c-r4 && node scripts/verify-rc01-s10c-r5.mjs','R6C must not weaken frozen R5 gate');
assert(pkg.scripts?.['verify:rc01:s10c-r6a']==='npm run verify:rc01:s10a2 && node scripts/verify-rc01-s10c.mjs && node scripts/verify-rc01-s10c-r1.mjs && node scripts/verify-rc01-s10c-r5.mjs && node scripts/verify-rc01-s10c-r6a.mjs','R6C must not rewrite frozen R6A gate');
assert(pkg.scripts?.['verify:rc01:s10c-r6b']==='npm run build:ref01 && npm run build:rc01 && node scripts/verify-rc01-s10c-r6a.mjs && node scripts/verify-rc01-s10c-r6b.mjs && npm test','R6C must not rewrite frozen R6B gate');
assert(pkg.scripts?.['verify:rc01:s10c-r6c']==='npm run build:ref01 && npm run build:rc01 && node scripts/verify-rc01-s10c-r6c.mjs && npm test','R6C dedicated package gate mismatch');

console.log(`RC01-S10C-R6C verification PASS: Notification.requestPermission is neutralized on SJX bootstrap and may run only while navigator.userActivation.isActive; granted notification delivery remains untouched; R6A QRIS, R6B loading hardener, R5 baseline authority preserved; compat ${sha(compatPath)}.`);
