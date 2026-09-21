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
const MOBILE_LAN=process.env.SJ_UAT_MOBILE==='1';

function isPrivateIpv4(value){
  const parts=String(value||'').trim().split('.');
  if(parts.length!==4)return false;
  const oct=parts.map(Number);
  if(oct.some(n=>!Number.isInteger(n)||n<0||n>255))return false;
  return oct[0]===10||(oct[0]===172&&oct[1]>=16&&oct[1]<=31)||(oct[0]===192&&oct[1]===168);
}
function windowsLanHost(){
  const explicit=String(process.env.SJ_UAT_MOBILE_HOST||'').trim();
  if(explicit){
    if(!isPrivateIpv4(explicit))throw new Error('UAT_MOBILE_HOST_PRIVATE_IPV4_REQUIRED');
    return explicit;
  }
  const routeExe='/mnt/c/Windows/System32/route.exe';
  const result=spawnSync(routeExe,['print','-4','0.0.0.0'],{
    cwd:'/mnt/c/Windows',
    encoding:'utf8',
    timeout:10000,
    windowsHide:true
  });
  if(result.error||result.status!==0)throw new Error('UAT_WINDOWS_ROUTE_QUERY_FAILED');
  const rows=String(result.stdout||'').replaceAll(String.fromCharCode(13),'').split(String.fromCharCode(10));
  const candidates=[];
  for(const row of rows){
    const cols=row.trim().split(/\s+/);
    if(cols.length<5||cols[0]!=='0.0.0.0'||cols[1]!=='0.0.0.0')continue;
    const host=cols[3];
    const metric=Number(cols[4]);
    if(isPrivateIpv4(host))candidates.push({host,metric:Number.isFinite(metric)?metric:Number.MAX_SAFE_INTEGER});
  }
  candidates.sort((a,b)=>a.metric-b.metric);
  const host=candidates[0]?.host||'';
  if(!isPrivateIpv4(host))throw new Error('UAT_WINDOWS_LAN_IP_NOT_FOUND');
  return host;
}
const MOBILE_HOST=MOBILE_LAN?windowsLanHost():'';


if(UAT_PROJECT_ID!=='demo-segeran-jiwa-uat'||!UAT_PROJECT_ID.startsWith('demo-'))throw new Error('UAT_DEMO_PROJECT_REQUIRED');
if(!Number.isInteger(APP_PORT)||APP_PORT<1024||APP_PORT>65535)throw new Error('UAT_APP_PORT_INVALID');
if(spawnSync('java',['-version'],{stdio:'ignore'}).status!==0)throw new Error('UAT_JAVA_REQUIRED');

const children=new Set();
let stopping=false;
function launch(command,args,options={}){
  const child=spawn(command,args,{
    cwd:options.cwd||ROOT,
    stdio:options.stdio||'inherit',
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
console.log('TRANSPORT          : '+(MOBILE_LAN?('Private LAN bridge @ '+MOBILE_HOST):'PC loopback only'));
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

  const rtdbProxy=launch(process.execPath,['scripts/uat-rtdb-proxy.mjs']);
  rtdbProxy.once('exit',code=>{
    if(!stopping){
      console.error('UAT_RTDB_PROXY_EXITED:'+code);
      stop(code||1);
    }
  });
  const proxyDeadline=Date.now()+30000;
  let proxyReady=false;
  while(Date.now()<proxyDeadline){
    try{
      const proxyUrl='http://127.0.0.1:9000/.json?ns='+encodeURIComponent(UAT_DATABASE_NAMESPACE);
      const response=await fetch(proxyUrl,{cache:'no-store'});
      if(response.ok){proxyReady=true;break}
    }catch(_){}
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  if(!proxyReady)throw new Error('UAT_RTDB_BROWSER_PROXY_NOT_READY');
  console.log('BROWSER DATABASE    : 127.0.0.1:9000 -> 127.0.0.1:9001 (loopback TCP proxy)');

  const app=launch(process.execPath,['scripts/dev-server.mjs','dist-ref01'],{
    env:{
      SJ_UAT:'1',
      SJ_LOCAL_QA:'0',
      PORT:String(APP_PORT),
      ...(MOBILE_LAN?{SJ_UAT_MOBILE_HOST:MOBILE_HOST}:{})
    }
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

  if(MOBILE_LAN){
    const windowsNode='/mnt/c/Program Files/nodejs/node.exe';
    const bridgePathResult=spawnSync('wslpath',['-w',join(ROOT,'scripts','uat-windows-lan-bridge.cjs')],{encoding:'utf8'});
    const bridgeScript=String(bridgePathResult.stdout||'').trim();
    if(bridgePathResult.status!==0||!bridgeScript)throw new Error('UAT_WINDOWS_BRIDGE_PATH_FAILED');
    const mobileBridge=launch(windowsNode,[bridgeScript,'--listen-host',MOBILE_HOST],{
      cwd:'/mnt/c/Windows',
      stdio:['pipe','inherit','inherit']
    });
    mobileBridge.stdin?.on?.('error',()=>{});
    mobileBridge.once('exit',code=>{
      if(!stopping){
        console.error('UAT_WINDOWS_BRIDGE_EXITED:'+code);
        stop(code||1);
      }
    });

    const lanDeadline=Date.now()+30000;
    let lanReady=false;
    while(Date.now()<lanDeadline){
      try{
        const appResponse=await fetch('http://'+MOBILE_HOST+':'+APP_PORT+'/',{cache:'no-store'});
        const dbResponse=await fetch('http://'+MOBILE_HOST+':9000/.json?ns='+encodeURIComponent(UAT_DATABASE_NAMESPACE),{cache:'no-store'});
        const body=appResponse.ok?await appResponse.text():'';
        if(appResponse.ok
          &&dbResponse.ok
          &&appResponse.headers.get('x-segeran-jiwa-mode')==='UAT ISOLATED'
          &&body.includes(MOBILE_HOST)
          &&body.includes('MOBILE LAN PRIVATE')){
          lanReady=true;
          break;
        }
      }catch(_){}
      await new Promise(resolve=>setTimeout(resolve,200));
    }
    if(!lanReady)throw new Error('UAT_MOBILE_LAN_BRIDGE_NOT_READY');
  }

  console.log('');
  console.log(`UAT APP            : http://127.0.0.1:${APP_PORT}`);
  if(MOBILE_LAN)console.log('UAT APP HP         : http://'+MOBILE_HOST+':'+APP_PORT);
  console.log('BANNER             : UAT TERISOLASI · EMULATOR LOCAL · BUKAN LIVE');
  console.log('OWNER UAT          : owneruat / 2468');
  console.log('KASIR UAT          : kasiruat / 1357');
  console.log('RESET DATA         : restart normally (default reset)');
  console.log('KEEP DATA          : SJ_UAT_KEEP_DATA=1 npm run '+(MOBILE_LAN?'uat:mobile':'uat:local'));
  console.log('');
  console.log('Press Ctrl+C to stop the isolated UAT environment.');
}catch(error){
  console.error(error?.stack||error);
  await stop(1);
}
