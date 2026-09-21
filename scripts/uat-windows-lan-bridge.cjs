'use strict';
const net=require('node:net');

function arg(name){
  const i=process.argv.indexOf(name);
  return i>=0?String(process.argv[i+1]||''):'';
}
function normalizeIpv4(value){
  return String(value||'').replace(/^::ffff:/,'').trim();
}
function isPrivateIpv4(value){
  const host=normalizeIpv4(value);
  const parts=host.split('.');
  if(parts.length!==4)return false;
  const oct=parts.map(Number);
  if(oct.some(n=>!Number.isInteger(n)||n<0||n>255))return false;
  return oct[0]===10
    ||(oct[0]===172&&oct[1]>=16&&oct[1]<=31)
    ||(oct[0]===192&&oct[1]===168);
}

const listenHost=normalizeIpv4(arg('--listen-host'));
if(!isPrivateIpv4(listenHost))throw new Error('UAT_BRIDGE_PRIVATE_LISTEN_HOST_REQUIRED');

const targetHost='127.0.0.1';
const ports=Object.freeze([4174,9000,9099,9199]);
const servers=[];
let stopping=false;

function shutdown(code=0){
  if(stopping)return;
  stopping=true;
  let pending=servers.length;
  if(!pending)return process.exit(code);
  const done=()=>{if(--pending<=0)process.exit(code)};
  for(const server of servers){
    try{server.close(done)}catch(_){done()}
  }
  setTimeout(()=>process.exit(code),800).unref();
}

for(const port of ports){
  const server=net.createServer(client=>{
    const remote=normalizeIpv4(client.remoteAddress);
    if(remote!=='127.0.0.1'&&!isPrivateIpv4(remote)){
      client.destroy();
      return;
    }
    const upstream=net.connect({host:targetHost,port});
    client.setNoDelay(true);
    upstream.setNoDelay(true);
    const destroy=()=>{
      try{client.destroy()}catch(_){}
      try{upstream.destroy()}catch(_){}
    };
    client.on('error',destroy);
    upstream.on('error',destroy);
    client.pipe(upstream);
    upstream.pipe(client);
  });
  server.on('error',error=>{
    console.error('UAT_WINDOWS_BRIDGE_ERROR',port,error?.stack||error);
    shutdown(1);
  });
  server.listen(port,listenHost,()=>{
    console.log('UAT Windows LAN bridge '+listenHost+':'+port+' -> '+targetHost+':'+port);
  });
  servers.push(server);
}

process.stdin.resume();
process.stdin.on('end',()=>shutdown(0));
process.once('SIGINT',()=>shutdown(130));
process.once('SIGTERM',()=>shutdown(143));
console.log('UAT_WINDOWS_BRIDGE_READY host='+listenHost+' ports='+ports.join(','));
