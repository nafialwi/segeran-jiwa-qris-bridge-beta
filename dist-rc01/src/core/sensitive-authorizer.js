import { POS_ROOT } from '../data/firebase-client.js';

const text=v=>String(v??'').trim();
const normalizeRole=value=>{
  const v=text(value).toLowerCase();
  if(v==='owner'||v==='manajemen')return'owner';
  if(v==='cashier'||v==='kasir'||v==='transaksi')return'cashier';
  return v||'cashier';
};

function defaultRequesterReader(runtime){
  return ()=>{
    try{
      if(!runtime?.Function)return{role:'cashier',id:'',name:''};
      return runtime.Function(`try{return {
        role: typeof currentUserRole!=="undefined"?currentUserRole:null,
        id: typeof currentLoginId!=="undefined"?currentLoginId:"",
        name: typeof currentUserName!=="undefined"?currentUserName:""
      }}catch(_){return {role:null,id:"",name:""}}`)();
    }catch(_){return{role:'cashier',id:'',name:''}}
  };
}

async function readUser(db,id){
  if(!db||typeof db.ref!=='function')throw new Error('SENSITIVE_AUTH_DB_REQUIRED');
  const snap=await db.ref(`${POS_ROOT}/global/users/${id}`).once('value');
  return snap&&typeof snap.val==='function'?snap.val():null;
}

function pinVerifier(runtime){
  if(typeof runtime?.sjVerifyPin==='function')return runtime.sjVerifyPin.bind(runtime);
  return async(id,pin,user)=>{
    try{
      const fn=runtime?.Function?.('try{return typeof sjVerifyPin==="function"?sjVerifyPin:null}catch(_){return null}')?.();
      if(typeof fn!=='function')throw new Error('OWNER_PIN_VERIFIER_UNAVAILABLE');
      return await fn(id,pin,user);
    }catch(error){
      if(error?.message==='OWNER_PIN_VERIFIER_UNAVAILABLE')throw error;
      throw new Error('OWNER_PIN_VERIFIER_UNAVAILABLE');
    }
  };
}

export function createLegacySensitiveAuthorizer({runtime=globalThis,db,readRequester=null,now=()=>Date.now()}={}){
  const requesterReader=readRequester??defaultRequesterReader(runtime);
  const verifyPin=pinVerifier(runtime);
  async function authorize({pin,ownerId=null}={}){
    const requester0=requesterReader?.()||{},requesterRole=normalizeRole(requester0.role),requesterId=text(requester0.id),requesterName=text(requester0.name);
    if(!requesterId)throw new Error('SENSITIVE_REQUESTER_REQUIRED');
    let approverId=text(ownerId);
    if(requesterRole==='owner'){
      if(approverId&&approverId!==requesterId)throw new Error('OWNER_SELF_REAUTH_REQUIRED');
      approverId=requesterId;
    }else{
      if(!approverId)throw new Error('OWNER_APPROVER_REQUIRED');
    }
    const owner=await readUser(db,approverId);
    if(!owner)throw new Error('OWNER_APPROVER_NOT_FOUND');
    if(owner.active===false)throw new Error('OWNER_APPROVER_INACTIVE');
    if(normalizeRole(owner.role)!=='owner')throw new Error('OWNER_APPROVER_ROLE_REQUIRED');
    const ok=await verifyPin(approverId,String(pin??''),owner);
    if(!ok)throw new Error('OWNER_REAUTH_FAILED');
    return Object.freeze({
      ok:true,
      role:'owner',
      ownerId:approverId,
      ownerName:text(owner.nama||owner.name||owner.displayName||requesterName||approverId),
      requesterId,
      requesterRole,
      reauthenticatedAt:Number(now())||Date.now()
    });
  }
  return Object.freeze({authorize});
}

export function assertFreshOwnerProof(proof,{now=()=>Date.now(),maxAgeMs=120000,requesterId=null}={}){
  if(!proof||proof.ok!==true||proof.role!=='owner'||!text(proof.ownerId))throw new Error('OWNER_REAUTH_REQUIRED');
  const age=(Number(now())||Date.now())-Number(proof.reauthenticatedAt||0);
  if(!Number.isFinite(age)||age<0||age>maxAgeMs)throw new Error('OWNER_REAUTH_EXPIRED');
  if(requesterId!=null&&text(proof.requesterId)!==text(requesterId))throw new Error('OWNER_REAUTH_REQUESTER_MISMATCH');
  return proof;
}
