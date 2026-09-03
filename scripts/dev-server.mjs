import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { injectLocalQaHtml } from './local-qa-html.mjs';

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const requested=process.argv[2]||'dist';
const allowed=new Set(['dist','dist-sc03','dist-ref01','dist-rc01']);
if(!allowed.has(basename(requested))||requested!==basename(requested)) throw new Error(`UNSUPPORTED_PREVIEW_ROOT:${requested}`);
const DIST=join(ROOT,requested);
const port=Number(process.env.PORT||4173);
const localQa=process.env.SJ_LOCAL_QA==='1';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml'};
function htmlBody(file){
  const text=readFileSync(file,'utf8');
  return localQa?injectLocalQaHtml(text):text;
}
const server=createServer((req,res)=>{
  const raw=(req.url||'/').split('?')[0];
  const rel=raw==='/'?'index.html':raw.replace(/^\/+/, '');
  const safe=normalize(rel).replace(/^\.\.(\/|\\|$)/,'');
  const file=join(DIST,safe);
  if(!file.startsWith(DIST)||!existsSync(file)||!statSync(file).isFile()){
    res.writeHead(404,{'content-type':'text/plain; charset=utf-8'});res.end('Not found');return;
  }
  const extension=extname(file).toLowerCase();
  res.writeHead(200,{'content-type':mime[extension]||'application/octet-stream','cache-control':'no-store',...(localQa?{'x-segeran-jiwa-mode':'LOCAL QA'}:{})});
  res.end(extension==='.html'?htmlBody(file):readFileSync(file));
});
server.listen(port,'127.0.0.1',()=>console.log(`Segeran Jiwa ${requested} preview${localQa?' [LOCAL QA]':''}: http://127.0.0.1:${port}`));
