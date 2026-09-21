import fs from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

export const UAT_PROJECT_ID='demo-segeran-jiwa-uat';
export const UAT_DATABASE_NAMESPACE='demo-segeran-jiwa-uat-default-rtdb';
export const UAT_DATABASE_ORIGIN='http://127.0.0.1:9001';
export const UAT_DATABASE_URL=`${UAT_DATABASE_ORIGIN}/.json?ns=${encodeURIComponent(UAT_DATABASE_NAMESPACE)}`;

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const SEED_PATH=join(ROOT,'firebase','uat','seed.json');

export function readUatSeed(){
  return JSON.parse(fs.readFileSync(SEED_PATH,'utf8'));
}

export async function waitForUatDatabase({timeoutMs=90000,intervalMs=250}={}){
  const deadline=Date.now()+Math.max(1000,Number(timeoutMs)||90000);
  let lastError=null;
  while(Date.now()<deadline){
    try{
      const response=await fetch(UAT_DATABASE_URL,{method:'GET'});
      if(response.ok)return true;
      lastError=new Error(`UAT_DATABASE_HTTP_${response.status}`);
    }catch(error){lastError=error}
    await new Promise(resolve=>setTimeout(resolve,Math.max(50,Number(intervalMs)||250)));
  }
  throw Object.assign(new Error('UAT_DATABASE_EMULATOR_NOT_READY'),{cause:lastError});
}

export async function resetUatDatabase(){
  if(!UAT_PROJECT_ID.startsWith('demo-'))throw new Error('UAT_DEMO_PROJECT_REQUIRED');
  const seed=readUatSeed();
  const response=await fetch(UAT_DATABASE_URL,{
    method:'PUT',
    headers:{'content-type':'application/json'},
    body:JSON.stringify(seed)
  });
  if(!response.ok)throw new Error(`UAT_SEED_WRITE_FAILED:${response.status}`);
  const verifyUrl=`${UAT_DATABASE_ORIGIN}/toko_segeranjiwa_v58/global/users/owneruat.json?ns=${encodeURIComponent(UAT_DATABASE_NAMESPACE)}`;
  const verify=await fetch(verifyUrl);
  if(!verify.ok)throw new Error(`UAT_SEED_VERIFY_FAILED:${verify.status}`);
  const owner=await verify.json();
  if(owner?.role!=='manajemen')throw new Error('UAT_SEED_OWNER_VERIFY_FAILED');
  return seed;
}
