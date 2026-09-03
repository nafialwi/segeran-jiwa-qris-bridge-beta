import {renderIcon} from './icons.js';

const text=node=>String(node?.textContent||'').replace(/\s+/g,' ').trim();
export function operationalGroupForLabel(label=''){
  const v=String(label||'').trim().toLowerCase();
  if(/stok barang jadi|bahan\s*&\s*gudang|restock/.test(v))return 'stock';
  if(/^shift$|catatan shift/.test(v))return 'shift';
  if(/pengeluaran|refund|retur|kasbon/.test(v))return 'finance';
  return 'other';
}
function activityLabel(card){return text(card?.querySelector?.('b')||card)}
export function isOwnerOperationalRole(role){return role==='owner'||role==='manajemen'}

function ensureMaterialsShortcut(document,runtime,role,activities){
  if(!isOwnerOperationalRole(role)||!activities||activities.querySelector?.('[data-sj-v31-materials]'))return false;
  if(typeof document?.createElement!=='function')return false;
  const button=document.createElement('button');button.type='button';button.className='sjvc02-activity sj-v31-materials-entry';button.dataset.sjV31Materials='true';
  button.innerHTML=`<span class="ico">${renderIcon('inventory',{size:21,label:'Bahan dan Gudang'})}</span><b>Bahan &amp; Gudang</b><span>Stok bahan, resep &amp; gudang</span>`;
  button.addEventListener?.('click',()=>{try{const v3=runtime?.__SJ_V32_INVENTORY_WORKSPACE;if(v3?.open)return v3.open?.('summary');runtime?.showToast?.('Bahan & Gudang V3 belum siap. Coba buka kembali sesaat lagi.','warning')}catch(_){}});
  const stock=activities.querySelector?.('[data-sj-finished-warehouse]');
  if(stock?.nextSibling)activities.insertBefore?.(button,stock.nextSibling);else activities.appendChild?.(button);
  return true;
}

export function decorateV31OperationalControlCenter(document,runtime=globalThis,role=null){
  const page=document?.querySelector?.('.sjvc02-operations');const activities=page?.querySelector?.('.sjvc02-activities');
  if(!page||!activities)return Object.freeze({applied:false,groups:0,materials:false});
  const materials=ensureMaterialsShortcut(document,runtime,role,activities);
  if(activities.dataset?.sjV31Grouped==='true')return Object.freeze({applied:true,groups:Number(activities.dataset.sjV31GroupCount||0),materials});
  const cards=Array.from(activities.children||[]).filter(node=>node?.classList?.contains?.('sjvc02-activity'));
  if(!cards.length)return Object.freeze({applied:false,groups:0,materials});
  const spec=[
    ['stock','Stok & Persediaan','Gudang, Gerai, bahan dan kebutuhan restock'],
    ['shift','Shift & Serah Terima','Sesi kasir dan catatan kondisi operasional'],
    ['finance','Kas & Penyesuaian','Pengeluaran, refund dan kasbon karyawan'],
    ['other','Lainnya','Aktivitas operasional lainnya']
  ];
  const buckets=new Map(spec.map(([key])=>[key,[]]));
  for(const card of cards)buckets.get(operationalGroupForLabel(activityLabel(card)))?.push(card);
  const frag=document.createDocumentFragment?.();if(!frag)return Object.freeze({applied:false,groups:0,materials});
  let groups=0;
  for(const [key,title,note] of spec){
    const items=buckets.get(key)||[];if(!items.length)continue;
    const section=document.createElement('section');section.className='sj-v31-op-group';section.dataset.sjV31OpGroup=key;
    const head=document.createElement('div');head.className='sj-v31-op-group-head';head.innerHTML=`<div><b>${title}</b><small>${note}</small></div>`;
    const grid=document.createElement('div');grid.className='sj-v31-op-group-grid';
    for(const item of items)grid.appendChild(item);
    section.appendChild(head);section.appendChild(grid);frag.appendChild(section);groups++;
  }
  activities.textContent='';activities.appendChild(frag);activities.dataset.sjV31Grouped='true';activities.dataset.sjV31GroupCount=String(groups);activities.classList?.add?.('sj-v31-op-groups');
  page.dataset.sjV31Operational='true';
  return Object.freeze({applied:true,groups,materials});
}

export function decorateV31Sales(document){
  const page=document?.querySelector?.('.sjvc01-sales');if(!page)return Object.freeze({applied:false,removedReady:0});
  page.dataset.sjV31Sales='true';let removedReady=0;
  for(const context of Array.from(page.querySelectorAll?.('.sjvc01-context')||[])){
    if(/^siap dijual$/i.test(text(context))){context.parentNode?.removeChild?.(context);removedReady++}
  }
  const search=page.querySelector?.('#sj-product-search');if(search){search.setAttribute?.('autocomplete','off');search.setAttribute?.('autocapitalize','none');search.setAttribute?.('enterkeyhint','search')}
  return Object.freeze({applied:true,removedReady});
}

export function decorateV31Settings(document){
  const page=document?.querySelector?.('.sjr01-settings-page');if(!page)return false;
  page.dataset.sjV31Settings='true';
  for(const card of Array.from(page.querySelectorAll?.('.sjr01-setting-card')||[]))card.setAttribute?.('data-sj-v31-card','settings');
  return true;
}

export function decorateV31SystemStates(document){
  let count=0;for(const node of Array.from(document?.querySelectorAll?.('.sj-ref-state,.sj-empty,.sjvc01-empty,.sj-v26-empty')||[])){try{node.dataset.sjV31State='true';count++}catch(_){}}
  return count;
}

export function applyV31UxPolish(document,runtime=globalThis,{role=null}={}){
  return Object.freeze({
    sales:decorateV31Sales(document),
    operational:decorateV31OperationalControlCenter(document,runtime,role),
    settings:decorateV31Settings(document),
    states:decorateV31SystemStates(document)
  });
}
