import {createServer,connect} from 'node:net';

export const UAT_BROWSER_DATABASE_HOST='127.0.0.1';
export const UAT_BROWSER_DATABASE_PORT=9000;
export const UAT_INTERNAL_DATABASE_HOST='127.0.0.1';
export const UAT_INTERNAL_DATABASE_PORT=9001;

const server=createServer(client=>{
  const upstream=connect({
    host:UAT_INTERNAL_DATABASE_HOST,
    port:UAT_INTERNAL_DATABASE_PORT
  });
  client.setNoDelay(true);
  upstream.setNoDelay(true);
  const closeBoth=()=>{
    try{client.destroy()}catch(_){}
    try{upstream.destroy()}catch(_){}
  };
  client.on('error',closeBoth);
  upstream.on('error',closeBoth);
  client.on('close',()=>{try{upstream.end()}catch(_){}});
  upstream.on('close',()=>{try{client.end()}catch(_){}});
  client.pipe(upstream);
  upstream.pipe(client);
});

function stop(code=0){
  server.close(()=>process.exit(code));
  setTimeout(()=>process.exit(code),500).unref();
}

server.on('error',error=>{
  console.error('UAT_RTDB_PROXY_ERROR',error?.stack||error);
  process.exit(1);
});
server.listen(UAT_BROWSER_DATABASE_PORT,UAT_BROWSER_DATABASE_HOST,()=>{
  console.log(
    'UAT RTDB browser proxy: '+
    UAT_BROWSER_DATABASE_HOST+':'+UAT_BROWSER_DATABASE_PORT+
    ' -> '+UAT_INTERNAL_DATABASE_HOST+':'+UAT_INTERNAL_DATABASE_PORT
  );
});
process.once('SIGINT',()=>stop(130));
process.once('SIGTERM',()=>stop(143));
