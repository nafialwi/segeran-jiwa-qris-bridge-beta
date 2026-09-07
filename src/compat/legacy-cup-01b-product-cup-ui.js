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
function installStyle(){
 if(document.getElementById('sj-legacy-cup-01b-style'))return;
 const st=document.createElement('style');st.id='sj-legacy-cup-01b-style';
 st.textContent=`
 .sj-product-form-v2{text-align:left!important;max-width:460px!important}.sj-product-form-v2 .modal-title{text-align:left!important;font-size:18px!important;margin-bottom:16px!important}.sj-product-field-label{display:block;font-size:11px;font-weight:800;color:#475569;margin:2px 0 6px 2px;letter-spacing:.02em}.sj-product-form-v2>input,.sj-product-form-v2>select{font-size:14px!important;min-height:46px!important}.sj-product-cup-native{display:none!important}.sj-product-cup-panel{border:1px solid #dbe5df;border-radius:16px;background:#f8fbf9;padding:12px;margin:0 0 10px}.sj-product-cup-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px}.sj-product-cup-title{font-size:12px;font-weight:900;color:#173b2b}.sj-product-cup-help{font-size:10px;color:#64748b;margin-top:3px;line-height:1.35}.sj-product-cup-summary{font-size:10px;font-weight:800;color:#047857;background:#ecfdf5;border-radius:999px;padding:5px 8px;white-space:nowrap}.sj-product-cup-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.sj-product-cup-option{border:1px solid #dbe5df;background:#fff;border-radius:12px;padding:10px;text-align:left;min-height:58px;cursor:pointer;color:#334155}.sj-product-cup-option strong{display:block;font-size:11px;line-height:1.25}.sj-product-cup-option small{display:block;font-size:9px;color:#94a3b8;margin-top:3px;line-height:1.25}.sj-product-cup-option.is-selected{border-color:#15803d;background:#f0fdf4;box-shadow:0 0 0 2px rgba(21,128,61,.08);color:#166534}.sj-product-cup-option.is-none{grid-column:1/-1;min-height:48px}.sj-product-cup-option:active{transform:scale(.99)}@media(max-width:360px){.sj-product-cup-grid{grid-template-columns:1fr}.sj-product-cup-option.is-none{grid-column:auto}.sj-product-cup-head{flex-direction:column}.sj-product-cup-summary{white-space:normal}}
 `;
 document.head.appendChild(st);
}
function fieldLabelBefore(el,text,key){
 if(!el||document.querySelector('[data-sj-product-label="'+key+'"]'))return;
 const label=document.createElement('label');label.className='sj-product-field-label';label.dataset.sjProductLabel=key;label.textContent=text;el.parentNode.insertBefore(label,el);
}
function syncPanel(select){
 const panel=document.querySelector('[data-sj-product-cup-panel="'+select.id+'"]');if(!panel)return;
 const value=String(select.value||'');const chosen=CUP_OPTIONS.find(x=>x.code===value)||CUP_OPTIONS[0];
 panel.querySelectorAll('[data-sj-product-cup-value]').forEach(btn=>{const active=btn.dataset.sjProductCupValue===chosen.code;btn.classList.toggle('is-selected',active);btn.setAttribute('aria-pressed',active?'true':'false')});
 const summary=panel.querySelector('[data-sj-product-cup-summary]');if(summary)summary.textContent=chosen.code?'Kemasan: '+chosen.name:'Tanpa cup';
}
function buildPicker(select){
 if(!select||document.querySelector('[data-sj-product-cup-panel="'+select.id+'"]'))return;
 const previous=String(select.value||'');
 select.innerHTML=CUP_OPTIONS.map(x=>'<option value="'+esc(x.code)+'">'+esc(x.name)+'</option>').join('');
 if(CUP_OPTIONS.some(x=>x.code===previous))select.value=previous;
 select.classList.add('sj-product-cup-native');
 const panel=document.createElement('div');panel.className='sj-product-cup-panel';panel.dataset.sjProductCupPanel=select.id;
 panel.innerHTML='<div class="sj-product-cup-head"><div><div class="sj-product-cup-title">Kemasan / Jenis Cup</div><div class="sj-product-cup-help">Pilih cup yang dipakai produk ini. Pilihan tersimpan pada produk dan dipakai untuk perhitungan pemakaian cup.</div></div><div class="sj-product-cup-summary" data-sj-product-cup-summary></div></div><div class="sj-product-cup-grid">'+CUP_OPTIONS.map(x=>'<button type="button" class="sj-product-cup-option '+(x.code?'':'is-none')+'" data-sj-product-cup-value="'+esc(x.code)+'"><strong>'+esc(x.name)+'</strong><small>'+esc(x.note)+'</small></button>').join('')+'</div>';
 select.parentNode.insertBefore(panel,select);
 panel.addEventListener('click',ev=>{const btn=ev.target.closest('[data-sj-product-cup-value]');if(!btn)return;select.value=btn.dataset.sjProductCupValue||'';select.dispatchEvent(new Event('change',{bubbles:true}));syncPanel(select)});
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
function install(){installStyle();enhanceModal('modal-add-menu',{category:'new-c',name:'new-n',price:'new-p',cup:'new-cp'});enhanceModal('modal-edit-master',{category:'edit-m-c',name:'edit-m-n',price:'edit-m-p',cup:'edit-m-cp'})}
const api=Object.freeze({version:'LEGACY-CUP-01B',options:CUP_OPTIONS.map(x=>({code:x.code,name:x.name})),install:install,sync:function(){['new-cp','edit-m-cp'].forEach(id=>{const el=document.getElementById(id);if(el)syncPanel(el)})}});
window.SJLegacyCup01BProductCupUI=api;
install();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
})();
