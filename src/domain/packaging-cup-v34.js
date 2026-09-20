import { reconcileCupControlV1 } from './cup-control-v1.js';
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const text=v=>String(v??'').trim();
const upper=v=>text(v).toUpperCase();
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));

export const CUP_CATALOG_V34=Object.freeze([
  Object.freeze({code:'c10',name:'Cup 10 Oz',unit:'pcs',aliases:Object.freeze(['CUP 10 OZ','GELAS 10 OZ','CUP 10OZ','GELAS 10OZ'])}),
  Object.freeze({code:'c10p',name:'Cup Paper 10 Oz',unit:'pcs',categoryDefault:false,aliases:Object.freeze(['CUP PAPER 10 OZ','PAPER CUP 10 OZ','GELAS PAPER 10 OZ','CUP PAPER 10OZ','PAPER CUP 10OZ','GELAS PAPER 10OZ'])}),
  Object.freeze({code:'c16',name:'Cup 16 Oz',unit:'pcs',aliases:Object.freeze(['CUP 16 OZ','GELAS 16 OZ','CUP 16OZ','GELAS 16OZ'])}),
  Object.freeze({code:'c22p',name:'Cup 22 Oz Datar Polos',unit:'pcs',aliases:Object.freeze(['CUP 22 OZ DATAR POLOS','GELAS 22 OZ DATAR POLOS','CUP 22 DATAR POLOS','GELAS 22 DATAR POLOS','CUP 22 POLOS','GELAS 22 POLOS'])}),
  Object.freeze({code:'c22d',name:'Cup 22 Oz Datar',unit:'pcs',aliases:Object.freeze(['CUP 22 OZ DATAR','GELAS 22 OZ DATAR','CUP 22 DATAR','GELAS 22 DATAR'])}),
  Object.freeze({code:'c22o',name:'Cup 22 Oz Oval',unit:'pcs',aliases:Object.freeze(['CUP 22 OZ OVAL','GELAS 22 OZ OVAL','CUP 22 OVAL','GELAS 22 OVAL'])})
]);

const CODE_SET=new Set(CUP_CATALOG_V34.map(x=>x.code));
const normName=v=>upper(v).replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const rows=v=>Array.isArray(v)?v.filter(Boolean):v&&typeof v==='object'?Object.entries(v).filter(([,x])=>x!=null).map(([id,x])=>({...x,_key:x?._key??id})) : [];

export function cupSpecByCodeV34(code=''){
  return CUP_CATALOG_V34.find(x=>x.code===text(code).toLowerCase())||null;
}

export function isCupCodeV34(code=''){return CODE_SET.has(text(code).toLowerCase())}

export function isCupIngredientMasterV34(master={}){
  const direct=text(master.cpCode||master.cupCode||master.packagingCode).toLowerCase();
  if(isCupCodeV34(direct))return true;
  const n=normName(master.name||master.label);
  return CUP_CATALOG_V34.some(spec=>[spec.name,...spec.aliases].some(alias=>normName(alias)===n));
}

function matchingSpec(master={}){
  const direct=text(master.cpCode||master.cupCode||master.packagingCode).toLowerCase();
  if(isCupCodeV34(direct))return cupSpecByCodeV34(direct);
  const n=normName(master.name||master.label);
  return CUP_CATALOG_V34.find(spec=>[spec.name,...spec.aliases].some(alias=>normName(alias)===n))||null;
}

