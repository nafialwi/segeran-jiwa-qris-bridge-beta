/* RC01 urgent QRIS manual-confirmation bypass.
   QRIS sale confirmation stays on the canonical processTransaction() writer,
   while the automatic QRIS Signal Beta payment-opening path is bypassed. */
(function(){
'use strict';
if(window.SJRC01QrisManualBypass)return;
var VERSION='RC01-QRIS-MANUAL-1';
var installed=false,baseOpenPayment=null;
function text(v){return String(v==null?'':v)}
function commercial(){return window.SJCommercialFinalV5961||null}
function ui(){return window.SJFinalRefinementVC01B||null}
function qrisImage(){try{return typeof TOKO_QRIS!=='undefined'?text(TOKO_QRIS).trim():''}catch(_){return''}}
function escapeHtml(v){var helper=ui();if(helper&&typeof helper.esc==='function')return helper.esc(v);return text(v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function money(v){var helper=ui();if(helper&&typeof helper.money==='function')return helper.money(v);try{return fmt(Number(v)||0)}catch(_){return 'Rp '+(Number(v)||0).toLocaleString('id-ID')}}
function total(){var helper=ui();if(helper&&typeof helper.total==='function')return Number(helper.total())||0;try{return (Array.isArray(cart)?cart:[]).reduce(function(sum,item){return sum+(Number(item&&item.p)||0)*(Number(item&&item.q)||0)},0)}catch(_){return 0}}
function installStyle(){
  try{
    if(!document||!document.head||document.getElementById('sj-rc01-qris-manual-style'))return;
    var style=document.createElement('style');style.id='sj-rc01-qris-manual-style';style.textContent=''
      +'#modal-bayar .sjrc01-qm-page{box-sizing:border-box;width:min(100%,560px);margin:0 auto;padding:18px 14px 22px;color:#173126;font-family:inherit}'
      +'#modal-bayar .sjrc01-qm-head{display:grid;grid-template-columns:42px 1fr 42px;gap:8px;align-items:center;margin-bottom:12px}'
      +'#modal-bayar .sjrc01-qm-back{width:40px;height:40px;border:1px solid #dbe7e0;border-radius:12px;background:#fff;font-size:26px;color:#087545}'
      +'#modal-bayar .sjrc01-qm-head h1{margin:0;font-size:18px;line-height:1.2}#modal-bayar .sjrc01-qm-head p{margin:4px 0 0;color:#718079;font-size:11px;line-height:1.45}'
      +'#modal-bayar .sjrc01-qm-total{margin:10px 0;padding:14px;border:1px solid #dce8e1;border-radius:16px;background:#f5fbf7;text-align:center}'
      +'#modal-bayar .sjrc01-qm-total span{display:block;color:#718079;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em}#modal-bayar .sjrc01-qm-total strong{display:block;margin-top:4px;font-size:24px;color:#087545}'
      +'#modal-bayar .sjrc01-qm-card{padding:14px;border:1px solid #dce8e1;border-radius:16px;background:#fff}'
      +'#modal-bayar .sjrc01-qm-qr{display:grid;place-items:center;min-height:180px;margin-bottom:12px;padding:12px;border-radius:14px;background:#f8faf9;border:1px dashed #ccd9d1}'
      +'#modal-bayar .sjrc01-qm-qr img{display:block;max-width:240px;width:min(78vw,240px);height:auto;border-radius:10px;background:#fff}'
      +'#modal-bayar .sjrc01-qm-empty{text-align:center;color:#9a6110;font-size:11px;line-height:1.5}'
      +'#modal-bayar .sjrc01-qm-note{margin:0 0 12px;padding:10px 11px;border-radius:12px;background:#fff8e9;color:#79540e;font-size:10.5px;line-height:1.5}'
      +'#modal-bayar .sjrc01-qm-verify{display:flex;gap:10px;align-items:flex-start;padding:12px;border:1px solid #cfe0d6;border-radius:13px;background:#f7fbf8;font-size:11px;line-height:1.45;cursor:pointer}'
      +'#modal-bayar .sjrc01-qm-verify input{width:19px;height:19px;margin-top:1px;accent-color:#087545;flex:0 0 auto}'
      +'#modal-bayar .sjrc01-qm-actions{display:grid;gap:9px;margin-top:14px}#modal-bayar .sjrc01-qm-pay,#modal-bayar .sjrc01-qm-secondary{min-height:48px;border-radius:13px;font:inherit;font-weight:800}'
      +'#modal-bayar .sjrc01-qm-pay{border:0;background:#087545;color:#fff}#modal-bayar .sjrc01-qm-pay:disabled{opacity:.42;cursor:not-allowed}'
      +'#modal-bayar .sjrc01-qm-secondary{border:1px solid #d5e1da;background:#fff;color:#315244}'
      +'@media(min-width:768px){#modal-bayar .sjrc01-qm-page{padding:24px 22px 28px}#modal-bayar .sjrc01-qm-card{padding:18px}}';
    document.head.appendChild(style);
  }catch(_){}
}
function setQrisAuthority(){
  try{payMethod='QRIS'}catch(_){}
  try{var c=commercial();if(c)c.cartMethod='QRIS'}catch(_){}
}
function backCheckout(){
  try{var helper=ui();if(helper&&typeof helper.backCheckout==='function')return helper.backCheckout()}catch(_){}
  try{if(typeof clsModal==='function')clsModal('modal-bayar')}catch(_){}
}
function openManualQris(){
  try{if(window.SJShift&&typeof SJShift.guardTransaction==='function'&&!SJShift.guardTransaction())return false}catch(_){return false}
  try{if(!Array.isArray(cart)||!cart.length)return false}catch(_){return false}
  var helper=ui();if(!helper||typeof helper.setupOverlay!=='function')return false;
  setQrisAuthority();try{if(typeof clsModal==='function')clsModal('modal-cart')}catch(_){}
  installStyle();var x=helper.setupOverlay();if(!x||!x.ov||!x.modal)return false;
  var amount=total(),image=qrisImage();
  var qr=image?'<img src="'+escapeHtml(image)+'" alt="QRIS Segeran Jiwa">':'<div class="sjrc01-qm-empty"><b>QRIS toko belum tersedia di aplikasi.</b><br>Gunakan QRIS toko yang berlaku dan pastikan pembayaran pada aplikasi/mutasi merchant sebelum konfirmasi.</div>';
  x.modal.innerHTML='<main class="sjrc01-qm-page" data-qris-manual-page="1">'
    +'<header class="sjrc01-qm-head"><button type="button" class="sjrc01-qm-back" data-back aria-label="Kembali">‹</button><div><h1>Pembayaran QRIS</h1><p>Mode verifikasi manual sementara. Transaksi tetap dicatat sebagai QRIS.</p></div><span></span></header>'
    +'<section class="sjrc01-qm-total"><span>Total Tagihan</span><strong>'+money(amount)+'</strong></section>'
    +'<section class="sjrc01-qm-card"><div class="sjrc01-qm-qr">'+qr+'</div>'
    +'<p class="sjrc01-qm-note"><b>Verifikasi manual:</b> cek aplikasi atau mutasi QRIS merchant. Jangan konfirmasi hanya berdasarkan bukti layar pelanggan.</p>'
    +'<label class="sjrc01-qm-verify"><input type="checkbox" data-qris-manual-confirm><span><b>Pembayaran QRIS sudah saya pastikan masuk.</b><br>Setelah dicentang, transaksi akan disimpan dengan metode QRIS.</span></label></section>'
    +'<input type="hidden" id="m-kasbon-nama" value="">'
    +'<div class="sjrc01-qm-actions"><button type="button" class="btn-pay sjrc01-qm-pay" data-qris-manual-pay onclick="processTransaction()" disabled>Konfirmasi QRIS • '+money(amount)+'</button><button type="button" class="sjrc01-qm-secondary" data-back2>Kembali ke Checkout</button></div>'
    +'</main>';
  x.ov.style.display='flex';
  var checkbox=x.modal.querySelector('[data-qris-manual-confirm]'),pay=x.modal.querySelector('[data-qris-manual-pay]'),back=x.modal.querySelector('[data-back]'),back2=x.modal.querySelector('[data-back2]');
  if(!checkbox||!pay)return false;
  pay.disabled=true;
  checkbox.onchange=function(){pay.disabled=!checkbox.checked};
  pay.onclick=function(){if(!checkbox.checked){pay.disabled=true;return false}setQrisAuthority();if(typeof processTransaction!=='function')return false;return processTransaction()};
  if(back)back.onclick=backCheckout;if(back2)back2.onclick=backCheckout;
  return true;
}
function isEnabled(){return true}
function install(){
  if(installed)return true;var c=commercial();if(!c||typeof c.openPayment!=='function')return false;
  baseOpenPayment=c.openPayment.bind(c);
  var wrapped=function(method){var selected=text(method||this.cartMethod||'Tunai');if(selected.toUpperCase()==='QRIS')return openManualQris();return baseOpenPayment(method)};
  wrapped.__sjQrisManual=true;wrapped.__sjQrisManualBase=baseOpenPayment;c.openPayment=wrapped;
  try{if(window.SJCommercialUIV5953)SJCommercialUIV5953.openPay=function(m){return c.openPayment(m||c.cartMethod)};if(window.SJCommercialVisualV5955)SJCommercialVisualV5955.openPay=function(m){return c.openPayment(m||c.cartMethod)};window.openPayModal=function(){return c.openPayment(c.cartMethod||'Tunai')}}catch(_){}
  installed=true;return true;
}
window.SJRC01QrisManualBypass=Object.freeze({version:VERSION,install:install,openManualQris:openManualQris,isEnabled:isEnabled});
install();
})();
