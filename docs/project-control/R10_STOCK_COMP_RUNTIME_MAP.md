# R10-STOCK-COMP01 Runtime Map

## Source Identity

- Branch: `work/r10-inventory-read-hardening`
- Source HEAD before this Task 1 commit: `410052ed12c7557b46e759d54c427c115489456f`
- Production writes performed: **none**
- Application deploy performed: **none**

## Legacy Transaction Authority

- LEGACY_TX_WRITER: `baseline/legacy-v1.0.40.html`
- Writer anchor: `1589:async function processTransaction(){`
- `src/ui/refinement-visual-contract.js` is evidence-only for this writer and is **not** a transaction writer.

## REF01 Runtime / Build Chain

- REF01_ENTRY: `src/ref01-entry.js`
- REF01_APP_BOOTSTRAP: `src/app/ref01-bootstrap.js`
- P5_PACKAGING_BOOTSTRAP: `src/app/p5-packaging-bootstrap.js`
- REF01_BUILD: `scripts/build-ref01.mjs`
- Legacy cup UI injection authority: `scripts/build-ref01.mjs`

Execution ruling:
- New module-based Stock Component UI/runtime integration must use the module bootstrap chain, primarily `src/app/ref01-bootstrap.js`, rather than pretending one file directly references both legacy cup surfaces.
- Classic legacy cup UI removal/injection cleanup remains owned by `scripts/build-ref01.mjs`.

## Refund / Void Authority

- REFUND_VOID_OWNER: `baseline/legacy-v1.0.40.html`
- VOID anchor: `1733:function voidTx(idx){if(isDayLocked())return alert('SHIFT SUDAH DIKUNCI!');var rows=sjTxEntries((cloudData[activeDate]||{}).tx),t=rows[idx];if(!t)return;if(t.status==='VOIDED')return alert('Transaksi sudah VOID.');showModalInput('Alasan VOID','Contoh: salah input / customer batal',function(reason){if(!reason)return;showModalInput('PIN Owner','Masukkan PIN Owner',async function(pin){if(!(await sjVerifyCurrentOwnerPin(pin)))return alert('PIN Owner salah.');var restored=[];try{var items=Array.isArray(t.cartData)?t.cartData:(Array.isArray(t.items)?t.items:[]);for(const it of items){var p=(cloudData.global.menu||[]).find(m=>String(m.id)===String(it.id));if(p&&sjTrackStock(p)){await sjTimeout(db.ref(DB_PATH+'/global/inventory/'+p.id).transaction(cur=>sjNum(cur)+sjNum(it.q)),8000,'VOID_STOCK_TIMEOUT');restored.push({id:p.id,q:sjNum(it.q),name:p.n})}}var u={},path=activeDate+'/tx/'+t._key,total=sjNum(t.total),method=String(t.method||'');u[path+'/status']='VOIDED';u[path+'/voidReason']=reason;u[path+'/voidedAt']=sjNowIso();u[path+'/voidedBy']=currentUserName;u[activeDate+'/omset']=sjServerInc(-total);if(method==='Tunai'||method==='TUNAI')u[activeDate+'/tunai']=sjServerInc(-total);else if(method==='QRIS')u[activeDate+'/qris']=sjServerInc(-total);else if(method==='Transfer')u[activeDate+'/tf']=sjServerInc(-total);else if(method.includes('KASBON'))u[activeDate+'/kb_tot']=sjServerInc(-total);items.forEach(it=>{if(it.id!=null)u[activeDate+'/sd/'+it.id+'/q']=sjServerInc(-sjNum(it.q));if(it.cp)u[activeDate+'/cpLaku/'+it.cp]=sjServerInc(-sjNum(it.q))});restored.forEach(r=>{var lid=sjPushKey(DB_PATH+'/global/stockLedger');u['global/stockLedger/'+lid]={id:lid,productId:r.id,productName:r.name,delta:r.q,type:'VOID',refId:t.id||t._key,user:currentUserName,ts:Date.now(),at:sjNowIso(),shift:activeDate}});if(t.debtId){u['global/hutang/'+t.debtId+'/status']='VOIDED';u['global/hutang/'+t.debtId+'/remaining']=0;u['global/hutang/'+t.debtId+'/lunas']=true;}var aid=sjPushKey(DB_PATH+'/global/auditLogs');u['global/auditLogs/'+aid]={id:aid,action:'VOID',detail:(t.id||t._key)+' • '+reason,user:currentUserName,userId:currentLoginId,role:currentUserRole,at:sjNowIso(),ts:Date.now(),shift:activeDate};await sjTimeout(db.ref(DB_PATH).update(u),10000,'VOID_TIMEOUT');showToast('Transaksi di-VOID dan stok dikembalikan.','warning');calcLaporan();sjRenderTransactionHistory()}catch(e){sjSaveError('VOID',e);for(const r of restored){try{await db.ref(DB_PATH+'/global/inventory/'+r.id).transaction(cur=>Math.max(0,sjNum(cur)-r.q))}catch(_){}}alert(sjFriendlyError(e))}})})}`
- REFUND anchor: `3082:        await this.verifiedUpdate(u,'REFUND_ATOMIC_TIMEOUT',async()=>String((await db.ref(DB_PATH+'/'+activeDate+'/tx/'+txKey+'/lastRefundId').once('value')).val()||'')===String(refid));`

