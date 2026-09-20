import { CUP_CATALOG_V34, buildCupInventoryRowsV34, cupSpecByCodeV34, isCupCodeV34 } from '../domain/packaging-cup-v34.js';
import { createInventoryRepository } from '../data/repositories/inventory-repository.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=v=>String(v??'').trim();
const upper=v=>text(v).toUpperCase();

function menuRows(runtime){
  try{
    if(Array.isArray(runtime?.cloudData?.global?.menu))return runtime.cloudData.global.menu;
    const out=runtime?.Function?runtime.Function('try{return typeof cloudData!=="undefined"?cloudData.global.menu:[]}catch(_){return []}')():[];
    return Array.isArray(out)?out:[];
  }catch(_){return[]}
}
function categories(runtime){
  try{
    if(Array.isArray(runtime?.cloudData?.global?.kategori))return runtime.cloudData.global.kategori;
    const out=runtime?.Function?runtime.Function('try{return typeof cloudData!=="undefined"?cloudData.global.kategori:[]}catch(_){return []}')():[];
    return Array.isArray(out)?out:[];
  }catch(_){return[]}
}
function categoryCode(menu,category){
  const values=(menu||[]).filter(x=>x&&x.archived!==true&&upper(x.c)===upper(category)).map(x=>text(x.cp).toLowerCase()).filter(Boolean);
  if(!values.length)return'';return values.every(x=>x===values[0])?values[0]:'';
}
function options(selected=''){
  const mapped=CUP_CATALOG_V34.filter(x=>x.saleMapping!==false);
  return `<option value="">Per produk / tanpa cup</option>${mapped.map(x=>`<option value="${x.code}" ${selected===x.code?'selected':''}>${esc(x.name)}</option>`).join('')}`;
}

// Expected operational usage only. Keys are Cup Control codes, never Inventory ingredient ids.
export function cupSaleConsumptionV34(cart=[]){
  const out=Object.fromEntries(CUP_CATALOG_V34.map(x=>[x.code,0]));
  for(const line of cart||[]){
    const code=text(line?.cp).toLowerCase(),qty=Math.max(0,Number(line?.q??line?.qty??line?.quantity)||0);
    if(!isCupCodeV34(code)||qty<=0)continue;
    out[code]+=qty;
  }
  return Object.freeze(out);
}

export function renderCategoryCupMappingV34(categoryRows=[],menu=[],{readOnly=false}={}){
  const rows=(categoryRows||[]).map(category=>{const selected=categoryCode(menu,category);return `<article class="sj-v34-cat-cup-row"><div><b>${esc(category)}</b><small>Terapkan ke produk aktif; produk tetap bisa dioverride lewat Edit Produk.</small></div><select data-v34-cup-category="${esc(category)}" ${readOnly?'disabled aria-disabled="true"':''}>${options(selected)}</select><button type="button" data-v34-cup-category-apply="${esc(category)}" ${readOnly?'disabled aria-disabled="true"':''}>${readOnly?'🔒 READ ONLY':'Terapkan Cup'}</button></article>`}).join('');
  return `<section class="sj-v34-category-cup" data-v34-category-cup><div class="sj-v34-category-cup-head"><div><h4>Mapping Cup per Kategori</h4><p>Field produk <code>cp</code> menentukan Expected Usage Cup Control. Mapping ini tidak mengurangi Inventory V2.</p></div>${readOnly?'<em>LOCAL QA · READ ONLY</em>':''}</div><div class="sj-v34-category-cup-list">${rows||'<p>Belum ada kategori.</p>'}</div></section>`;
}

function syncCpSelect(select){
  if(!select)return false;const selected=String(select.value||'');select.innerHTML=options(selected);select.value=selected;return true;
}

