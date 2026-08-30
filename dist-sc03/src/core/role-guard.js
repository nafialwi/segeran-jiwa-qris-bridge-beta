import { OPERATIONAL_CHILDREN, REPORT_CHILDREN, SETTINGS_CHILDREN } from '../app/route-contract.js';

export function normalizeRole(value){
  const role=String(value??'').trim().toLowerCase();
  if(role==='manajemen'||role==='owner') return 'owner';
  if(role==='transaksi'||role==='kasir'||role==='cashier') return 'cashier';
  return role||'cashier';
}

/** Read the v1.0.40 global lexical role without persisting any session data. */
export function createLegacyRoleReader(runtime=globalThis){
  if(typeof runtime?.__SC03_READ_ROLE==='function') return ()=>runtime.__SC03_READ_ROLE();
  return ()=>{
    try{
      // v1.0.40 declares currentUserRole with top-level `let`, so it is a
      // global lexical binding rather than a window property.
      return runtime?.Function
        ? runtime.Function('try{return typeof currentUserRole!=="undefined"?currentUserRole:null}catch(_){return null}')()
        : null;
    }catch(_){return null}
  };
}

export function createRoleGuard({readRole=()=>null,notify=()=>{}}={}){
  const currentRole=()=>normalizeRole(readRole());
  const isOwner=()=>currentRole()==='owner';
  function canAccessPrimary(route){return route!=='settings'||isOwner()}
  function canAccessOperational(id){
    const n=Number(id),meta=OPERATIONAL_CHILDREN[n];
    if(!meta||meta.status==='legacy-hidden') return false;
    return isOwner()||meta.cashier===true;
  }
  function canAccessReport(id){
    const n=Number(id),meta=REPORT_CHILDREN[n];
    if(!meta) return false;
    return isOwner()||meta.cashier===true;
  }
  function canAccessSettings(id){return !!SETTINGS_CHILDREN[Number(id)]&&isOwner()}
  function deny(message='Menu ini hanya dapat diakses Owner.'){
    notify(message,'error');
    return false;
  }
  return Object.freeze({currentRole,isOwner,canAccessPrimary,canAccessOperational,canAccessReport,canAccessSettings,deny});
}
