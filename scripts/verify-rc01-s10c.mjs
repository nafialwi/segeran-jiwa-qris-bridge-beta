import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const BASE=join(ROOT,'baseline','legacy-v1.0.40.html');
const SYNC=join(ROOT,'src','compat','rc01-sync-authority.js');
const REF=join(ROOT,'dist-ref01','index.html');
const RC=join(ROOT,'dist-rc01','index.html');
const BUILD=join(ROOT,'scripts','build-ref01.mjs');
const EXPECTED_BASE='877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f';
const violations=[];
function requireToken(body,token,code){if(!body.includes(token))violations.push(`${code}: ${token}`)}
function addIf(condition,code){if(condition)violations.push(code)}

for(const p of [BASE,SYNC,REF,RC,BUILD])if(!existsSync(p))violations.push(`MISSING ${p}`);
if(!violations.length){
  const sync=readFileSync(SYNC,'utf8'),html=readFileSync(RC,'utf8'),build=readFileSync(BUILD,'utf8');
  addIf(sha(BASE)!==EXPECTED_BASE,'FROZEN_BASELINE_DRIFT');
  addIf(sha(REF)!==sha(RC),'REF_RC_RUNTIME_MISMATCH');
  for(const [token,code] of [
    ["reason:'DEFAULT_CRITICAL'",'SAFE_DEFAULT_MISSING'],
    ["reason:'NOTIFICATION_READ_ACK'",'NOTIF_ADVISORY_MISSING'],
    ["reason:'DEVICE_PRESENCE_HEARTBEAT'",'HEARTBEAT_ADVISORY_MISSING'],
    ["'SYNC_WRITE_STUCK'",'STUCK_EVIDENCE_MISSING'],
    ["S10C_STARTUP_SCHEMA_WRITE_DISABLED",'SCHEMA_HYGIENE_MISSING'],
    ["runExplicitSchemaMigration",'EXPLICIT_MIGRATION_PATH_MISSING'],
    ["Object.defineProperty(p3,'pendingWrites'",'P3_CRITICAL_BRIDGE_MISSING']
  ])requireToken(sync,token,code);
  requireToken(build,'data-sj-rc01-s10c-sync-authority="true"','BUILD_ENTRY_MISSING');
  const p3=html.indexOf('window.SJProductionArchitectureP3=SJProductionArchitectureP3;');
  const authority=html.indexOf('data-sj-rc01-s10c-sync-authority="true"');
  const installs=html.indexOf('try{SJMobileUX.install();');
  addIf(!(p3>=0&&authority>p3&&installs>authority),'NON_DETERMINISTIC_S10C_BOOTSTRAP_ORDER');
  addIf(/(?:db|database)\.ref\([^\n;]*\)\.(?:set|update|remove|transaction)\s*\(/.test(sync),'S10C_DIAGNOSTICS_OR_REGISTRY_ADDS_DIRECT_FIREBASE_WRITE');
  requireToken(html,'data-sj-rc01-s10a1-event-shield="true"','S10A1_SHIELD_MISSING');
  requireToken(html,'data-sj-rc01-s10a-qris="true"','S10A_COMPAT_MISSING');
}
const report={ok:violations.length===0,violations,baselineSha:existsSync(BASE)?sha(BASE):null,syncSourceSha:existsSync(SYNC)?sha(SYNC):null,refRuntimeSha:existsSync(REF)?sha(REF):null,rcRuntimeSha:existsSync(RC)?sha(RC):null};
mkdirSync(join(ROOT,'audit'),{recursive:true});writeFileSync(join(ROOT,'audit','rc01-s10c-verification.json'),JSON.stringify(report,null,2)+'\n');
if(violations.length){console.error('RC01-S10C verification FAIL');for(const v of violations)console.error('-',v);process.exit(1)}
console.log(`RC01-S10C verification PASS: critical/advisory authority + startup schema hygiene + deterministic bootstrap; runtime ${report.rcRuntimeSha}.`);
