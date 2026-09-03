const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const money=v=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(num(v));
const normalizeRole=v=>{const x=String(v??'').trim().toLowerCase();return x==='manajemen'||x==='owner'?'owner':x==='transaksi'||x==='kasir'||x==='cashier'?'cashier':x};
const guardWritable=readOnly=>{if(readOnly)throw new Error('LOCAL_QA_READ_ONLY')};

export function renderQrisCashOutPanelV33({pendingId='',saleAmount=0,candidates=[],role='cashier',readOnly=false}={}){
  const rows=(Array.isArray(candidates)?candidates:[]).filter(x=>x&&num(x.amount)>num(saleAmount)&&num(x.cashOutAmount)>0&&x.providerTransactionId);
  if(!rows.length)return '';
  const r=rows[0],owner=normalizeRole(role)==='owner';
  if(readOnly)return `<aside class="sj-v33-qco sj-v33-qco-readonly"><b>QRIS lebih bayar terdeteksi</b><small>${money(r.amount)} untuk transaksi ${money(saleAmount)} · cash-out ${money(r.cashOutAmount)}</small><span>LOCAL QA · READ ONLY</span></aside>`;
  return `<aside class="sj-v33-qco" data-v33-qris-pending="${esc(pendingId)}" data-v33-qris-provider="${esc(r.providerTransactionId)}"><header><div><small>QRIS Cash-out / Tukar Uang</small><b>${money(r.amount)} diterima</b></div><span>Cash-out ${money(r.cashOutAmount)}</span></header><p>Omzet tetap ${money(saleAmount)}. Tunai keluar ${money(r.cashOutAmount)} bukan expense dan bukan refund.</p><form data-v33-qris-cashout-submit>${owner?'':`<label>Owner Approver<input data-v33-qris-owner-id name="ownerId" autocomplete="off" required placeholder="ID Owner"></label>`}<label>PIN Owner<input data-v33-secret name="pin" type="password" inputmode="numeric" autocomplete="off" required></label><button type="submit">Konfirmasi Cash-out ${money(r.cashOutAmount)}</button></form></aside>`;
}

export function createQrisCashOutUiControllerV33({p4,readRole=()=> 'cashier',readOnly=false}={}){
  if(!p4?.authorizer||!p4?.qrisCashOut)throw new Error('P4_QRIS_CASH_OUT_RUNTIME_REQUIRED');
  return Object.freeze({
    findEligibleOverpay:pendingId=>p4.qrisCashOut.findEligibleOverpay(pendingId),
    async execute({providerTransactionId,pendingId,ownerId='',pin=''}={}){
      guardWritable(readOnly);const role=normalizeRole(readRole?.());let secret=String(pin??'');
      try{
        if(role!=='owner'&&!String(ownerId||'').trim())throw new Error('OWNER_APPROVER_REQUIRED');
        const authorization=await p4.authorizer.authorize(role==='owner'?{pin:secret}:{pin:secret,ownerId:String(ownerId).trim()});
        return await p4.qrisCashOut.execute({providerTransactionId,pendingId,authorization});
      }finally{secret=''}
    },
    recover:input=>{guardWritable(readOnly);return p4.qrisCashOut.recover(input)}
  });
}

function activePendingId(runtime){try{return String(runtime?.SJQrisSignalBeta?.status?.()?.activePendingId||'')}catch(_){return''}}
export function installQrisCashOutUiV33(runtime=globalThis,{document=runtime?.document,p4=runtime?.__SJ_P4_FINANCE_RUNTIME,readRole=()=> 'cashier',notify=()=>{}}={}){
  if(!document||!p4)return Object.freeze({installed:false,enhance(){return false},stop(){}});
  const readOnly=runtime?.__SJ_LOCAL_QA_READ_ONLY===true,controller=createQrisCashOutUiControllerV33({p4,readRole,readOnly});
  let token='',loading=false;
  function target(){return document.querySelector?.('.sj61-qris')||document.querySelector?.('#modal-qris-fs .modal')||document.getElementById?.('modal-qris-fs')||null}
  function ensureHost(){const t=target();if(!t)return null;let host=document.getElementById?.('sj-v33-qris-cashout');if(!host){host=document.createElement?.('div');if(!host)return null;host.id='sj-v33-qris-cashout';host.dataset.sjV33QrisCashout='true';t.appendChild?.(host);host.addEventListener?.('submit',async event=>{const form=event.target;if(!form?.matches?.('[data-v33-qris-cashout-submit]'))return;event.preventDefault?.();const box=form.closest?.('[data-v33-qris-pending]'),pinInput=form.querySelector?.('[name="pin"]'),ownerInput=form.querySelector?.('[name="ownerId"]'),pin=String(pinInput?.value||''),ownerId=String(ownerInput?.value||'');if(pinInput)pinInput.value='';const button=form.querySelector?.('button[type="submit"]');if(button)button.disabled=true;try{const result=await controller.execute({providerTransactionId:box?.dataset?.v33QrisProvider,pendingId:box?.dataset?.v33QrisPending,ownerId,pin});notify(`QRIS cash-out dikonfirmasi · ${money(result.cashOutAmount||0)} tunai keluar.`,'success');host.innerHTML='';try{runtime?.SJQrisSignalBeta?.renderCommercialQrisState?.()}catch(_){}}catch(error){notify(error?.message||'QRIS cash-out belum dapat diproses.','error')}finally{if(button?.isConnected)button.disabled=false}})}return host}
  async function enhance(){const pendingId=activePendingId(runtime);if(!pendingId)return false;const host=ensureHost();if(!host)return false;const nextToken=`${pendingId}:${normalizeRole(readRole?.())}:${readOnly?'ro':'rw'}`;if(loading||token===nextToken)return true;token=nextToken;loading=true;try{const found=await controller.findEligibleOverpay(pendingId),saleAmount=num(found?.pending?.amount);host.innerHTML=renderQrisCashOutPanelV33({pendingId,saleAmount,candidates:found?.candidates||[],role:readRole?.(),readOnly})}catch(_){host.innerHTML=''}finally{loading=false}return true}
  return Object.freeze({installed:true,controller,enhance,stop(){token=''}});
}
