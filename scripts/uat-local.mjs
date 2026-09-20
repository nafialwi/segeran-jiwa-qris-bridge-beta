import {spawn,spawnSync} from 'node:child_process';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  UAT_PROJECT_ID,
  UAT_DATABASE_NAMESPACE,
  waitForUatDatabase,
  resetUatDatabase
} from './uat-backend.mjs';

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const CONFIG=join(ROOT,'firebase','uat','firebase.json');
const APP_PORT=Number(process.env.PORT||4174);

if(UAT_PROJECT_ID!=='demo-segeran-jiwa-uat'||!UAT_PROJECT_ID.startsWith('demo-'))throw new Error('UAT_DEMO_PROJECT_REQUIRED');
if(!Number.isInteger(APP_PORT)||APP_PORT<1024||APP_PORT>65535)throw new Error('UAT_APP_PORT_INVALID');
if(spawnSync('java',['-version'],{stdio:'ignore'}).status!==0)throw new Error('UAT_JAVA_REQUIRED');

const children=new Set();
let stopping=false;
function launch(command,args,options={}){
  const child=spawn(command,args,{
    cwd:ROOT,
    stdio:'inherit',
    env:{...process.env,...(options.env||{})}
  });
  children.add(child);
  child.once('exit',()=>children.delete(child));
  return child;
}
async function stop(code=0){
  if(stopping)return;
  stopping=true;
  for(const child of children){
    try{child.kill('SIGTERM')}catch(_){}
  }
  await new Promise(resolve=>setTimeout(resolve,250));
  process.exit(code);
}
process.once('SIGINT',()=>stop(130));
process.once('SIGTERM',()=>stop(143));

console.log('=== SEGERAN JIWA PU-09 — ISOLATED UAT ===');
console.log(`PROJECT            : ${UAT_PROJECT_ID}`);
console.log(`DATABASE NAMESPACE : ${UAT_DATABASE_NAMESPACE}`);
console.log('BACKEND            : Firebase Emulator Suite @ 127.0.0.1');
console.log('PRODUCTION WRITES  : 0 (routing is demo + loopback only)');

const emulator=launch('npx',[
  '--yes','firebase-tools@latest',
  'emulators:start',
  '--only','database,auth,storage',
  '--project',UAT_PROJECT_ID,
  '--config',CONFIG
]);
emulator.once('exit',code=>{
  if(!stopping&&code!==0){
    console.error(`UAT_EMULATOR_EXITED:${code}`);
    stop(code||1);
  }
});

try{
  await waitForUatDatabase({timeoutMs:120000});
  if(process.env.SJ_UAT_KEEP_DATA==='1'){
    console.log('SEED               : retained by explicit SJ_UAT_KEEP_DATA=1');
  }else{
    await resetUatDatabase();
    console.log('SEED               : deterministic synthetic UAT seed restored');
  }

  const app=launch(process.execPath,['scripts/dev-server.mjs','dist-ref01'],{
    env:{SJ_UAT:'1',SJ_LOCAL_QA:'0',PORT:String(APP_PORT)}
  });
  app.once('exit',code=>{
    if(!stopping){
      console.error(`UAT_APP_SERVER_EXITED:${code}`);
      stop(code||1);
    }
  });

  const deadline=Date.now()+30000;
  let ready=false;
  while(Date.now()<deadline){
    try{
      const response=await fetch(`http://127.0.0.1:${APP_PORT}/`,{cache:'no-store'});
      if(response.ok&&response.headers.get('x-segeran-jiwa-mode')==='UAT ISOLATED'){
        const body=await response.text();
        if(!body.includes('SJ_UAT_EMULATOR_ROUTER'))throw new Error('UAT_ROUTER_NOT_INJECTED');
        ready=true;break;
      }
    }catch(_){}
    await new Promise(resolve=>setTimeout(resolve,200));
  }
  if(!ready)throw new Error('UAT_APP_SERVER_NOT_READY');

  console.log('');
  console.log(`UAT APP            : http://127.0.0.1:${APP_PORT}`);
  console.log('BANNER             : UAT TERISOLASI · EMULATOR LOCAL · BUKAN LIVE');
  console.log('OWNER UAT          : owneruat / 2468');
  console.log('KASIR UAT          : kasiruat / 1357');
  console.log('RESET DATA         : restart normally (default reset)');
  console.log('KEEP DATA          : SJ_UAT_KEEP_DATA=1 npm run uat:local');
  console.log('');
  console.log('Press Ctrl+C to stop the isolated UAT environment.');
}catch(error){
  console.error(error?.stack||error);
  await stop(1);
}
