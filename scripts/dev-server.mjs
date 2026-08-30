import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const requested=process.argv[2]||'dist';
const allowed=new Set(['dist','dist-sc03']);
if(!allowed.has(basename(requested))||requested!==basename(requested)) throw new Error(`UNSUPPORTED_PREVIEW_ROOT:${requested}`);
const DIST=join(ROOT,requested);
const port=Number(process.env.PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml'};
const server=createServer((req,res)=>{
  const raw=(req.url||'/').split('?')[0];
  const rel=raw==='/'?'index.html':raw.replace(/^\/+/, '');
  const safe=normalize(rel).replace(/^\.\.(\/|\\|$)/,'');
  const file=join(DIST,safe);
  if(!file.startsWith(DIST)||!existsSync(file)||!statSync(file).isFile()){
    res.writeHead(404,{'content-type':'text/plain; charset=utf-8'});res.end('Not found');return;
  }
  res.writeHead(200,{'content-type':mime[extname(file).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});
  res.end(readFileSync(file));
});
server.listen(port,'127.0.0.1',()=>console.log(`Segeran Jiwa ${requested} preview: http://127.0.0.1:${port}`));
