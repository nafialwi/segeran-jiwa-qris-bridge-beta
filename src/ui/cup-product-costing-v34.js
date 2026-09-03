import { CUP_CATALOG_V34, buildCupInventoryRowsV34, decorateRecipeWithCupV34 } from '../domain/packaging-cup-v34.js';
import { createInventoryRepository } from '../data/repositories/inventory-repository.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=v=>String(v??'').trim();
const upper=v=>text(v).toUpperCase();
const MARK='__sjV34CupRecipeDecoration';

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
function productFor(menu,id){return (menu||[]).find(x=>String(x?.id)===String(id))||null}
function categoryCode(menu,category){
  const values=(menu||[]).filter(x=>x&&x.archived!==true&&upper(x.c)===upper(category)).map(x=>text(x.cp).toLowerCase()).filter(Boolean);
  if(!values.length)return'';return values.every(x=>x===values[0])?values[0]:'';
}
function options(selected=''){
  return `<option value="">Per produk / tanpa cup</option>${CUP_CATALOG_V34.map(x=>`<option value="${x.code}" ${selected===x.code?'selected':''}>${esc(x.name)}</option>`).join('')}`;
}

export function renderCategoryCupMappingV34(categoryRows=[],menu=[],{readOnly=false}={}){
  const rows=(categoryRows||[]).map(category=>{const selected=categoryCode(menu,category);return `<article class="sj-v34-cat-cup-row"><div><b>${esc(category)}</b><small>Terapkan ke produk aktif; produk tetap bisa dioverride lewat Edit Produk.</small></div><select data-v34-cup-category="${esc(category)}" ${readOnly?'disabled aria-disabled="true"':''}>${options(selected)}</select><button type="button" data-v34-cup-category-apply="${esc(category)}" ${readOnly?'disabled aria-disabled="true"':''}>${readOnly?'🔒 READ ONLY':'Terapkan Cup'}</button></article>`}).join('');
  return `<section class="sj-v34-category-cup" data-v34-category-cup><div class="sj-v34-category-cup-head"><div><h4>Mapping Cup per Kategori</h4><p>Memakai field produk existing <code>cp</code>; tidak membuat schema mapping kedua.</p></div>${readOnly?'<em>LOCAL QA · READ ONLY</em>':''}</div><div class="sj-v34-category-cup-list">${rows||'<p>Belum ada kategori.</p>'}</div></section>`;
}

function syncCpSelect(select){
  if(!select)return false;const selected=String(select.value||'');select.innerHTML=options(selected);select.value=selected;return true;
}

export function installCupProductCostingV34(runtime=globalThis,{inventoryWorkspace=runtime?.__SJ_V32_INVENTORY_WORKSPACE,repository=createInventoryRepository({db:runtime?.firebase?.database?.()}),autoEnhance=true}={}){
  if(runtime?.__SJ_V34_CUP_PRODUCT_COSTING)return runtime.__SJ_V34_CUP_PRODUCT_COSTING;
  const inv=runtime?.SJInventoryV2,original=inv?.recipeForProduct;
  if(!inv||typeof original!=='function')return Object.freeze({installed:false,enhance(){return false}});
  let cachedCupRows=[];
  async function refresh(){try{const raw=await repository?.readInventoryV2?.();cachedCupRows=buildCupInventoryRowsV34(raw||{});return cachedCupRows}catch(_){return cachedCupRows}}
  const ready=refresh();
  if(!original?.[MARK]){
    function wrapped(productId,...args){
      const base=original.call(this,productId,...args),menu=menuRows(runtime),product=productFor(menu,productId),workspaceRows=inventoryWorkspace?.cupRows?.()||[],cupRows=workspaceRows.some(x=>x?.registered)?workspaceRows:cachedCupRows;
      return decorateRecipeWithCupV34(base||{},product||{},cupRows);
    }
    try{Object.defineProperty(wrapped,MARK,{value:true,enumerable:false})}catch(_){wrapped[MARK]=true}
    inv.recipeForProduct=wrapped;
  }
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
  const api=Object.freeze({installed:true,enhance,applyCategory,refresh,ready,readOnly});try{Object.defineProperty(runtime,'__SJ_V34_CUP_PRODUCT_COSTING',{value:api,writable:false,configurable:false})}catch(_){}
  if(autoEnhance)try{enhance()}catch(_){}return api;
}
