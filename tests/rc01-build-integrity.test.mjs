import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync,readFileSync } from 'node:fs';

const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');

test('RC01 exposes deterministic build/dev commands and produces AppMint/Cloudflare-ready static output',()=>{
  const pkg=JSON.parse(readFileSync('package.json','utf8'));
  assert.equal(pkg.scripts['build:rc01'],'node scripts/build-rc01.mjs');
  assert.equal(pkg.scripts['dev:rc01'],'node scripts/dev-server.mjs dist-rc01');
  execFileSync(process.execPath,['scripts/build-rc01.mjs'],{stdio:'pipe'});
  assert.equal(existsSync('dist-rc01/index.html'),true);
  assert.equal(existsSync('dist-rc01/src/ref01-entry.js'),true);
  assert.equal(existsSync('dist-rc01/src/ui/rc01-receipt-output.js'),true);
  assert.equal(existsSync('dist-rc01/RC01_RELEASE.json'),true);
  assert.equal(existsSync('dist-rc01/RC01_SOURCE_SHA256.txt'),true);
});

test('RC01 build is reproducible and carries immutable P5 authority without changing legacy baseline',()=>{
  execFileSync(process.execPath,['scripts/build-rc01.mjs'],{stdio:'pipe'});
  const firstManifest=readFileSync('dist-rc01/RC01_SOURCE_SHA256.txt','utf8');
  const firstIndex=sha('dist-rc01/index.html');
  execFileSync(process.execPath,['scripts/build-rc01.mjs'],{stdio:'pipe'});
  assert.equal(readFileSync('dist-rc01/RC01_SOURCE_SHA256.txt','utf8'),firstManifest);
  assert.equal(sha('dist-rc01/index.html'),firstIndex);
  assert.equal(sha('baseline/legacy-v1.0.40.html'),'877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f');
  const meta=JSON.parse(readFileSync('dist-rc01/RC01_RELEASE.json','utf8'));
  assert.equal(meta.release,'v3.4 RC-01');
  assert.equal(meta.p5LockedSourceSha256,'485219ac9470cd629f080909e91c05700fe1eb5c6c8f393403644de3ef715530');
});


test('RC01 preview server serves dist-rc01 over local HTTP',async()=>{
  execFileSync(process.execPath,['scripts/build-rc01.mjs'],{stdio:'pipe'});
  const port=43101;
  const child=spawn(process.execPath,['scripts/dev-server.mjs','dist-rc01'],{
    env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']
  });
  let stdout='',stderr='';
  child.stdout.on('data',chunk=>{stdout+=chunk});
  child.stderr.on('data',chunk=>{stderr+=chunk});
  try{
    await new Promise((resolve,reject)=>{
      const deadline=setTimeout(()=>reject(new Error(`preview did not start; stdout=${stdout} stderr=${stderr}`)),1500);
      const poll=setInterval(()=>{
        if(stdout.includes(`http://127.0.0.1:${port}`)){clearInterval(poll);clearTimeout(deadline);resolve()}
        if(child.exitCode!==null){clearInterval(poll);clearTimeout(deadline);reject(new Error(`preview exited ${child.exitCode}; stdout=${stdout} stderr=${stderr}`))}
      },20);
    });
    const result=await fetch(`http://127.0.0.1:${port}/RC01_RELEASE.json`);
    assert.equal(result.status,200);
    const meta=await result.json();
    assert.equal(meta.release,'v3.4 RC-01');
  }finally{
    child.kill('SIGTERM');
  }
});
