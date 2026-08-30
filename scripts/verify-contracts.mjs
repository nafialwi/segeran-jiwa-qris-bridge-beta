import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const BASE=join(ROOT,'baseline','legacy-v1.0.40.html');
const DIST=join(ROOT,'dist','index.html');
const EXPECTED='877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f';
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const base=readFileSync(BASE,'utf8'),dist=readFileSync(DIST,'utf8');
const violations=[];
const requiredTokens=[
  ['pos root','const DB_PATH="toko_segeranjiwa_v58"'],
  ['qris root','segeranjiwa_qris_beta_v1'],
  ['qris engine','window.SJQrisSignalBeta'],
  ['qris pending gate','ensureWaitingPending'],
  ['qris cancel','cancelWaiting'],
  ['qris ambiguity','resolveAmbiguous'],
  ['transaction engine','async function processTransaction'],
  ['shift authority','window.SJShift=SJShift'],
  ['report authority','window.SJReportFoundationV010'],
  ['inventory authority','window.SJInventoryV2'],
  ['navigation Beranda','Beranda'],
  ['navigation Jual','Jual'],
  ['navigation Operasional','Operasional'],
  ['navigation Laporan','Laporan'],
  ['navigation Pengaturan','Pengaturan']
];
const baselineSha256=sha(BASE),distSha256=sha(DIST);
if(baselineSha256!==EXPECTED)violations.push(`baseline hash changed: ${baselineSha256}`);
if(distSha256!==EXPECTED)violations.push(`compatibility dist is not byte-identical: ${distSha256}`);
for(const [name,token] of requiredTokens){if(!dist.includes(token))violations.push(`missing ${name}: ${token}`)}
if(dist!==base)violations.push('dist content differs from baseline bytes');
const result={verifiedAt:new Date().toISOString(),baselineSha256,distSha256,requiredTokens:requiredTokens.map(([name,token])=>({name,token,present:dist.includes(token)})),violations};
mkdirSync(join(ROOT,'audit'),{recursive:true});
writeFileSync(join(ROOT,'audit','contract-verification.json'),JSON.stringify(result,null,2));
if(violations.length){console.error(violations.join('\n'));process.exit(1)}
console.log(`SC-01 contracts: ${requiredTokens.length} critical tokens present; hashes identical; 0 violations`);