export function buildCupInventoryRowsV34(raw={}){
  const ingredients=rows(raw.ingredients);
  const balances=raw?.balances?.ingredients&&typeof raw.balances.ingredients==='object'?raw.balances.ingredients:{};
  const costs=raw?.costs?.ingredients&&typeof raw.costs.ingredients==='object'?raw.costs.ingredients:{};
  const matches=Object.create(null);
  for(const master of ingredients){
    if(master.archived===true||upper(master.status)==='ARCHIVED')continue;
    const spec=matchingSpec(master);if(spec&&!matches[spec.code])matches[spec.code]=master;
  }
  return Object.freeze(CUP_CATALOG_V34.map(spec=>{
    const master=matches[spec.code]||null;
    const ingredientId=master?text(master.id||master._key):'';
    const bal=ingredientId&&balances[ingredientId]?balances[ingredientId]:{};
    const cost=ingredientId&&costs[ingredientId]?costs[ingredientId]:{};
    const outletQty=num(bal.outlet??bal.gerai),warehouseQty=num(bal.warehouse??bal.gudang);
    const hasWac=cost.wac!==null&&cost.wac!==undefined&&cost.wac!==''&&Number.isFinite(Number(cost.wac));
    return Object.freeze({
      code:spec.code,name:spec.name,unit:'pcs',registered:!!master,ingredientId:ingredientId||null,
      master:master?Object.freeze({...master}):null,balance:Object.freeze({...bal}),cost:Object.freeze({...cost}),
      outletQty,warehouseQty,totalQty:outletQty+warehouseQty,wac:hasWac?num(cost.wac):null,
      costKnown:hasWac&&cost.source!==undefined&&cost.source!==null&&text(cost.source)!=='',costSource:text(cost.source)||null
    });
  }));
}

function txLines(tx={}){
  if(Array.isArray(tx.items)&&tx.items.length)return tx.items;
  if(Array.isArray(tx.cartData)&&tx.cartData.length)return tx.cartData;
  return [];
}
function productMap(menu=[]){
  const out=Object.create(null);for(const p of menu||[]){if(!p)continue;const id=text(p.id||p._key||p.productId);if(id)out[id]=p}return out;
}



export function validateCupInitialSetupV34(config={}){
  const out={};
  for(const spec of CUP_CATALOG_V34){
    const row=config?.[spec.code]||{},warehouseQty=Number(row.warehouseQty??0),outletQty=Number(row.outletQty??0),wac=Number(row.wac??0);
    if(!Number.isInteger(warehouseQty)||warehouseQty<0||!Number.isInteger(outletQty)||outletQty<0)throw Object.assign(new Error(`CUP_INITIAL_QTY_INVALID:${spec.code}`),{code:'CUP_INITIAL_QTY_INVALID'});
    if(!Number.isFinite(wac)||wac<0)throw Object.assign(new Error(`CUP_INITIAL_WAC_INVALID:${spec.code}`),{code:'CUP_INITIAL_WAC_INVALID'});
    const totalQty=warehouseQty+outletQty;if(totalQty>0&&wac<=0)throw Object.assign(new Error(`CUP_INITIAL_WAC_REQUIRED:${spec.code}`),{code:'CUP_INITIAL_WAC_REQUIRED'});
    out[spec.code]=Object.freeze({warehouseQty,outletQty,wac,totalQty});
  }
  return Object.freeze(out);
}

export function buildCupLocalSimulationRowsV34(config={}){
  const valid=validateCupInitialSetupV34(config);
  return Object.freeze(CUP_CATALOG_V34.map(spec=>{const v=valid[spec.code],ingredientId=`LOCAL_SIM_${spec.code}`;return Object.freeze({code:spec.code,name:spec.name,unit:'pcs',registered:true,simulated:true,ingredientId,master:Object.freeze({id:ingredientId,name:spec.name,unit:'pcs',category:'KEMASAN CUP',cpCode:spec.code,localSimulation:true}),balance:Object.freeze({warehouse:v.warehouseQty,outlet:v.outletQty}),cost:Object.freeze({wac:v.wac,source:'LOCAL_SIMULATION'}),warehouseQty:v.warehouseQty,outletQty:v.outletQty,totalQty:v.totalQty,wac:v.wac,costKnown:v.wac>0,costSource:'LOCAL_SIMULATION'} )}));
}

export function planCupInitialSetupV34(cupRows=[],config={}){
  const valid=validateCupInitialSetupV34(config),byCode=Object.fromEntries((cupRows||[]).map(x=>[x?.code,x]));
  const plan=CUP_CATALOG_V34.map(spec=>{const row=byCode[spec.code]||{},v=valid[spec.code],createMaster=!row.registered;return Object.freeze({code:spec.code,name:spec.name,createMaster,setInitialCost:v.wac>0,warehouseOpname:true,outletOpname:true,warehouseQty:v.warehouseQty,outletQty:v.outletQty,wac:v.wac,existingIngredientId:row.ingredientId||null})});
  return Object.freeze({rows:Object.freeze(plan),usesPurchaseWriter:false});
}

