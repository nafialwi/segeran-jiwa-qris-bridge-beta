import { closeSync, cpSync, existsSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, rmSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const BASE=join(ROOT,'baseline','legacy-v1.0.40.html');
const SOURCE=join(ROOT,'src');
const OUT=join(ROOT,'dist-ref01');
const LOCK=join(ROOT,'.ref01-build.lock');
const STAMP=join(OUT,'.ref01-build-fingerprint');
const CLASSIC_ENTRY='<script src="./src/compat/ref01-production-sales-compat.js" data-sj-ref01-production-sales-compat="true"></script>';
const ENTRY='<script type="module" src="./src/ref01-entry.js" data-sj-ref01-entry="true"></script>';

function sleep(ms){Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,ms)}
function acquireLock(){
  const deadline=Date.now()+30000;
  while(true){
    try{const fd=openSync(LOCK,'wx');writeFileSync(fd,String(process.pid));closeSync(fd);return}
    catch(error){
      if(error?.code!=='EEXIST')throw error;
      try{if(Date.now()-statSync(LOCK).mtimeMs>120000)unlinkSync(LOCK)}catch(_){}
      if(Date.now()>deadline)throw new Error('REF01_BUILD_LOCK_TIMEOUT');
      sleep(40);
    }
  }
}
function sourceFiles(dir){
  const out=[];
  for(const entry of readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
    const full=join(dir,entry.name);
    if(entry.isDirectory())out.push(...sourceFiles(full));
    else if(entry.isFile())out.push(full);
  }
  return out;
}
function fingerprint(){
  const hash=createHash('sha256');
  hash.update('REF01-BUILD-V2\0');
  hash.update(readFileSync(BASE));
  for(const file of sourceFiles(SOURCE)){
    hash.update(relative(ROOT,file));hash.update('\0');hash.update(readFileSync(file));hash.update('\0');
  }
  return hash.digest('hex');
}
function outputReady(fp){
  if(!existsSync(join(OUT,'index.html'))||!existsSync(join(OUT,'src','ref01-entry.js'))||!existsSync(STAMP))return false;
  try{return readFileSync(STAMP,'utf8').trim()===fp}catch(_){return false}
}

acquireLock();
let staging=null;
try{
  const fp=fingerprint();
  if(outputReady(fp)){
    const existing=readFileSync(join(OUT,'index.html'));
    console.log(`REF-01 candidate build: dist-ref01/index.html ${createHash('sha256').update(existing).digest('hex')} (cached)`);
  }else{
    staging=join(ROOT,`.dist-ref01-build-${process.pid}-${Date.now()}`);
    rmSync(staging,{recursive:true,force:true});
    mkdirSync(staging,{recursive:true});
    cpSync(SOURCE,join(staging,'src'),{recursive:true});
    const legacy=readFileSync(BASE,'utf8');
    if((legacy.match(/<\/body>/gi)||[]).length!==1)throw new Error('REF01_BUILD_BODY_ANCHOR_INVALID');
    const candidate=legacy.replace(/<\/body>/i,`${CLASSIC_ENTRY}\n${ENTRY}\n</body>`);
    writeFileSync(join(staging,'index.html'),candidate);
    writeFileSync(join(staging,'.ref01-build-fingerprint'),`${fp}\n`);
    rmSync(OUT,{recursive:true,force:true});
    renameSync(staging,OUT);staging=null;
    const sha=createHash('sha256').update(candidate).digest('hex');
    console.log(`REF-01 candidate build: dist-ref01/index.html ${sha}`);
  }
}finally{
  if(staging)rmSync(staging,{recursive:true,force:true});
  try{unlinkSync(LOCK)}catch(_){}
}
