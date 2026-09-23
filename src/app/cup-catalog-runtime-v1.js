import {
  activeCupCatalogV1,
  effectiveCupCatalogV1,
  normalizeCupCatalogSettingsV1,
  operationalCupCatalogV1
} from '../domain/cup-catalog-v1.js';
import { createCupCatalogWriter } from '../data/writers/cup-catalog-writer.js';

const text=v=>String(v??'').trim();
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));

function initialSettings(runtime){
  try{
    const value=runtime?.cloudData?.global?.settings?.cupCatalogV1;
    if(value&&typeof value==='object')return value;
  }catch(_){}
  try{
    const value=runtime?.Function?.('try{return typeof cloudData!=="undefined"?cloudData.global.settings?.cupCatalogV1:null}catch(_){return null}')?.();
    if(value&&typeof value==='object')return value;
  }catch(_){}
  return {};
}

function menuRows(runtime){
  try{
    if(Array.isArray(runtime?.cloudData?.global?.menu))return runtime.cloudData.global.menu;
    const value=runtime?.Function?.('try{return typeof cloudData!=="undefined"?cloudData.global.menu:[]}catch(_){return []}')?.();
    return Array.isArray(value)?value:[];
  }catch(_){return[]}
}

function syncCloudMirror(runtime,value){
  try{
    if(runtime?.cloudData?.global?.settings){
      runtime.cloudData.global.settings.cupCatalogV1=clone(value);
    }
  }catch(_){}
  try{
    runtime?.Function?.('value','try{if(typeof cloudData!=="undefined"){cloudData.global.settings=cloudData.global.settings||{};cloudData.global.settings.cupCatalogV1=value}}catch(_){}')?.(clone(value));
  }catch(_){}
}

export function installCupCatalogRuntimeV1(runtime=globalThis,{
  readRole=()=>null,
  readActorId=()=>null
}={}){
  if(runtime?.__SJ_CUP_CATALOG_V1)return runtime.__SJ_CUP_CATALOG_V1;
  const readOnly=runtime?.__SJ_LOCAL_QA_READ_ONLY===true;
  const db=runtime?.firebase?.database?.();
  const writer=db?createCupCatalogWriter({db}):null;
  let settings=normalizeCupCatalogSettingsV1(initialSettings(runtime));
  let revision=0;

  const actor=()=>({
    id:text(readActorId?.())||text(runtime?.firebase?.auth?.()?.currentUser?.uid)||'owner',
    role:text(readRole?.())||'owner'
  });
  const catalog=(options={})=>effectiveCupCatalogV1(settings,options);
  const activeCatalog=()=>activeCupCatalogV1(settings);
  const operationalCatalog=({carryCounts={},menu=menuRows(runtime)}={})=>
    operationalCupCatalogV1(settings,{carryCounts,menu});
  const productUsage=code=>{
    const key=text(code).toLowerCase();
    return menuRows(runtime).filter(row=>row&&row.archived!==true&&text(row.cp).toLowerCase()===key).length;
  };
  const emit=()=>{
    revision++;
    try{
      const EventCtor=runtime?.CustomEvent;
      if(EventCtor&&runtime?.document?.dispatchEvent){
        runtime.document.dispatchEvent(new EventCtor('sj:cup-catalog-changed',{detail:{revision}}));
      }
    }catch(_){}
  };
  const accept=next=>{
    settings=normalizeCupCatalogSettingsV1(next);
    syncCloudMirror(runtime,settings);
    emit();
    return catalog();
  };

  async function refresh(){
    if(!writer)return catalog();
    try{return accept(await writer.read())}catch(_){return catalog()}
  }
  async function saveItem(item){
    if(readOnly)throw Object.assign(new Error('LOCAL_QA_READ_ONLY'),{code:'LOCAL_QA_READ_ONLY'});
    if(!writer)throw Object.assign(new Error('CUP_CATALOG_WRITER_UNAVAILABLE'),{code:'CUP_CATALOG_WRITER_UNAVAILABLE'});
    return accept(await writer.saveItem({item,actor:actor()}));
  }
  async function setActive(code,active){
    if(readOnly)throw Object.assign(new Error('LOCAL_QA_READ_ONLY'),{code:'LOCAL_QA_READ_ONLY'});
    if(!writer)throw Object.assign(new Error('CUP_CATALOG_WRITER_UNAVAILABLE'),{code:'CUP_CATALOG_WRITER_UNAVAILABLE'});
    if(active===false&&productUsage(code)>0){
      throw Object.assign(new Error('CUP_CATALOG_STILL_MAPPED'),{code:'CUP_CATALOG_STILL_MAPPED'});
    }
    return accept(await writer.setActive({code,active,actor:actor()}));
  }

  const ready=Promise.resolve().then(refresh).catch(()=>catalog());
  const api=Object.freeze({
    installed:true,
    readOnly,
    ready,
    refresh,
    catalog,
    activeCatalog,
    operationalCatalog,
    settings:()=>settings,
    revision:()=>revision,
    productUsage,
    saveItem,
    setActive
  });
  try{Object.defineProperty(runtime,'__SJ_CUP_CATALOG_V1',{value:api,writable:false,configurable:false})}catch(_){}
  return api;
}