export function ensureCupLocalSimulationStoreV34(runtime=globalThis){
  if(runtime?.__SJ_P5_CUP_LOCAL_SIM_V34)return runtime.__SJ_P5_CUP_LOCAL_SIM_V34;
  const store={masterConfig:null,openingCounts:null,openingCapturedTs:0,inboundCounts:Object.fromEntries(CUP_CATALOG_V34.map(x=>[x.code,0]))};
  try{Object.defineProperty(runtime,'__SJ_P5_CUP_LOCAL_SIM_V34',{value:store,writable:false,configurable:false})}catch(_){return store}
  return store;
}

export function theoreticalCupUsageV34(transactions=[],menu=[]){
  const out=Object.fromEntries(CUP_CATALOG_V34.map(x=>[x.code,0]));
  const products=productMap(menu),seenTransactions=new Set();
  for(const tx of transactions||[]){
    const identity=text(tx?.id??tx?._key??tx?.transactionId??tx?.txId);
    if(identity){if(seenTransactions.has(identity))continue;seenTransactions.add(identity)}
    const status=upper(tx?.status);if(['VOID','VOIDED','CANCELLED','CANCELED'].includes(status))continue;
    const lines=txLines(tx||{});
    for(const line of lines){
      // Refund does not restore a disposable cup. A committed sale keeps its original
      // packaging usage; only a VOID/CANCELLED transaction is excluded above.
      const qty=Math.max(0,num(line?.q??line?.qty??line?.quantity));if(qty<=0)continue;
      let code=text(line?.cp).toLowerCase();
      if(!isCupCodeV34(code)){
        const id=text(line?.baseProductId||line?.productId||line?.id||line?._key),product=products[id];
        code=text(product?.cp).toLowerCase();
      }
      if(isCupCodeV34(code))out[code]+=qty;
    }
  }
  return Object.freeze(out);
}

export function cupInboundFromMovementsV34(){
  // Compatibility-only. Inventory V2 movements are no longer Cup Control authority.
  return Object.freeze(Object.fromEntries(CUP_CATALOG_V34.map(x=>[x.code,0])));
}

export function reconcileCupShiftV34({opening={},inbound={},closing={},theoretical={},reasons={},manualUsage={},waste={},adjustment={}}={}){
  return reconcileCupControlV1({catalog:CUP_CATALOG_V34,opening,restock:inbound,transactionUsage:theoretical,manualUsage,waste,adjustment,physical:closing,reasons,openingKnown:true});
}

export function reconcileCupClosingAuthorityV34({openingKnown=true,opening={},inbound={},closing={},theoretical={},reasons={},manualUsage={},waste={},adjustment={}}={}){
  return reconcileCupControlV1({catalog:CUP_CATALOG_V34,opening,restock:inbound,transactionUsage:theoretical,manualUsage,waste,adjustment,physical:closing,reasons,openingKnown:!!openingKnown});
}

export function buildCupOutletOpnameDraftsV34(){
  // Deprecated by CUP-CONTROL-V1. Physical closing is carried forward by Cup Control,
  // never translated into an Inventory V2 Opname draft.
  return Object.freeze([]);
}

export function decorateRecipeWithCupV34(recipe={},product={},cupRows=[]){
  const code=text(product?.cp).toLowerCase(),spec=cupSpecByCodeV34(code),out=clone(recipe)||{};
  if(!spec)return out;
  const legacy=(cupRows||[]).find(x=>x?.code===code)||null;
  // Keep packaging metadata for immutable costing/audit evidence only. Do not inject
  // the legacy Cup ingredient into recipe components; Inventory V2 must not consume Cup.
  out._packagingV34={
    code,name:spec.name,qtyPerSale:1,unit:'pcs',inventoryTracked:false,
    legacyIngredientId:legacy?.ingredientId||null,
    unitCost:legacy?.costKnown&&legacy?.wac!==null?num(legacy.wac):null,
    costKnown:legacy?.costKnown===true
  };
  return out;
}
