import { CUP_CATALOG_V34 } from './packaging-cup-v34.js';

const text=v=>String(v??'').trim();
const lower=v=>text(v).toLowerCase();
const upper=v=>text(v).toUpperCase();
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const CODE_RE=/^[a-z][a-z0-9_-]{1,23}$/;

export const CUP_CATALOG_SETTINGS_VERSION='CUP-CATALOG-V1';

function fail(code,detail=''){
  const error=new Error(detail?code+':'+detail:code);
  error.code=code;
  if(detail)error.detail=detail;
  throw error;
}

function normalizeAliases(value=[]){
  const seen=new Set(),out=[];
  for(const raw of Array.isArray(value)?value:[]){
    const alias=text(raw);
    if(!alias)continue;
    const key=upper(alias);
    if(seen.has(key))continue;
    seen.add(key);out.push(alias);
  }
  return out.slice(0,16);
}

export function normalizeCupCatalogCodeV1(value=''){
  const code=lower(value);
  if(!CODE_RE.test(code))fail('CUP_CATALOG_CODE_INVALID',code||'empty');
  return code;
}

export function normalizeCupCatalogSettingsV1(raw={}){
  const input=raw&&typeof raw==='object'?raw:{};
  const src=input.items&&typeof input.items==='object'?input.items:{};
  const items={};
  for(const [rawCode,row0] of Object.entries(src)){
    const row=row0&&typeof row0==='object'?row0:{};
    let code;
    try{code=normalizeCupCatalogCodeV1(row.code||rawCode)}catch(_){continue}
    const name=text(row.name);
    if(!name)continue;
    items[code]={
      code,
      name:name.slice(0,64),
      unit:'pcs',
      active:row.active!==false,
      categoryDefault:row.categoryDefault!==false,
      aliases:normalizeAliases(row.aliases),
      createdAt:Number(row.createdAt)||0,
      createdBy:text(row.createdBy),
      updatedAt:Number(row.updatedAt)||0,
      updatedBy:text(row.updatedBy)
    };
  }
  return Object.freeze({
    version:CUP_CATALOG_SETTINGS_VERSION,
    schemaVersion:1,
    items:Object.freeze(items)
  });
}

function builtinMap(){
  const out={};
  CUP_CATALOG_V34.forEach((row,index)=>{
    out[row.code]={
      code:row.code,
      name:row.name,
      unit:'pcs',
      aliases:[...(row.aliases||[])],
      categoryDefault:row.categoryDefault!==false,
      active:true,
      builtin:true,
      sort:index*10
    };
  });
  return out;
}

export function effectiveCupCatalogV1(raw={}, {includeInactive=true}={}){
  const settings=normalizeCupCatalogSettingsV1(raw);
  const byCode=builtinMap();
  let nextSort=CUP_CATALOG_V34.length*10;
  for(const [code,row] of Object.entries(settings.items)){
    const base=byCode[code];
    byCode[code]={
      ...(base||{
        code,
        unit:'pcs',
        aliases:[],
        categoryDefault:true,
        builtin:false,
        sort:nextSort++
      }),
      name:row.name,
      unit:'pcs',
      aliases:normalizeAliases([...(base?.aliases||[]),...(row.aliases||[])]),
      categoryDefault:row.categoryDefault!==false,
      active:row.active!==false,
      builtin:!!base
    };
  }
  return Object.freeze(
    Object.values(byCode)
      .filter(row=>includeInactive||row.active!==false)
      .sort((a,b)=>Number(a.sort||0)-Number(b.sort||0)||a.name.localeCompare(b.name))
      .map(row=>Object.freeze({...row,aliases:Object.freeze([...(row.aliases||[])])}))
  );
}

export function activeCupCatalogV1(raw={}){
  return effectiveCupCatalogV1(raw,{includeInactive:false});
}

export function cupCatalogSpecV1(raw={},code=''){
  const key=lower(code);
  return effectiveCupCatalogV1(raw,{includeInactive:true}).find(row=>row.code===key)||null;
}

export function operationalCupCatalogV1(raw={}, {menu=[],carryCounts={}}={}){
  const all=effectiveCupCatalogV1(raw,{includeInactive:true});
  const mapped=new Set((Array.isArray(menu)?menu:[])
    .filter(row=>row&&row.archived!==true&&upper(row.status)!=='ARCHIVED')
    .map(row=>lower(row.cp)).filter(Boolean));
  return Object.freeze(all.filter(row=>
    row.active!==false||
    mapped.has(row.code)||
    Number(carryCounts?.[row.code]||0)>0
  ));
}

export function upsertCupCatalogSettingsV1(raw={},input={},actor={},now=Date.now()){
  const current=normalizeCupCatalogSettingsV1(raw);
  const originalCode=lower(input.originalCode||input.code);
  const code=normalizeCupCatalogCodeV1(input.code||input.originalCode);
  if(originalCode&&originalCode!==code)fail('CUP_CATALOG_CODE_IMMUTABLE',originalCode+'->'+code);
  const name=text(input.name);
  if(name.length<2||name.length>64)fail('CUP_CATALOG_NAME_INVALID');
  const effective=effectiveCupCatalogV1(current,{includeInactive:true});
  const duplicate=effective.find(row=>row.code!==code&&upper(row.name)===upper(name));
  if(duplicate)fail('CUP_CATALOG_NAME_DUPLICATE',duplicate.code);
  const prev=current.items[code]||{};
  const ts=Number(typeof now==='function'?now():now)||Date.now();
  const actorId=text(actor?.id||actor?.username);
  const next=clone(current);
  next.items=clone(current.items)||{};
  next.items[code]={
    code,
    name,
    unit:'pcs',
    active:input.active!==false,
    categoryDefault:input.categoryDefault!==false,
    aliases:normalizeAliases(input.aliases??prev.aliases??[]),
    createdAt:Number(prev.createdAt)||ts,
    createdBy:text(prev.createdBy)||actorId,
    updatedAt:ts,
    updatedBy:actorId
  };
  return normalizeCupCatalogSettingsV1(next);
}

export function setCupCatalogActiveV1(raw={},code='',active=true,actor={},now=Date.now()){
  const key=normalizeCupCatalogCodeV1(code);
  const existing=cupCatalogSpecV1(raw,key);
  if(!existing)fail('CUP_CATALOG_NOT_FOUND',key);
  return upsertCupCatalogSettingsV1(raw,{
    originalCode:key,
    code:key,
    name:existing.name,
    active:!!active,
    categoryDefault:existing.categoryDefault!==false,
    aliases:existing.aliases||[]
  },actor,now);
}
