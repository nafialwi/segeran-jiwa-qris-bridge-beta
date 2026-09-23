import { posPath } from '../firebase-client.js';
import {
  normalizeCupCatalogSettingsV1,
  setCupCatalogActiveV1,
  upsertCupCatalogSettingsV1
} from '../../domain/cup-catalog-v1.js';

const text=v=>String(v??'').trim();
const roleOf=actor=>text(actor?.role).toLowerCase();
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const cupCatalogPath=()=>posPath('global','settings','cupCatalogV1');

function fail(code,detail=''){
  const error=new Error(detail?code+':'+detail:code);
  error.code=code;
  if(detail)error.detail=detail;
  throw error;
}
function assertOwner(actor){
  const role=roleOf(actor);
  if(role!=='owner'&&role!=='manajemen')fail('CUP_CATALOG_OWNER_REQUIRED');
}

export function createCupCatalogWriter({db,now=()=>Date.now()}={}){
  if(!db||typeof db.ref!=='function')fail('CUP_CATALOG_WRITE_CLIENT_REQUIRED');

  async function read(){
    const snap=await db.ref(cupCatalogPath()).once('value');
    return normalizeCupCatalogSettingsV1(typeof snap?.val==='function'?snap.val():{});
  }

  async function saveItem({item,actor={}}={}){
    assertOwner(actor);
    let next=null;
    const result=await db.ref(cupCatalogPath()).transaction(current=>{
      next=upsertCupCatalogSettingsV1(current||{},item||{},actor,now);
      return clone(next);
    });
    if(!result?.committed)fail('CUP_CATALOG_WRITE_ABORTED');
    return normalizeCupCatalogSettingsV1(
      typeof result?.snapshot?.val==='function'?result.snapshot.val():next
    );
  }

  async function setActive({code,active,actor={}}={}){
    assertOwner(actor);
    let next=null;
    const result=await db.ref(cupCatalogPath()).transaction(current=>{
      next=setCupCatalogActiveV1(current||{},code,!!active,actor,now);
      return clone(next);
    });
    if(!result?.committed)fail('CUP_CATALOG_WRITE_ABORTED');
    return normalizeCupCatalogSettingsV1(
      typeof result?.snapshot?.val==='function'?result.snapshot.val():next
    );
  }

  return Object.freeze({
    path:cupCatalogPath(),
    read,
    saveItem,
    setActive
  });
}
