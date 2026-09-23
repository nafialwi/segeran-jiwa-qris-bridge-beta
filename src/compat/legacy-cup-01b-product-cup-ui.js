(function(){
'use strict';
if(window.SJLegacyCup01BProductCupUI)return;
const CUP_OPTIONS=Object.freeze([
 Object.freeze({code:'',name:'Tanpa cup',note:'Produk tidak menggunakan kemasan cup'}),
 Object.freeze({code:'c10',name:'Cup 10 Oz',note:'Cup plastik 10 Oz'}),
 Object.freeze({code:'c10p',name:'Cup Paper 10 Oz',note:'Paper cup 10 Oz'}),
 Object.freeze({code:'c16',name:'Cup 16 Oz',note:'Cup plastik 16 Oz'}),
 Object.freeze({code:'c22p',name:'Cup 22 Oz Datar Polos',note:'Cup 22 Oz tutup datar polos'}),
 Object.freeze({code:'c22d',name:'Cup 22 Oz Datar',note:'Cup 22 Oz tutup datar'}),
 Object.freeze({code:'c22o',name:'Cup 22 Oz Oval',note:'Cup 22 Oz tutup oval'})
]);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function runtimeCupCatalog(includeInactive=false){
 try{
  const api=window.__SJ_CUP_CATALOG_V1;
  const rows=includeInactive?api?.catalog?.({includeInactive:true}):api?.activeCatalog?.();
  if(Array.isArray(rows)&&rows.length)return rows.map(x=>({code:String(x.code||''),name:String(x.name||x.code||''),note:'Cup Control'}));
 }catch(_){}
 return CUP_OPTIONS.filter(x=>x.code);
}
function pickerOptions(selected=''){
 const active=runtimeCupCatalog(false),all=runtimeCupCatalog(true),key=String(selected||'').toLowerCase();
 const rows=[{code:'',name:'Tanpa cup',note:'Produk tidak menggunakan kemasan cup'},...active];
 if(key&&!rows.some(x=>x.code===key)){const found=all.find(x=>x.code===key);if(found)rows.push(found)}
 return rows;
}
function installStyle(){
 if(document.getElementById('sj-legacy-cup-01b-style'))return;
 const st=document.createElement('style');st.id='sj-legacy-cup-01b-style';
 st.textContent=`
 .sj-product-form-v2{text-align:left!important;max-width:460px!important}
 .sj-product-form-v2 .modal-title{text-align:left!important;font-size:18px!important;margin-bottom:16px!important}
 .sj-product-field-label{display:block;font-size:11px;font-weight:800;color:#475569;margin:2px 0 6px 2px;letter-spacing:.02em}
 .sj-product-form-v2>input,.sj-product-form-v2>select{font-size:14px!important;min-height:46px!important}
 .sj-product-cup-panel{border:1px solid #dbe5df;border-radius:14px;background:#f8fbf9;padding:11px 12px;margin:0 0 10px}
 .sj-product-cup-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}
 .sj-product-cup-title{font-size:11px;font-weight:900;color:#173b2b}
 .sj-product-cup-help{font-size:9px;color:#64748b;margin-top:2px;line-height:1.35}
 .sj-product-cup-summary{font-size:9px;font-weight:850;color:#047857;background:#ecfdf5;border-radius:999px;padding:5px 8px;max-width:48%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .sj-product-cup-select{display:block!important;width:100%!important;min-height:44px!important;margin:0!important;padding:9px 36px 9px 11px!important;border:1px solid #d7e4db!important;border-radius:11px!important;background-color:#fff!important;color:#273b30!important;font-size:11px!important;font-weight:750!important}
 .sj-cup-mapping-chip{display:inline-flex;max-width:100%;margin-top:5px;padding:4px 7px;border-radius:999px;background:#ecfdf5;color:#047857;font-size:8px;font-weight:900;line-height:1.2}
 @media(max-width:390px){.sj-product-cup-head{align-items:flex-start}.sj-product-cup-summary{max-width:46%}}
 `;
 document.head.appendChild(st);
}
function fieldLabelBefore(el,text,key){
 if(!el||document.querySelector('[data-sj-product-label="'+key+'"]'))return;
 const label=document.createElement('label');label.className='sj-product-field-label';label.dataset.sjProductLabel=key;label.textContent=text;el.parentNode.insertBefore(label,el);
}
function syncPanel(select){
 if(!select)return;
 const value=String(select.value||''),rows=pickerOptions(value);
 select.innerHTML=rows.map(x=>'<option value="'+esc(x.code)+'">'+esc(x.name)+'</option>').join('');
 if(rows.some(x=>x.code===value))select.value=value;
 const panel=document.querySelector('[data-sj-product-cup-panel="'+select.id+'"]');if(!panel)return;
 const chosen=rows.find(x=>x.code===String(select.value||''))||rows[0];
 const summary=panel.querySelector('[data-sj-product-cup-summary]');
 if(summary)summary.textContent=chosen?.code?chosen.name:'Tanpa cup';
}
function buildPicker(select){
 if(!select||document.querySelector('[data-sj-product-cup-panel="'+select.id+'"]'))return;
 const previous=String(select.value||''),parent=select.parentNode;
 const rows=pickerOptions(previous);select.innerHTML=rows.map(x=>'<option value="'+esc(x.code)+'">'+esc(x.name)+'</option>').join('');
 if(rows.some(x=>x.code===previous))select.value=previous;
 select.classList.add('sj-product-cup-select');
 const panel=document.createElement('div');panel.className='sj-product-cup-panel';panel.dataset.sjProductCupPanel=select.id;
 panel.innerHTML='<div class="sj-product-cup-head"><div><div class="sj-product-cup-title">Kemasan / Jenis Cup</div><div class="sj-product-cup-help">Dipakai Cup Control untuk menghitung pemakaian cup per produk.</div></div><div class="sj-product-cup-summary" data-sj-product-cup-summary></div></div>';
 parent.insertBefore(panel,select);panel.appendChild(select);
 select.addEventListener('change',()=>syncPanel(select));
 const modal=select.closest('.overlay');if(modal&&window.MutationObserver){new MutationObserver(()=>queueMicrotask(()=>syncPanel(select))).observe(modal,{attributes:true,attributeFilter:['style','class']})}
 syncPanel(select);
}
function enhanceModal(modalId,ids){
 const modal=document.getElementById(modalId);if(!modal)return;const box=modal.querySelector('.modal');if(box)box.classList.add('sj-product-form-v2');
 fieldLabelBefore(document.getElementById(ids.category),'Kategori Produk',ids.category);
 fieldLabelBefore(document.getElementById(ids.name),'Nama Produk',ids.name);
 fieldLabelBefore(document.getElementById(ids.price),'Harga Jual',ids.price);
 buildPicker(document.getElementById(ids.cup));
}
function runtimeMenuRows(){
 try{if(Array.isArray(window.cloudData?.global?.menu))return window.cloudData.global.menu;const out=window.Function?window.Function('try{return typeof cloudData!=="undefined"?cloudData.global.menu:[]}catch(_){return []}')():[];return Array.isArray(out)?out:[]}catch(_){return[]}
}
function cupName(code){const key=String(code||'').toLowerCase(),row=runtimeCupCatalog(true).find(x=>x.code===key)||CUP_OPTIONS.find(x=>x.code===key);return row?.code?row.name:''}
let masterCupObserver=null,masterCupScheduled=false;
function decorateMasterCupMappings(){
 const list=document.getElementById('master-menu-list');if(!list)return false;const menu=runtimeMenuRows();
 list.querySelectorAll('[data-master-card]').forEach(card=>{let id='';try{id=decodeURIComponent(card.dataset.masterCard||'')}catch(_){id=card.dataset.masterCard||''}const product=menu.find(x=>String(x?.id)===String(id)),name=cupName(product?.cp),meta=card.querySelector('.sjmux-product-master-meta');let chip=card.querySelector('[data-sj-cup-mapping-chip]');if(!name){chip?.remove?.();return}if(!meta)return;if(!chip){chip=document.createElement('span');chip.className='sj-cup-mapping-chip';chip.dataset.sjCupMappingChip='1';meta.appendChild(chip)}const label='Cup: '+name;if(chip.textContent!==label)chip.textContent=label});return true
}
function watchMasterCupMappings(){const list=document.getElementById('master-menu-list');if(!list)return false;if(!masterCupObserver&&window.MutationObserver){masterCupObserver=new MutationObserver(()=>{if(masterCupScheduled)return;masterCupScheduled=true;queueMicrotask(()=>{masterCupScheduled=false;decorateMasterCupMappings()})});masterCupObserver.observe(list,{childList:true,subtree:true})}return decorateMasterCupMappings()}
function install(){installStyle();enhanceModal('modal-add-menu',{category:'new-c',name:'new-n',price:'new-p',cup:'new-cp'});enhanceModal('modal-edit-master',{category:'edit-m-c',name:'edit-m-n',price:'edit-m-p',cup:'edit-m-cp'});watchMasterCupMappings()}
const api=Object.freeze({version:'LEGACY-CUP-01B',options:CUP_OPTIONS.map(x=>({code:x.code,name:x.name})),install:install,decorateMasterCupMappings:decorateMasterCupMappings,sync:function(){['new-cp','edit-m-cp'].forEach(id=>{const el=document.getElementById(id);if(el)syncPanel(el)});decorateMasterCupMappings()}});
window.SJLegacyCup01BProductCupUI=api;
try{document.addEventListener('sj:cup-catalog-changed',()=>{try{api.sync()}catch(_){}})}catch(_){}
install();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
})();