export function installCupProductCostingV34(runtime=globalThis,{repository=createInventoryRepository({db:runtime?.firebase?.database?.()}),autoEnhance=true}={}){
  if(runtime?.__SJ_V34_CUP_PRODUCT_COSTING)return runtime.__SJ_V34_CUP_PRODUCT_COSTING;
  // Product->Cup mapping remains useful even when Inventory V2 is unavailable. Cost is a
  // read-only compatibility reference and uses scoped master/cost reads only.
  let cachedCupRows=[];
  async function refresh(){
    try{
      const [ingredients,costs]=await Promise.all([
        repository?.readIngredientMasters?.(),repository?.readIngredientCosts?.()
      ]);
      cachedCupRows=buildCupInventoryRowsV34({ingredients:ingredients||{},costs:{ingredients:costs||{}}});
      return cachedCupRows;
    }catch(_){return cachedCupRows}
  }
  async function waitForAuthenticatedRuntime(){
    let mode='';try{mode=String(runtime?.SJProductionArchitectureP3?.authMode?.()||'').toUpperCase()}catch(_){}
    if(mode==='LEGACY')return true;
    let auth=null;try{auth=runtime?.firebase?.auth?.()}catch(_){}
    if(!auth||auth.currentUser||typeof auth.onAuthStateChanged!=='function')return true;
    return new Promise(resolve=>{let done=false,off=()=>{};const finish=value=>{if(done)return;done=true;try{off()}catch(_){}resolve(value)};try{off=auth.onAuthStateChanged(user=>{if(user)finish(true)},()=>finish(false))}catch(_){finish(false)}});
  }
  const ready=waitForAuthenticatedRuntime().then(ok=>ok?refresh():cachedCupRows).catch(()=>cachedCupRows);
  const saleUsage=cart=>cupSaleConsumptionV34(cart);
  const costForCode=code=>{
    const key=text(code).toLowerCase(),spec=cupSpecByCodeV34(key),row=cachedCupRows.find(x=>x?.code===key);
    return Object.freeze({code:key,name:spec?.name||key,known:row?.costKnown===true&&row?.wac!==null,unitCost:row?.costKnown===true&&row?.wac!==null?Number(row.wac):null,source:row?.costSource||null,inventoryTracked:false});
  };
  try{Object.defineProperty(runtime,'__SJ_V34_CUP_SALE_USAGE',{value:saleUsage,writable:false,configurable:false,enumerable:false})}catch(_){runtime.__SJ_V34_CUP_SALE_USAGE=saleUsage}
  try{Object.defineProperty(runtime,'__SJ_V34_CUP_COST_FOR_CODE',{value:costForCode,writable:false,configurable:false,enumerable:false})}catch(_){runtime.__SJ_V34_CUP_COST_FOR_CODE=costForCode}
  try{Object.defineProperty(runtime,'__SJ_V34_CUP_SALE_READY',{value:ready,writable:false,configurable:false,enumerable:false})}catch(_){runtime.__SJ_V34_CUP_SALE_READY=ready}

  const readOnly=runtime?.__SJ_LOCAL_QA_READ_ONLY===true,document=runtime?.document;
  async function applyCategory(category,code){
    if(readOnly)throw new Error('LOCAL_QA_READ_ONLY');if(!runtime?.SJHarden?.menuTransaction)throw new Error('MENU_TRANSACTION_AUTHORITY_REQUIRED');
    const cat=upper(category),cp=text(code).toLowerCase();
    return runtime.SJHarden.menuTransaction(arr=>(arr||[]).map(p=>p&&p.archived!==true&&upper(p.c)===cat?{...p,cp}:p),'P5_CUP_CATEGORY_TIMEOUT');
  }
  function enhance(){
    syncCpSelect(document?.getElementById?.('new-cp'));syncCpSelect(document?.getElementById?.('edit-m-cp'));
    const root=document?.getElementById?.('mst2');if(!root)return false;let panel=root.querySelector?.('[data-v34-category-cup]');const html=renderCategoryCupMappingV34(categories(runtime),menuRows(runtime),{readOnly});
    if(!panel){root.insertAdjacentHTML?.('beforeend',html);panel=root.querySelector?.('[data-v34-category-cup]')}else panel.outerHTML=html;
    panel=root.querySelector?.('[data-v34-category-cup]');if(panel&&panel.dataset.v34Bound!=='true'){panel.dataset.v34Bound='true';panel.addEventListener?.('click',async event=>{const btn=event.target?.closest?.('[data-v34-cup-category-apply]');if(!btn)return;const category=btn.dataset.v34CupCategoryApply,select=panel.querySelector?.(`[data-v34-cup-category="${String(category).replace(/"/g,'\\"')}"]`);btn.disabled=true;try{await applyCategory(category,select?.value||'');runtime?.showToast?.(`Mapping cup kategori ${category} diperbarui.`,'success')}catch(e){runtime?.alert?.(e?.message||'Mapping cup belum dapat disimpan.')}finally{if(btn.isConnected)btn.disabled=readOnly}})}
    return true;
  }
  const api=Object.freeze({installed:true,enhance,applyCategory,refresh,ready,costForCode,usage:saleUsage,cupRows:()=>cachedCupRows.slice(),readOnly,inventoryTracked:false});
  try{Object.defineProperty(runtime,'__SJ_V34_CUP_PRODUCT_COSTING',{value:api,writable:false,configurable:false})}catch(_){}
  if(autoEnhance)try{enhance()}catch(_){}return api;
}
