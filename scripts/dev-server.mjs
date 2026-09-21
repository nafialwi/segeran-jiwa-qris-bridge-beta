import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { injectLocalQaHtml } from './local-qa-html.mjs';
import { injectUatHtml } from './uat-html.mjs';

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const requested=process.argv[2]||'dist';
const allowed=new Set(['dist','dist-sc03','dist-ref01','dist-rc01']);
if(!allowed.has(basename(requested))||requested!==basename(requested)) throw new Error(`UNSUPPORTED_PREVIEW_ROOT:${requested}`);
const DIST=join(ROOT,requested);
const localQa=process.env.SJ_LOCAL_QA==='1';
const uat=process.env.SJ_UAT==='1';
const uatMobileHost=String(process.env.SJ_UAT_MOBILE_HOST||'').trim().toLowerCase();
if(localQa&&uat)throw new Error('LOCAL_QA_AND_UAT_MUTUALLY_EXCLUSIVE');
const port=Number(process.env.PORT||(uat?4174:4173));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml'};
function requestHostname(req){
  const raw=String(req?.headers?.host||'').trim().toLowerCase();
  if(raw.startsWith('[')){
    const end=raw.indexOf(']');
    return end>=0?raw.slice(1,end):'';
  }
  return raw.split(':')[0];
}
function uatBrowserHost(req){
  const host=requestHostname(req);
  if(['127.0.0.1','localhost','::1'].includes(host))return host;
  if(uatMobileHost&&host===uatMobileHost)return host;
  throw new Error('UAT_REQUEST_HOST_NOT_ALLOWED');
}
function htmlBody(file,req){
  const text=readFileSync(file,'utf8');
  if(uat)return injectUatHtml(text,{browserHost:uatBrowserHost(req)});
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
  const modeHeader=uat?'UAT ISOLATED':localQa?'LOCAL QA':'';
  let body;
  try{
    body=extension==='.html'?htmlBody(file,req):readFileSync(file);
  }catch(error){
    if(uat&&String(error?.message||'').startsWith('UAT_')){
      res.writeHead(403,{'content-type':'text/plain; charset=utf-8','cache-control':'no-store','x-segeran-jiwa-mode':'UAT ISOLATED'});
      res.end(String(error.message));
      return;
    }
    throw error;
  }
  res.writeHead(200,{'content-type':mime[extension]||'application/octet-stream','cache-control':'no-store',...(modeHeader?{'x-segeran-jiwa-mode':modeHeader}:{})});
  res.end(body);
});
server.listen(port,'127.0.0.1',()=>console.log(`Segeran Jiwa ${requested} preview${uat?' [UAT ISOLATED]':localQa?' [LOCAL QA]':''}: http://127.0.0.1:${port}`));