## Reconciliation Consumers

- `src/ui/cup-product-costing-v34.js`
- `src/ui/cup-shift-control-v34.js`
- `src/ui/inventory-workspace-v32.js`

## Firebase Rules Authority

The current R10 stock branch intentionally has no canonical `database.rules.json` file.

- Production project: `segeranjiwa-id`
- RULES_SOURCE: `live://segeranjiwa-id/.settings/rules`
- Rules evidence mode for Task 1: `READ_ONLY_LIVE_FETCH`
- Current live canonical SHA-256: `734d03a530433cdaabccfebce2ff6083134d369e8881bcc0e9a403138c0f91b9`
- Current evidence raw SHA-256: `d1c51aac70f89cf07062d2546fe9eec86f360c9e12ed8f8df1734d5cb9be1a2e`
- Expected approved CUP-02 live canonical SHA-256: `734d03a530433cdaabccfebce2ff6083134d369e8881bcc0e9a403138c0f91b9`
- CUP-02 candidate branch: `origin/work/r10-cup02-authz-fix`
- CUP-02 candidate HEAD: `37522bfc9739527b10d16bb859ebe1f3fb521652`
- CUP-02 patch source: `firebase/r9/cup02-authz-rules.mjs`
- CUP-02 candidate builder: `firebase/r9/build-cup02-authz-candidate.mjs`
- CUP-02 emulator source: `firebase/r9/cup02-authz-emulator.mjs`

Execution ruling:
- Task 9 must start from a fresh read-only export of live production rules and require canonical SHA continuity before building the R10 candidate.
- The old pre-CUP-02 export is not the base for R10.
- No rules publish occurs in Task 1.

## Frozen Runtime Guard

- Frozen R6B: `src/app/rc01-runtime-loading-hardening.js`
- Frozen R6B SHA-256: `a6ee7844e884276a1f2f21a0792a3d4dd9784b18ac47fb5ce5807e6ece3a7f44`

## Task 1 Diagnostic Resolution

1. The original writer scan had a false positive because `refinement-visual-contract.js` names the baseline writer as evidence.
2. The original REF01 scan assumed a single file directly referenced both cup modules; actual integration is split between the module bootstrap chain and classic build injection.
3. The original rules scan assumed the R10 branch tracked canonical production rules; actual CUP-02 workflow derives candidates from an exact live-rules export.

These are plan-execution anchor corrections only. They do not alter the approved Product Stock Components architecture.
