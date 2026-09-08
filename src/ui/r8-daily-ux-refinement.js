const MARK='__sjR8DailyUxToastWrapper';
const CASHIER_ROLES=new Set(['cashier','transaksi','kasir']);

function esc(value){
  return String(value??'').replace(/[&<>"']/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));
}

function number(value){const n=Number(value);return Number.isFinite(n)?n:0}
function normalizedRole(value){return String(value??'').trim().toLowerCase()}
function isCashierRole(value){return CASHIER_ROLES.has(normalizedRole(value))}

export function shouldSuppressTransactionSuccessToast({message='',kind='',receiptVisible=false}={}){
  if(!receiptVisible||String(kind||'').toLowerCase()!=='success')return false;
  return /^Transaksi\s+\S.+\s+berhasil\.$/i.test(String(message||'').trim());
}

export function cupOutletStatusR8(row={}){
  if(row?.registered!==true)return Object.freeze({code:'UNCONFIGURED',label:'Belum dikonfigurasi'});
  const qty=Math.max(0,number(row?.outletQty));
  if(qty<=0)return Object.freeze({code:'OUT',label:'Habis'});
  const master=row?.master||{};
  const warning=Math.max(0,number(master.warningOutlet??master.minOutlet??master.minimumOutlet??master.minStock));
  if(warning>0&&qty<=warning)return Object.freeze({code:'LOW',label:'Menipis'});
  return Object.freeze({code:'SAFE',label:'Aman'});
}

function badgeClass(status){return status?.code==='OUT'?'danger':status?.code==='LOW'?'warn':''}

export function renderCashierCupStockSection(cupRows=[]){
  const rows=Array.isArray(cupRows)?cupRows:[];
  const body=rows.map(row=>{
    const status=cupOutletStatusR8(row),configured=row?.registered===true;
    const qty=configured?`${Math.max(0,number(row?.outletQty))} pcs`:'—';
    const detail=configured?'Stok fisik Gerai · read-only':'Master cup belum tersedia di Inventory V2';
    return `<div class="sjvc02-stock-row" data-r8-cup-code="${esc(row?.code||'')}"><div class="sjvc02-stock-thumb" aria-hidden="true">🥤</div><div class="sjvc02-stock-copy"><b>${esc(row?.name||'Cup')}</b><small>${esc(detail)}</small></div><div class="sjvc02-stock-right"><strong>${esc(qty)}</strong><br><span class="sjvc02-badge ${badgeClass(status)}">${esc(status.label)}</span></div></div>`;
  }).join('');
  return `<section data-r8-cashier-cups><div class="sjvc02-section-title"><h2>Cup &amp; Kemasan</h2><small>Stok Gerai</small></div><div class="sjvc02-stock-list">${body||'<div class="sjvc02-empty">Data cup belum tersedia. Tidak ada stok yang diasumsikan.</div>'}</div><aside class="sjvc02-tip" style="margin-top:10px"><span class="ico">i</span><div><b>Informasi operasional</b><span>Kasir dapat melihat stok fisik cup di Gerai. Penyesuaian dan pengelolaan Gudang tetap melalui Owner.</span></div></aside></section>`;
}

export function cashierStockActionPolicy(){
  return Object.freeze({keepLabels:['Restock','Riwayat'],hideLabels:['Penyesuaian','Gudang']});
}

function receiptVisible(document){
  try{
    const overlay=document?.getElementById?.('modal-struk-fs');
    if(!overlay)return false;
    if(overlay.style?.display==='none')return false;
    return overlay.style?.display==='flex'||overlay.style?.display==='block'||!!overlay.querySelector?.('.sjvc011-success');
  }catch(_){return false}
}

function actionLabel(button){return String(button?.textContent||'').replace(/\s+/g,' ').trim()}

export function refineCashierStockSurface(document,{role=null,cupRows=[]}={}){
  const stock=document?.querySelector?.('.sjvc02-page.sjvc02-stock');
  if(!stock)return Object.freeze({applied:false,cups:0,hiddenActions:0});
  const policy=cashierStockActionPolicy(),cashier=isCashierRole(role);
  let hiddenActions=0;
  for(const button of Array.from(stock.querySelectorAll?.('.sjvc02-stock-actions button')||[])){
    const label=actionLabel(button),owned=button?.dataset?.r8OwnerOnly==='true';
    if(cashier&&policy.hideLabels.includes(label)){
      button.hidden=true;button.style.display='none';button.dataset.r8OwnerOnly='true';button.setAttribute?.('aria-hidden','true');hiddenActions++;
    }else if(!cashier&&owned){
      button.hidden=false;button.style.display='';delete button.dataset.r8OwnerOnly;button.removeAttribute?.('aria-hidden');
    }
  }
  const existing=stock.querySelector?.('[data-r8-cashier-cups]');
  if(!cashier){if(existing)existing.style.display='none';return Object.freeze({applied:true,cups:0,hiddenActions})}
  const markup=renderCashierCupStockSection(cupRows);
  if(existing){
    const holder=document.createElement?.('div');if(holder){holder.innerHTML=markup;const fresh=holder.firstElementChild;if(fresh)existing.replaceWith?.(fresh)}
  }else{
    const actions=stock.querySelector?.('.sjvc02-stock-actions');
    actions?.insertAdjacentHTML?.('beforebegin',markup);
  }
  return Object.freeze({applied:true,cups:Array.isArray(cupRows)?cupRows.length:0,hiddenActions});
}

export function installR8DailyUxRefinement(runtime=globalThis,{readRole=()=>null,readCupRows=()=>[]}={}){
  if(runtime?.__SJ_R8_DAILY_UX)return runtime.__SJ_R8_DAILY_UX;
  const document=runtime?.document??null;
  const baseToast=runtime?.showToast;
  if(typeof baseToast==='function'&&baseToast?.[MARK]!==true){
    function wrappedToast(message,kind,...rest){
      if(shouldSuppressTransactionSuccessToast({message,kind,receiptVisible:receiptVisible(document)}))return false;
      return baseToast.call(this,message,kind,...rest);
    }
    try{Object.defineProperty(wrappedToast,MARK,{value:true,enumerable:false})}catch(_){wrappedToast[MARK]=true}
    runtime.showToast=wrappedToast;
  }
  const api=Object.freeze({
    installed:true,
    enhance(){
      const role=readRole?.();
      if(!isCashierRole(role))return refineCashierStockSurface(document,{role,cupRows:[]});
      let cupRows=[];try{cupRows=readCupRows?.()||[]}catch(_){cupRows=[]}
      return refineCashierStockSurface(document,{role,cupRows:Array.isArray(cupRows)?cupRows:[]});
    },
    snapshot:()=>Object.freeze({installed:true,role:normalizedRole(readRole?.())})
  });
  try{Object.defineProperty(runtime,'__SJ_R8_DAILY_UX',{value:api,writable:false,configurable:false,enumerable:false})}catch(_){}
  return api;
}
