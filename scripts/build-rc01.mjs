import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const REF=join(ROOT,'dist-ref01');
const OUT=join(ROOT,'dist-rc01');
const P5_SHA='485219ac9470cd629f080909e91c05700fe1eb5c6c8f393403644de3ef715530';
const BASELINE_SHA='877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f';
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
function walk(dir){const out=[];for(const name of readdirSync(dir).sort()){const p=join(dir,name);if(statSync(p).isDirectory())out.push(...walk(p));else out.push(p)}return out}

execFileSync(process.execPath,[join(ROOT,'scripts','build-ref01.mjs')],{cwd:ROOT,stdio:'pipe'});
if(!existsSync(join(REF,'index.html')))throw new Error('RC01_REF01_BUILD_MISSING');
rmSync(OUT,{recursive:true,force:true});mkdirSync(OUT,{recursive:true});cpSync(REF,OUT,{recursive:true});
const metadata={
  release:'v3.4 RC-01',
  phase:'RC-01 Release Hardening + AppMint Gate',
  p5LockedSourceSha256:P5_SHA,
  legacyBaselineSha256:BASELINE_SHA,
  sourceAuthority:'P5 v3.4 FINAL LOCKED + RC01 release-only deltas',
  productionDeploymentAuthorized:false
};
writeFileSync(join(OUT,'RC01_RELEASE.json'),JSON.stringify(metadata,null,2)+'\n');
const manifest=walk(OUT)
  .filter(p=>!p.endsWith('RC01_SOURCE_SHA256.txt'))
  .map(p=>`${sha(p)}  ./${relative(OUT,p).replaceAll('\\','/')}`)
  .join('\n')+'\n';
writeFileSync(join(OUT,'RC01_SOURCE_SHA256.txt'),manifest);
const indexSha=sha(join(OUT,'index.html'));
console.log(`RC-01 build: dist-rc01/index.html ${indexSha}; manifest ${manifest.trim().split('\n').length} files`);
