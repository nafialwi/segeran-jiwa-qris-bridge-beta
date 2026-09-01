import { renderIcon } from './icons.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function sortProductsByDisplayOrder(rows=[],harden=null){
  return rows.map((p,i)=>({p,i,order:harden?.orderValue?harden.orderValue(p,i):(Number(p?.displayOrder)>0?Number(p.displayOrder):(i+1)*10)}))
    .sort((a,b)=>a.order-b.order||String(a.p?.n||'').localeCompare(String(b.p?.n||''),'id')).map(x=>x.p);
}

export function quantityControlMarkup({id,name='Produk',qty=0}={}){
  id=esc(id);name=esc(name);qty=Math.max(0,Math.round(Number(qty)||0));
  if(qty<=0)return `<button class="sjvc01-add" data-add="${id}" aria-label="Tambah ${name}">+</button>`;
  return `<div class="sj-v27-card-step" data-sj-v27-step="true"><button type="button" data-card-delta="-1" aria-label="Kurangi ${name}">−</button><b>${qty}</b><button type="button" data-card-delta="1" aria-label="Tambah ${name}">+</button></div>`;
}

export function installProductionSalesStability(runtime=globalThis){
  if(runtime?.__SJ_V27_PRODUCTION_SALES)return runtime.__SJ_V27_PRODUCTION_SALES;
  const sales=runtime?.SJRefinementSalesV100,compat=runtime?.SJRef01ProductionSalesCompat,final=runtime?.SJFinalRefinementVC01A;
  if(!sales||!compat)return Object.freeze({installed:false});
  const baseAdjust=runtime?.SJCommercialFinalV5961?.adjustCart?.bind(runtime.SJCommercialFinalV5961)||null;
  sales.activeProducts=()=>sortProductsByDisplayOrder(compat.activeProducts?.()||[],runtime?.SJHarden);
  if(final&&typeof final.productCard==='function'){
    const baseCard=final.productCard.bind(final);
    final.productCard=function(product){
      const html=baseCard(product),qty=compat.productQty?.(product?.id)||0;if(qty<=0)return html;
      return html.replace(/<button class="sjvc01-add"[^>]*data-add="[^"]+"[^>]*>\+<\/button>/,quantityControlMarkup({id:product?.id,name:product?.n,qty}));
    };
  }
  if(runtime?.SJCommercialFinalV5961&&baseAdjust){
    runtime.SJCommercialFinalV5961.adjustCart=function(id,delta){if(compat.hasNormalCartLine?.(id))return compat.adjustNormalProduct?.(id,delta);return baseAdjust(id,delta)};
  }
  const baseRender=sales.renderSales?.bind(sales);
  if(baseRender){sales.renderSales=function(...args){
    const out=baseRender(...args),root=runtime?.document?.getElementById?.('kasir-scroll');
    root?.querySelectorAll?.('.sjvc01-product[data-pid]')?.forEach?.(card=>{
      const id=String(card?.dataset?.pid||''),outOfStock=card?.dataset?.out==='1';if(!id||outOfStock)return;
      card.onclick=event=>{if(event?.target?.closest?.('button'))return;event?.preventDefault?.();compat.addNormalProduct?.(id)};
      card.querySelectorAll?.('[data-add]')?.forEach?.(button=>{button.onclick=event=>{event?.preventDefault?.();event?.stopPropagation?.();compat.addNormalProduct?.(String(button?.dataset?.add||id));runtime?.setTimeout?.(()=>sales.renderSales(),0)}});
    });
    root?.querySelectorAll?.('[data-sj-v27-step]')?.forEach?.(step=>{step.querySelectorAll?.('[data-card-delta]')?.forEach?.(button=>{button.onclick=event=>{event?.preventDefault?.();event?.stopPropagation?.();const card=button.closest?.('[data-pid]'),id=card?.dataset?.pid,delta=Number(button.dataset.cardDelta)||0;if(!id)return;if(delta>0&&compat.productQty?.(id)<=0)compat.addNormalProduct?.(id);else compat.adjustNormalProduct?.(id,delta);runtime?.setTimeout?.(()=>sales.renderSales(),0)}})});
    return out
  };}
  const api=Object.freeze({installed:true,sortProducts:rows=>sortProductsByDisplayOrder(rows,runtime?.SJHarden)});try{Object.defineProperty(runtime,'__SJ_V27_PRODUCTION_SALES',{value:api,writable:false,configurable:false})}catch(_){}return api;
}

const HEADER_SELECTORS=['.sjvc01-tools','.sjvc01-status','.sjvc02-head','.sjvc02-child-head','.sjr06-report-head','.sjr01-settings-header','.sj-rep0-detail-heading'];
export function installManualSyncControls(runtime=globalThis){
  if(runtime?.__SJ_V27_MANUAL_SYNC)return runtime.__SJ_V27_MANUAL_SYNC;
  const document=runtime?.document,compat=runtime?.SJRef01ProductionSalesCompat;if(!document||!compat)return Object.freeze({installed:false,enhance:()=>0});
  let busy=false;
  async function run(button){if(busy)return false;busy=true;button&&(button.disabled=true,button.classList?.add?.('is-busy'));try{const result=await compat.refreshNow?.();if(result?.ok){runtime?.showToast?.('Database disegarkan.','success');return true}runtime?.showToast?.('Sinkronisasi belum berhasil. Data lokal tetap aman.','warning');return false}catch(_){runtime?.showToast?.('Sinkronisasi belum berhasil. Data lokal tetap aman.','warning');return false}finally{busy=false;button&&(button.disabled=false,button.classList?.remove?.('is-busy'))}}
  function enhance(){let count=0;for(const selector of HEADER_SELECTORS){for(const host of Array.from(document.querySelectorAll?.(selector)||[])){if(host.querySelector?.('[data-sj-manual-sync]'))continue;const button=document.createElement?.('button');if(!button)continue;button.type='button';button.className='sj-v27-sync';button.dataset.sjManualSync='true';button.setAttribute?.('aria-label','Segarkan database');button.innerHTML=`${renderIcon('refresh',{size:18})}<span>Refresh</span>`;button.addEventListener?.('click',event=>{event?.preventDefault?.();event?.stopPropagation?.();run(button)});host.appendChild?.(button);count++}}return count}
  const api=Object.freeze({installed:true,enhance,run});try{Object.defineProperty(runtime,'__SJ_V27_MANUAL_SYNC',{value:api,writable:false,configurable:false})}catch(_){}return api;
}
