# SC-01 Monolith Audit — v1.0.40

Generated: 2026-09-01T03:49:43.045Z

## Baseline

- SHA256: `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`
- Bytes: 1938341
- Lines: 9401
- Style blocks: 23
- Script blocks: 40
- Declared functions: 698
- Firebase mutation tokens: 368

## Fixed contracts

- POS root: `toko_segeranjiwa_v58`
- QRIS root: `segeranjiwa_qris_beta_v1`
- Package ID: `id.segeranjiwa.pos`

## Style / renderer layering

| # | Line | Nearest marker | Attributes |
|---:|---:|---|---|
| 1 | 12 | — | — |
| 2 | 591 | sj-search-wrap | id="sjx-rolefix-style" |
| 3 | 594 | sj-search-wrap | id="sj-cashclose-css" |
| 4 | 598 | — | id="sjpro-design-system" |
| 5 | 746 | — | id="sjhard-v591-style" |
| 6 | 752 | — | id="sjmobile-v592-style" |
| 7 | 806 | — | id="sjrel-v593-style" |
| 8 | 6736 | SJ-WP-F02-PRICING-0.1.0-BEGIN | — |
| 9 | 6936 | SJ-WP-F02-PAYMENT-HOTFIX-0.1.2-BEGIN | — |
| 10 | 7782 | SJ-CP-REP0-UI-01-KPI-INSTRUMENT-ICON-REFINEMENT | id="sj-wp-rep0-style-v012" |
| 11 | 8132 | — | id="sj-rep0-ui02-style" |
| 12 | 8195 | sj-rep0-state-icon | id="sj-refinement-ds01-v100" |
| 13 | 8355 | sj-refinement-ds01-v100 | id="sj-refinement-ui01-v100" |
| 14 | 8534 | — | id="sj-refinement-ui02-v100" |
| 15 | 8625 | — | id="sj-refinement-ui02-tail-cleanup-v101" |
| 16 | 8660 | — | id="sj-refinement-ui03a-v100" |
| 17 | 8770 | — | id="sj-refinement-ui03b-v100" |
| 18 | 8827 | — | id="sj-final-vc01a-v100" |
| 19 | 8897 | — | id="sj-final-vc01a1-v100" |
| 20 | 8944 | — | id="sj-final-vc01a2-v100" |
| 21 | 9082 | — | id="sj-vc01b-style" |
| 22 | 9182 | — | id="sj-vc01b1-style" |
| 23 | 9313 | SJ-REFINEMENT-VC02A-OPERATIONAL-STOCK-RESTOCK-1.0.0 | id="sjvc02a-style" |

## Script layering

| # | Line | Nearest marker | Attributes |
|---:|---:|---|---|
| 1 | 8 | — | src="https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js" |
| 2 | 9 | — | src="https://www.gstatic.com/firebasejs/10.8.1/firebase-database-compat.js" |
| 3 | 10 | — | src="https://www.gstatic.com/firebasejs/10.8.1/firebase-auth-compat.js" |
| 4 | 11 | — | src="https://www.gstatic.com/firebasejs/10.8.1/firebase-storage-compat.js" |
| 5 | 1328 | — | — |
| 6 | 5954 | SJ-INVENTORY-V2-0.5.0-BEGIN | — |
| 7 | 5984 | — | — |
| 8 | 6100 | SJ-QRIS-SIGNAL-BETA-0.3.0-BEGIN | — |
| 9 | 6222 | — | — |
| 10 | 6692 | SJ-WP-F01-BARCODE-0.1.0-BEGIN | — |
| 11 | 6760 | sj-discount | — |
| 12 | 6807 | SJ-WP-F02-MGMT-HOTFIX-0.1.1-BEGIN | — |
| 13 | 6955 | sj-f02-qris-breakdown | — |
| 14 | 7135 | SJ-WP-F02-VOID-MODAL-HOTFIX-0.1.4-BEGIN | — |
| 15 | 7155 | SJ-WP-F03-COSTING-0.1.0-BEGIN | — |
| 16 | 7190 | SJ-WP-F03-RUNTIME-0.1.0-BEGIN | — |
| 17 | 7265 | SJ-WP-F03-PURCHASE-UI-0.1.0-BEGIN | — |
| 18 | 7311 | SJ-WP-F03-PURCHASE-COMMIT-0.1.0-BEGIN | — |
| 19 | 7380 | SJ-CP-F03-01-PURCHASE-COMMIT-RECOVERY-0.1.0-BEGIN | — |
| 20 | 7427 | SJ-CP-F03-02-PURCHASE-IDENTITY-RECOVERY-0.1.0-BEGIN | — |
| 21 | 7451 | SJ-CP-F03-03-INVENTORY-ROOT-PREFLIGHT-0.1.0-BEGIN | — |
| 22 | 7475 | SJ-WP-F03-SALE-COSTING-0.1.0-BEGIN | — |
| 23 | 7539 | SJ-WP-F03-REPORT-0.1.0-BEGIN | — |
| 24 | 7576 | SJ-WP-F03-REFUND-COSTING-0.1.0-BEGIN | — |
| 25 | 7656 | — | — |
| 26 | 7739 | SJ-WP-F03-PURCHASE-HISTORY-0.1.0-BEGIN | — |
| 27 | 7793 | sj-rep0 | id="sj-wp-rep0-v012" |
| 28 | 8158 | sj-rep0-evidence | — |
| 29 | 8309 | — | — |
| 30 | 8438 | — | — |
| 31 | 8567 | — | — |
| 32 | 8629 | sj-refinement-ui02-tail-cleanup-v101 | — |
| 33 | 8685 | — | — |
| 34 | 8786 | — | — |
| 35 | 8853 | — | — |
| 36 | 8911 | — | — |
| 37 | 8993 | — | — |
| 38 | 9121 | — | — |
| 39 | 9200 | — | — |
| 40 | 9331 | — | id="sjvc02a-script" |

## Layer markers

- SJ-INVENTORY-V2-0.5.0-BEGIN
- SJ-INVENTORY-V2-0.5.0-END
- SJ-QRIS-SIGNAL-BETA-0.3.0-BEGIN
- SJ-WP-F02-QRIS-FP-HOTFIX-0.1.3-BEGIN
- SJ-WP-F02-QRIS-FP-HOTFIX-0.1.3-END
- SJ-QRIS-SIGNAL-BETA-0.3.0-END
- SJ-WP-F01-BARCODE-0.1.0-BEGIN
- SJ-WP-F01-BARCODE-0.1.0-END
- SJ-WP-F02-PRICING-0.1.0-BEGIN
- SJ-WP-F02-PRICING-0.1.0-END
- SJ-WP-F02-MGMT-HOTFIX-0.1.1-BEGIN
- SJ-WP-F02-MGMT-HOTFIX-0.1.1-END
- SJ-WP-F02-PAYMENT-HOTFIX-0.1.2-BEGIN
- SJ-WP-F02-PAYMENT-HOTFIX-0.1.2-END
- SJ-WP-F02-VOID-MODAL-HOTFIX-0.1.4-BEGIN
- SJ-WP-F02-VOID-MODAL-HOTFIX-0.1.4-END
- SJ-WP-F03-COSTING-0.1.0-BEGIN
- SJ-WP-F03-COSTING-0.1.0-END
- SJ-WP-F03-RUNTIME-0.1.0-BEGIN
- SJ-WP-F03-RUNTIME-0.1.0-END
- SJ-WP-F03-PURCHASE-UI-0.1.0-BEGIN
- SJ-WP-F03-PURCHASE-UI-0.1.0-END
- SJ-WP-F03-PURCHASE-COMMIT-0.1.0-BEGIN
- SJ-CP-F03-04-TRANSACTION-CACHE-FALLBACK-0.1.0
- SJ-WP-F03-PURCHASE-COMMIT-0.1.0-END
- SJ-CP-F03-01-PURCHASE-COMMIT-RECOVERY-0.1.0-BEGIN
- SJ-CP-F03-01-PURCHASE-COMMIT-RECOVERY-0.1.0-END
- SJ-CP-F03-02-PURCHASE-IDENTITY-RECOVERY-0.1.0-BEGIN
- SJ-CP-F03-02-PURCHASE-IDENTITY-RECOVERY-0.1.0-END
- SJ-CP-F03-03-INVENTORY-ROOT-PREFLIGHT-0.1.0-BEGIN
- SJ-CP-F03-03-INVENTORY-ROOT-PREFLIGHT-0.1.0-END
- SJ-WP-F03-SALE-COSTING-0.1.0-BEGIN
- SJ-WP-F03-SALE-COSTING-0.1.0-END
- SJ-WP-F03-REPORT-0.1.0-BEGIN
- SJ-WP-F03-REPORT-0.1.0-END
- SJ-WP-F03-REFUND-COSTING-0.1.0-BEGIN
- SJ-WP-F03-REFUND-COSTING-0.1.0-END
- SJ-WP-F03-PURCHASE-HISTORY-0.1.0-BEGIN
- SJ-WP-F03-PURCHASE-HISTORY-0.1.0-END
- SJ-WP-REP0-REPORT-FOUNDATION-0.1.2
- SJ-REP0-UX-03-CROSS-PERIOD-MOVEMENT-EVIDENCE-0.1.0
- SJ-CP-REP0-UX-01-HPP-LABA-ROW-SEMANTICS
- SJ-CP-REP0-UI-01-KPI-INSTRUMENT-ICON-REFINEMENT
- SJ-REP0-UX-04-MOVEMENT-REF-HYDRATION-0.1.4
- SJ-CP-REP0-UI-02-STYLE-0.2.0
- SJ-CP-REP0-UI-02-FULL-VISUAL-PARITY-0.2.0
- SJ-REFINEMENT-DS01-APP-SHELL-1.0.0
- SJ-REFINEMENT-UI01-APP-SHELL-1.0.0
- SJ-REFINEMENT-UI01-NAV-LABEL-RECONCILIATION-1.0.1
- SJ-REFINEMENT-UI02-ROLE-DASHBOARD-1.0.0
- SJ-REFINEMENT-UI02-LEGACY-TAIL-CLEANUP-1.0.1
- SJ-REFINEMENT-UI03A-SALES-PERSISTENT-CART-1.0.0
- SJ-REFINEMENT-UI03B-CART-CHECKOUT-HANDOFF-1.0.0
- SJ-REFINEMENT-VC01A-DASHBOARD-COMMERCE-VISUAL-1.0.0
- SJ-REFINEMENT-VC01A1-VISUAL-PARITY-CORRECTION-1.0.0
- SJ-REFINEMENT-VC01A2-CART-CHECKOUT-NAV-CONVERGENCE-1.0.0
- SJ-REFINEMENT-VC01B-QRIS-TRANSFER-KASBON-1.0.0
- SJ-REFINEMENT-VC01B1-PAYMENT-RENDERER-CORRECTION-1.0.0
- SJ-REFINEMENT-VC02A-OPERATIONAL-STOCK-RESTOCK-1.0.0

## Firebase write sites

| Line | Operation | Snippet |
|---:|---|---|
| 1369 | set | function sjAudit(action,detail,extra){var id=sjPushKey(DB_PATH+'/global/auditLogs');var row=Object.assign({id:id,action:action,detail:detail\|\|'',user:currentUserName\|\|'-',userId:currentLoginId\|\|'-',role:currentUserRole\|\|'-',at:sjNowIso(),ts:Date.now(),shift:activeDate\|\|''},extra\|\|{});return db.ref(DB_PATH+'/global/auditLogs/'+id).set(row).catch(e=>sjSaveErro |
| 1371 | set | function sjConcatBytes(a,b){var out=new Uint8Array(a.length+b.length);out.set(a,0);out.set(b,a.length);return out} |
| 1371 | set | function sjConcatBytes(a,b){var out=new Uint8Array(a.length+b.length);out.set(a,0);out.set(b,a.length);return out} |
| 1376 | set | var bitLen=data.length*8,total=((data.length+9+63)>>6)<<6,msg=new Uint8Array(total);msg.set(data);msg[data.length]=0x80; |
| 1382 | set | function sjHmacSha256Pure(key,msg){key=key instanceof Uint8Array?key:new Uint8Array(key);msg=msg instanceof Uint8Array?msg:new Uint8Array(msg);if(key.length>64)key=sjSha256BytesPure(key);var block=new Uint8Array(64);block.set(key);var ipad=new Uint8Array(64),opad=new Uint8Array(64);for(var i=0;i<64;i++){ipad[i]=block[i]^0x36;opad[i]=block[i]^0x5c}return sjSh |
| 1387 | update | async function sjMigrateLegacyPin(username,pin,userObj){try{if(!sjHasWebCrypto())return;if(userObj&&userObj.pass!=null&&!userObj.pinHash){var h=await sjHashPin(username,pin);await db.ref(DB_PATH+'/global/users/'+username).update({pinHash:h,pinAlgo:'PBKDF2-SHA256',pinVersion:2,pass:null,updatedAt:sjNowIso()});if(cloudData.global.users&&cloudData.global.users[ |
| 1391 | remove | function sjDownloadBlob(blob,filename){var url=URL.createObjectURL(blob);var a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(url)},500)} |
| 1483 | update | function saveStoreSettings(){let nNama=document.getElementById('set-nama').value.toUpperCase();let nLogo=document.getElementById('set-logo-val').value;let nQris=document.getElementById('set-qris-val').value;if(!nNama)return alert("Nama tidak boleh kosong!");db.ref(DB_PATH+'/global/settings').update({nama:nNama,logo:nLogo,qris:nQris}).then(function(){alert("P |
| 1524 | set | }else{var ref2=db.ref(DB_PATH+'/'+activeDate);var cb2=function(snap){var v=snap.val();if(!v){v=emptyDay();db.ref(DB_PATH+'/'+activeDate).set(v).catch(e=>sjSaveError('CREATE_SHIFT',e))}cloudData[activeDate]=v;renderApp()};ref2.on('value',cb2);dailyListener={ref:ref2,cb:cb2}} |
| 1538 | remove | function showView(n){if(currentUserRole==='transaksi'&&n===4)return alert('Akses Ditolak!');document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));document.getElementById('view'+n).classList.add('active');document.getElementById('tab'+n).classList.add('active' |
| 1538 | remove | function showView(n){if(currentUserRole==='transaksi'&&n===4)return alert('Akses Ditolak!');document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));document.getElementById('view'+n).classList.add('active');document.getElementById('tab'+n).classList.add('active' |
| 1561 | remove | function updateMenuBadges(){document.querySelectorAll('.item-qty-badge').forEach(function(b){b.classList.remove('show');b.textContent='0'});document.querySelectorAll('.item-minus-btn').forEach(function(b){b.classList.remove('show')});cart.forEach(function(i){var badge=document.getElementById('badge-qty-'+i.id);var minusBtn=document.getElementById('minus-btn- |
| 1561 | remove | function updateMenuBadges(){document.querySelectorAll('.item-qty-badge').forEach(function(b){b.classList.remove('show');b.textContent='0'});document.querySelectorAll('.item-minus-btn').forEach(function(b){b.classList.remove('show')});cart.forEach(function(i){var badge=document.getElementById('badge-qty-'+i.id);var minusBtn=document.getElementById('minus-btn- |
| 1563 | remove | function quickAddCart(id){if(window.SJShift&&!SJShift.guardTransaction())return;if(isDayLocked())return alert(isRecapMode?'MODE REKAP: pilih shift spesifik untuk transaksi.':'SHIFT INI SUDAH DIKUNCI!');var m=(cloudData.global.menu\|\|[]).find(x=>String(x.id)===String(id));if(!m)return;if(m.unavailableDate===activeDateOnly)return showToast(m.n+' tidak tersedia  |
| 1563 | remove | function quickAddCart(id){if(window.SJShift&&!SJShift.guardTransaction())return;if(isDayLocked())return alert(isRecapMode?'MODE REKAP: pilih shift spesifik untuk transaksi.':'SHIFT INI SUDAH DIKUNCI!');var m=(cloudData.global.menu\|\|[]).find(x=>String(x.id)===String(id));if(!m)return;if(m.unavailableDate===activeDateOnly)return showToast(m.n+' tidak tersedia  |
| 1563 | remove | function quickAddCart(id){if(window.SJShift&&!SJShift.guardTransaction())return;if(isDayLocked())return alert(isRecapMode?'MODE REKAP: pilih shift spesifik untuk transaksi.':'SHIFT INI SUDAH DIKUNCI!');var m=(cloudData.global.menu\|\|[]).find(x=>String(x.id)===String(id));if(!m)return;if(m.unavailableDate===activeDateOnly)return showToast(m.n+' tidak tersedia  |
| 1565 | remove | function updateCartUI(){var totQ=0,totP=0;cart.forEach(function(i){totQ+=i.q;totP+=(i.p*i.q)});var fb=document.getElementById('floating-cart');if(totQ>0){fb.classList.add('show');document.getElementById('float-qty').textContent=totQ;document.getElementById('float-tot').textContent=fmt(totP)}else{fb.classList.remove('show')}updateMenuBadges()} |
| 1571 | update | async function saveKas(){if(isDayLocked())return;try{await sjTimeout(db.ref(DB_PATH+'/'+activeDate).update({kasAwal:getNum(document.getElementById('m-pagi').value),setoran:getNum(document.getElementById('m-setor').value),uangLaci:getNum(document.getElementById('m-laci').value)}),8000,'SHIFT_SAVE_TIMEOUT')}catch(e){sjSaveError('SAVE_KAS',e);showToast(sjFriend |
| 1572 | set | function upAbsen(v){if(isDayLocked())return;db.ref(DB_PATH+'/'+activeDate+'/absen').set(v).then(()=>sjAudit('ABSEN','Ubah absen '+v)).catch(e=>{sjSaveError('ABSEN',e);showToast(sjFriendlyError(e),'error')})} |
| 1575 | set | function upCup(k,v){if(isDayLocked())return;db.ref(DB_PATH+'/'+activeDate+'/cpPlus/'+k).set(getNum(v))} |
| 1576 | set | function upCupRusak(k,v){if(isDayLocked())return;db.ref(DB_PATH+'/'+activeDate+'/cpRusak/'+k).set(getNum(v))} |
| 1577 | set | function upBak(id,v){if(isDayLocked())return;db.ref(DB_PATH+'/'+activeDate+'/bk/'+id).set(getNum(v))} |
| 1585 | remove | function selMet(m){payMethod=m;document.querySelectorAll('.m-card').forEach(function(e){e.classList.remove('active')});var btnId=m==='Tunai'?'btn-tunai':(m==='QRIS'?'btn-qris':(m==='Transfer'?'btn-tf':'btn-kasbon'));var btn=document.getElementById(btnId);if(btn)btn.classList.add('active');var areaT=document.getElementById('area-tunai');if(areaT)areaT.style.d |
| 1594 | transaction | for(const ci of cart){var p=(cloudData.global.menu\|\|[]).find(m=>String(m.id)===String(ci.id));if(!p\|\|!sjTrackStock(p))continue;var q=sjNum(ci.q),fallback=sjStockQty(p);var ref=db.ref(DB_PATH+'/global/inventory/'+p.id);var tr=await sjTimeout(ref.transaction(cur=>{var n=cur==null?fallback:sjNum(cur);if(n<q)return;return n-q}),8000,'STOCK_TIMEOUT');if(!tr.commi |
| 1602 | update | try{await sjTimeout(db.ref(DB_PATH).update(upd),10000,'TX_WRITE_TIMEOUT')}catch(e){var verify=await sjTimeout(db.ref(DB_PATH+'/'+base+'/tx/'+txId).once('value'),4000,'TX_VERIFY_TIMEOUT').catch(()=>null);if(!(verify&&verify.exists()))throw e} |
| 1604 | transaction | }catch(e){sjSaveError('TRANSACTION',e);var check=null;try{check=await db.ref(DB_PATH+'/'+activeDate+'/tx/'+txId).once('value')}catch(_){}if(!(check&&check.exists())){for(const r of reserved){try{await db.ref(DB_PATH+'/global/inventory/'+r.id).transaction(cur=>sjNum(cur)+r.q)}catch(_){}}}alert('❌ '+sjFriendlyError(e))}finally{SJ_TX_BUSY=false;sjSetBusy(btn,fa |
| 1620 | set | function addKategori(){var v=document.getElementById('new-kat-name').value.toUpperCase();if(!v)return;if(cloudData.global.kategori.indexOf(v)===-1){cloudData.global.kategori.push(v);db.ref(DB_PATH+'/global/kategori').set(cloudData.global.kategori);document.getElementById('new-kat-name').value="";populateKatSelects();renderMasterData()}} |
| 1621 | set | function delKategori(i){if(confirm("Hapus kategori?")){cloudData.global.kategori.splice(i,1);db.ref(DB_PATH+'/global/kategori').set(cloudData.global.kategori);populateKatSelects();renderMasterData()}} |
| 1624 | set | async function saveMenu(){var c=document.getElementById('new-c').value.toUpperCase(),n=document.getElementById('new-n').value.toUpperCase(),p=getNum(document.getElementById('new-p').value),cp=document.getElementById('new-cp').value.toLowerCase(),img=document.getElementById('new-i').value,track=!!document.getElementById('sj-new-track')?.checked,min=sjNum(docu |
| 1624 | set | async function saveMenu(){var c=document.getElementById('new-c').value.toUpperCase(),n=document.getElementById('new-n').value.toUpperCase(),p=getNum(document.getElementById('new-p').value),cp=document.getElementById('new-cp').value.toLowerCase(),img=document.getElementById('new-i').value,track=!!document.getElementById('sj-new-track')?.checked,min=sjNum(docu |
| 1628 | set | async function saveEditMaster(){var id=document.getElementById('edit-m-id').value,menu=(cloudData.global.menu\|\|[]).slice(),idx=menu.findIndex(x=>String(x.id)===String(id));if(idx<0)return;var m=Object.assign({},menu[idx]);m.c=document.getElementById('edit-m-c').value.toUpperCase();m.n=document.getElementById('edit-m-n').value.toUpperCase();m.p=getNum(documen |
| 1628 | set | async function saveEditMaster(){var id=document.getElementById('edit-m-id').value,menu=(cloudData.global.menu\|\|[]).slice(),idx=menu.findIndex(x=>String(x.id)===String(id));if(idx<0)return;var m=Object.assign({},menu[idx]);m.c=document.getElementById('edit-m-c').value.toUpperCase();m.n=document.getElementById('edit-m-n').value.toUpperCase();m.p=getNum(documen |
| 1630 | update | async function deleteMasterProduct(){var id=document.getElementById('edit-m-id').value;if(!confirm('Yakin hapus produk ini?'))return;var menu=(cloudData.global.menu\|\|[]).filter(x=>String(x.id)!==String(id));try{var u={};u['global/menu']=menu;u['global/inventory/'+id]=null;await db.ref(DB_PATH).update(u);clsModal('modal-edit-master');showToast('Produk dihapus |
| 1632 | set | async function saveUser(){if(currentUserRole!=='manajemen')return alert('Hanya Owner.');var id=document.getElementById('usr-id').value.trim().toLowerCase(),nama=document.getElementById('usr-nama').value.trim(),pin=document.getElementById('usr-pass').value.trim(),role=document.getElementById('usr-role').value;if(!id\|\|!nama\|\|pin.length<4)return alert('Username |
| 1633 | remove | async function deleteUser(id){if(currentUserRole!=='manajemen'\|\|id==='admin')return;if(!confirm('Hapus user '+id+'?'))return;try{await db.ref(DB_PATH+'/global/users/'+id).remove();sjAudit('USER_DELETE',id)}catch(e){sjSaveError('USER_DELETE',e);alert(sjFriendlyError(e))}} |
| 1706 | remove | setTimeout(() => toast.remove(), 300); |
| 1713 | remove | function hideLoading(){var e=document.getElementById('global-loading');if(e){if(e._timer)clearTimeout(e._timer);e.remove()}} |
| 1716 | update | function hapusSemuaTransaksi(){if(currentUserRole!=='manajemen')return alert('Hanya Owner.');showModalInput('Hapus Semua Transaksi','Masukkan PIN Owner',async function(pin){if(!(await sjVerifyCurrentOwnerPin(pin)))return alert('PIN salah.');if(!confirm('Semua data shift/transaksi akan dihapus. Master produk, akun, hutang dan kasbon tetap ada. Lanjutkan?'))re |
| 1722 | update | async function simpanKasbonKaryawan(){if(currentUserRole!=='manajemen')return showToast('Kasbon karyawan hanya dapat dikelola Owner.','error');if(isDayLocked())return alert('SHIFT SUDAH DIKUNCI!');var nama=document.getElementById('kasbon-nama').value.trim(),nom=getNum(document.getElementById('kasbon-nominal').value),ket=document.getElementById('kasbon-ketera |
| 1727 | remove | function resetDay(){if(currentUserRole!=='manajemen')return alert('Hanya Owner.');showModalInput('Hapus Shift Aktif','Masukkan PIN Owner',async function(pin){if(!(await sjVerifyCurrentOwnerPin(pin)))return alert('PIN salah.');if(!confirm('Hapus semua data '+activeDate+'?'))return;showLoading('Menghapus shift...');try{await sjTimeout(db.ref(DB_PATH+'/'+active |
| 1730 | update | function clearServerData(){if(currentUserRole!=='manajemen')return alert('Hanya Owner.');showModalInput('Kosongkan Produk Server','Masukkan PIN Owner',async function(pin){if(!(await sjVerifyCurrentOwnerPin(pin)))return alert('PIN salah.');if(!confirm('Semua produk, kategori, dan inventory akan dihapus. Lanjutkan?'))return;showLoading('Menghapus master produk |
| 1733 | update | function voidTx(idx){if(isDayLocked())return alert('SHIFT SUDAH DIKUNCI!');var rows=sjTxEntries((cloudData[activeDate]\|\|{}).tx),t=rows[idx];if(!t)return;if(t.status==='VOIDED')return alert('Transaksi sudah VOID.');showModalInput('Alasan VOID','Contoh: salah input / customer batal',function(reason){if(!reason)return;showModalInput('PIN Owner','Masukkan PIN Ow |
| 1733 | transaction | function voidTx(idx){if(isDayLocked())return alert('SHIFT SUDAH DIKUNCI!');var rows=sjTxEntries((cloudData[activeDate]\|\|{}).tx),t=rows[idx];if(!t)return;if(t.status==='VOIDED')return alert('Transaksi sudah VOID.');showModalInput('Alasan VOID','Contoh: salah input / customer batal',function(reason){if(!reason)return;showModalInput('PIN Owner','Masukkan PIN Ow |
| 1733 | transaction | function voidTx(idx){if(isDayLocked())return alert('SHIFT SUDAH DIKUNCI!');var rows=sjTxEntries((cloudData[activeDate]\|\|{}).tx),t=rows[idx];if(!t)return;if(t.status==='VOIDED')return alert('Transaksi sudah VOID.');showModalInput('Alasan VOID','Contoh: salah input / customer batal',function(reason){if(!reason)return;showModalInput('PIN Owner','Masukkan PIN Ow |
| 1736 | set | function tutupBukuBulanan(){if(currentUserRole!=='manajemen')return alert('Hanya Owner.');var bln=activeDateOnly.substring(0,7),locked=cloudData.global.lockedMonths\|\|[];if(locked.includes(bln))return alert('Bulan sudah ditutup.');showModalInput('Tutup Buku '+bln,'Masukkan PIN Owner',async function(pin){if(!(await sjVerifyCurrentOwnerPin(pin)))return alert('P |
| 1742 | set | function restoreDatabase(event){var file=event.target.files[0];event.target.value='';if(!file)return;if(currentUserRole!=='manajemen')return alert('Hanya Owner.');if(!confirm('Restore akan mengganti seluruh data toko dengan isi file backup. Lanjutkan?'))return;var r=new FileReader();r.onload=async function(ev){showLoading('Memeriksa & memulihkan database...' |
| 1755 | remove | btn.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active')); |
| 1764 | remove | btn.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active')); |
| 1771 | remove | document.getElementById('modal-hapus-granular').classList.remove('show'); |
| 1846 | update | async function executeHapusGranular(){var pass=document.getElementById('hapus-granular-password').value;if(!(await sjVerifyCurrentOwnerPin(pass)))return alert('PIN salah.');if(!confirm('Data yang dipilih akan dihapus permanen. Lanjutkan?'))return;var selectedUsers=Array.from(document.querySelectorAll('#list-user input:checked')).map(x=>String(x.dataset.user\| |
| 1850 | update | async function sjSaveExpense(){if(isDayLocked())return;var btn=document.getElementById('sj-exp-save'),cat=document.getElementById('sj-exp-category').value,desc=document.getElementById('sj-exp-desc').value.trim(),amount=getNum(document.getElementById('sj-exp-amount').value),source=sjNormFundSource(document.getElementById('sj-exp-source')?.value\|\|'CASH');if(!d |
| 1851 | remove | async function deleteExpense(key){if(currentUserRole!=='manajemen'\|\|isDayLocked())return;if(!confirm('Hapus pengeluaran ini?'))return;try{await db.ref(DB_PATH+'/'+activeDate+'/opex/'+key).remove();sjAudit('EXPENSE_DELETE',key)}catch(e){sjSaveError('EXPENSE_DELETE',e);alert(sjFriendlyError(e))}} |
| 1853 | update | async function sjSavePayment(){if(!SJ_ACTIVE_PAYMENT\|\|isDayLocked())return;if(SJ_ACTIVE_PAYMENT.type==='advance'&&currentUserRole!=='manajemen')return showToast('Pembayaran kasbon karyawan hanya dapat dilakukan Owner.','error');var btn=document.getElementById('sj-pay-save'),amt=getNum(document.getElementById('sj-pay-amount').value),method=sjNormPaymentMethod |
| 1857 | set | async function sjSaveStock(){var id=document.getElementById('sj-stock-product').value,mode=document.getElementById('sj-stock-mode').value,qty=getNum(document.getElementById('sj-stock-qty').value),note=document.getElementById('sj-stock-note').value.trim(),p=(cloudData.global.menu\|\|[]).find(x=>String(x.id)===String(id)),btn=document.getElementById('sj-stock-sa |
| 1857 | set | async function sjSaveStock(){var id=document.getElementById('sj-stock-product').value,mode=document.getElementById('sj-stock-mode').value,qty=getNum(document.getElementById('sj-stock-qty').value),note=document.getElementById('sj-stock-note').value.trim(),p=(cloudData.global.menu\|\|[]).find(x=>String(x.id)===String(id)),btn=document.getElementById('sj-stock-sa |
| 1857 | transaction | async function sjSaveStock(){var id=document.getElementById('sj-stock-product').value,mode=document.getElementById('sj-stock-mode').value,qty=getNum(document.getElementById('sj-stock-qty').value),note=document.getElementById('sj-stock-note').value.trim(),p=(cloudData.global.menu\|\|[]).find(x=>String(x.id)===String(id)),btn=document.getElementById('sj-stock-sa |
| 1877 | set | async function sjTestFirebase(){var out=document.getElementById('sj-diag-firebase'),start=performance.now(),id='diag_'+Date.now();out.textContent='Menguji...';try{await sjTimeout(db.ref(DB_PATH+'/global/_diagnostics/'+id).set({at:sjNowIso()}),8000,'DIAG_WRITE_TIMEOUT');var s=await sjTimeout(db.ref(DB_PATH+'/global/_diagnostics/'+id).once('value'),8000,'DIAG_ |
| 1877 | remove | async function sjTestFirebase(){var out=document.getElementById('sj-diag-firebase'),start=performance.now(),id='diag_'+Date.now();out.textContent='Menguji...';try{await sjTimeout(db.ref(DB_PATH+'/global/_diagnostics/'+id).set({at:sjNowIso()}),8000,'DIAG_WRITE_TIMEOUT');var s=await sjTimeout(db.ref(DB_PATH+'/global/_diagnostics/'+id).once('value'),8000,'DIAG_ |
| 1915 | set | if(!owner&&currentLoginId)sjArr(cloudData.global.restockRequests).filter(x=>String(x.requestedById\|\|'')===String(currentLoginId)).forEach(x=>{if(!this.restockState.has(x._key))this.restockState.set(x._key,x.status\|\|'WAITING')}); |
| 1919 | remove | openDashboard(){if(currentUserRole!=='manajemen')return showView(1);document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));document.getElementById('view5').classList.add('active');document.getElementById('tab5').classList.add('active');this.renderDashboard()}, |
| 1919 | remove | openDashboard(){if(currentUserRole!=='manajemen')return showView(1);document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));document.getElementById('view5').classList.add('active');document.getElementById('tab5').classList.add('active');this.renderDashboard()}, |
| 1929 | set | if(currentUserRole==='transaksi'){rows.filter(x=>String(x.requestedById\|\|'')===String(currentLoginId)).forEach(x=>{var prev=this.restockState.get(x._key);if(prev&&prev!==x.status){if(x.status==='PROCESS')this.notify('Restock Diproses',(x.productName\|\|'Produk')+' sedang diproses Owner.');else if(x.status==='SENT')this.notify('Stok Sudah Dikirim',(x.productNam |
| 1934 | set | async saveRestockRequest(){if(currentUserRole!=='transaksi')return showToast('Hanya Kasir yang membuat Permintaan Restock.','error');var pid=document.getElementById('sjx-restock-pid').value,p=(cloudData.global.menu\|\|[]).find(x=>String(x.id)===String(pid)),q=sjNum(document.getElementById('sjx-restock-qty').value),note=document.getElementById('sjx-restock-note |
| 1934 | set | async saveRestockRequest(){if(currentUserRole!=='transaksi')return showToast('Hanya Kasir yang membuat Permintaan Restock.','error');var pid=document.getElementById('sjx-restock-pid').value,p=(cloudData.global.menu\|\|[]).find(x=>String(x.id)===String(pid)),q=sjNum(document.getElementById('sjx-restock-qty').value),note=document.getElementById('sjx-restock-note |
| 1947 | set | async restockTransition(key,toStatus,reason){var owner=currentUserRole==='manajemen',expected={PROCESS:'WAITING',SENT:'PROCESS',REJECTED:'WAITING'}[toStatus];if(!owner\|\|!expected)return showToast('Aksi Restock ini hanya dapat dilakukan Owner.','error');var ref=db.ref(DB_PATH+'/global/restockRequests/'+key);try{var tr=await sjTimeout(ref.transaction(cur=>{if( |
| 1947 | transaction | async restockTransition(key,toStatus,reason){var owner=currentUserRole==='manajemen',expected={PROCESS:'WAITING',SENT:'PROCESS',REJECTED:'WAITING'}[toStatus];if(!owner\|\|!expected)return showToast('Aksi Restock ini hanya dapat dilakukan Owner.','error');var ref=db.ref(DB_PATH+'/global/restockRequests/'+key);try{var tr=await sjTimeout(ref.transaction(cur=>{if( |
| 1950 | set | async cancelRestock(key){if(currentUserRole==='manajemen')return showToast('Gunakan TOLAK untuk membatalkan permintaan sebagai Owner.','warning');var ref=db.ref(DB_PATH+'/global/restockRequests/'+key);try{var tr=await sjTimeout(ref.transaction(cur=>{if(!cur\|\|cur.status!=='WAITING'\|\|String(cur.requestedById\|\|'')!==String(currentLoginId))return;return Object.a |
| 1950 | transaction | async cancelRestock(key){if(currentUserRole==='manajemen')return showToast('Gunakan TOLAK untuk membatalkan permintaan sebagai Owner.','warning');var ref=db.ref(DB_PATH+'/global/restockRequests/'+key);try{var tr=await sjTimeout(ref.transaction(cur=>{if(!cur\|\|cur.status!=='WAITING'\|\|String(cur.requestedById\|\|'')!==String(currentLoginId))return;return Object.a |
| 1951 | update | async receiveRestock(key){var local=sjArr(cloudData.global.restockRequests).find(r=>r._key===key);if(!local)return;if(currentUserRole==='manajemen')return showToast('Penerimaan stok harus dikonfirmasi Kasir setelah barang fisik sampai.','warning');if(String(local.requestedById\|\|'')!==String(currentLoginId))return showToast('Anda hanya dapat menerima perminta |
| 1951 | update | async receiveRestock(key){var local=sjArr(cloudData.global.restockRequests).find(r=>r._key===key);if(!local)return;if(currentUserRole==='manajemen')return showToast('Penerimaan stok harus dikonfirmasi Kasir setelah barang fisik sampai.','warning');if(String(local.requestedById\|\|'')!==String(currentLoginId))return showToast('Anda hanya dapat menerima perminta |
| 1951 | transaction | async receiveRestock(key){var local=sjArr(cloudData.global.restockRequests).find(r=>r._key===key);if(!local)return;if(currentUserRole==='manajemen')return showToast('Penerimaan stok harus dikonfirmasi Kasir setelah barang fisik sampai.','warning');if(String(local.requestedById\|\|'')!==String(currentLoginId))return showToast('Anda hanya dapat menerima perminta |
| 1951 | transaction | async receiveRestock(key){var local=sjArr(cloudData.global.restockRequests).find(r=>r._key===key);if(!local)return;if(currentUserRole==='manajemen')return showToast('Penerimaan stok harus dikonfirmasi Kasir setelah barang fisik sampai.','warning');if(String(local.requestedById\|\|'')!==String(currentLoginId))return showToast('Anda hanya dapat menerima perminta |
| 1951 | transaction | async receiveRestock(key){var local=sjArr(cloudData.global.restockRequests).find(r=>r._key===key);if(!local)return;if(currentUserRole==='manajemen')return showToast('Penerimaan stok harus dikonfirmasi Kasir setelah barang fisik sampai.','warning');if(String(local.requestedById\|\|'')!==String(currentLoginId))return showToast('Anda hanya dapat menerima perminta |
| 1954 | update | async saveShiftNote(){var t=document.getElementById('sjx-shift-note-text').value.trim();try{await db.ref(DB_PATH+'/'+activeDate).update({shiftNote:t,shiftNoteUpdatedAt:sjNowIso(),shiftNoteUpdatedBy:currentUserName});showToast('Catatan shift disimpan.','success');sjAudit('SHIFT_NOTE',t.slice(0,80))}catch(e){alert(sjFriendlyError(e))}}, |
| 1957 | set | async saveCashMovement(){if(currentUserRole!=='manajemen')return showToast('Mutasi Kas hanya dapat dilakukan Owner.','error');var dir=document.getElementById('sjx-cash-dir').value,a=getNum(document.getElementById('sjx-cash-amount').value),note=document.getElementById('sjx-cash-note').value.trim();if(a<=0\|\|!note)return alert('Nominal dan alasan wajib diisi.') |
| 1960 | set | async savePerson(){var type=document.getElementById('sjx-person-type').value,name=document.getElementById('sjx-person-name').value.trim(),phone=document.getElementById('sjx-person-phone').value.trim(),note=document.getElementById('sjx-person-note').value.trim();if(!name)return alert('Nama wajib diisi.');try{var node=type==='customer'?'customers':'employees', |
| 1963 | update | async processRefund(){if(currentUserRole!=='manajemen')return alert('Hanya Owner.');var t=this.refundTx;if(!t)return;var sel=Array.from(document.querySelectorAll('.sjx-ref-item:checked')).map(x=>Number(x.dataset.i)),items=(t.cartData\|\|[]).filter((_,i)=>sel.includes(i));if(!items.length)return alert('Pilih minimal satu item.');showModalInput('PIN Owner','Masu |
| 1963 | transaction | async processRefund(){if(currentUserRole!=='manajemen')return alert('Hanya Owner.');var t=this.refundTx;if(!t)return;var sel=Array.from(document.querySelectorAll('.sjx-ref-item:checked')).map(x=>Number(x.dataset.i)),items=(t.cartData\|\|[]).filter((_,i)=>sel.includes(i));if(!items.length)return alert('Pilih minimal satu item.');showModalInput('PIN Owner','Masu |
| 1963 | transaction | async processRefund(){if(currentUserRole!=='manajemen')return alert('Hanya Owner.');var t=this.refundTx;if(!t)return;var sel=Array.from(document.querySelectorAll('.sjx-ref-item:checked')).map(x=>Number(x.dataset.i)),items=(t.cartData\|\|[]).filter((_,i)=>sel.includes(i));if(!items.length)return alert('Pilih minimal satu item.');showModalInput('PIN Owner','Masu |
| 1964 | set | async toggleAvailability(id){var menu=(cloudData.global.menu\|\|[]).slice(),i=menu.findIndex(x=>String(x.id)===String(id));if(i<0)return;menu[i]=Object.assign({},menu[i]);menu[i].unavailableDate=menu[i].unavailableDate===activeDateOnly?'':activeDateOnly;try{await db.ref(DB_PATH+'/global/menu').set(menu);showToast(menu[i].unavailableDate?'Produk ditandai tidak  |
| 1969 | update | async savePushSettings(){var en=document.getElementById('sjx-push-enabled').checked,url=document.getElementById('sjx-push-url').value.trim();if(en&&!/^https:\/\//i.test(url))return alert('Webhook wajib HTTPS.');try{await db.ref(DB_PATH+'/global/settings').update({pushEnabled:en,pushWebhook:url});showToast('Pengaturan push disimpan.','success')}catch(e){alert |
| 2036 | set | function sjHandleNotificationClick(key){var n=sjArr(cloudData.global.notifications).find(x=>String(x._key)===String(key));if(!n)return;db.ref(DB_PATH+'/global/notifications/'+key+'/read').set(true).catch(()=>{});clsModal('modal-sjx-notif');SJX.updateBell();var type=String(n.type\|\|'').toUpperCase(),target=String(n.targetView\|\|'').toUpperCase();if(type.indexOf |
| 2036 | remove | function sjHandleNotificationClick(key){var n=sjArr(cloudData.global.notifications).find(x=>String(x._key)===String(key));if(!n)return;db.ref(DB_PATH+'/global/notifications/'+key+'/read').set(true).catch(()=>{});clsModal('modal-sjx-notif');SJX.updateBell();var type=String(n.type\|\|'').toUpperCase(),target=String(n.targetView\|\|'').toUpperCase();if(type.indexOf |
| 2131 | transaction | var tr=await sjTimeout(controlRef.transaction(cur=>{if(cur&&cur.status==='ACTIVE')return;return{status:'ACTIVE',currentSessionId:sessionId,currentCashierId:targetId,currentCashierName:targetName,startedAt:sjNowIso(),version:1}}),8000,'SHIFT_START_LOCK_TIMEOUT');if(!tr.committed)throw Object.assign(new Error('Shift sudah diambil pengguna lain.'),{code:'SHIFT_ |
| 2133 | transaction | }catch(e){if(reserved){try{await controlRef.transaction(cur=>{if(cur&&String(cur.currentSessionId\|\|'')===String(sessionId))return null;return})}catch(_){}}sjSaveError('SHIFT_SESSION_START',e);alert(sjFriendlyError(e))}finally{this.busy=false;sjSetBusy(btn,false)} |
| 2140 | set | var tr=await sjTimeout(controlRef.transaction(cur=>{if(!cur\|\|cur.status!=='ACTIVE'\|\|String(cur.currentSessionId)!==String(oldId))return;return{status:'ACTIVE',currentSessionId:newId,currentCashierId:targetId,currentCashierName:targetName,startedAt:cur.startedAt\|\|sjNowIso(),lastHandoverAt:sjNowIso(),version:sjNum(cur.version)+1}}),8000,'HANDOVER_LOCK_TIMEOUT' |
| 2140 | transaction | var tr=await sjTimeout(controlRef.transaction(cur=>{if(!cur\|\|cur.status!=='ACTIVE'\|\|String(cur.currentSessionId)!==String(oldId))return;return{status:'ACTIVE',currentSessionId:newId,currentCashierId:targetId,currentCashierName:targetName,startedAt:cur.startedAt\|\|sjNowIso(),lastHandoverAt:sjNowIso(),version:sjNum(cur.version)+1}}),8000,'HANDOVER_LOCK_TIMEOUT' |
| 2141 | transaction | }catch(e){if(reserved){try{await controlRef.transaction(cur=>{if(cur&&String(cur.currentSessionId\|\|'')===String(newId))return oldControl;return})}catch(_){}}sjSaveError('SHIFT_HANDOVER',e);alert(sjFriendlyError(e))}finally{this.busy=false;sjSetBusy(btn,false)} |
| 2149 | transaction | var tr=await sjTimeout(controlRef.transaction(cur=>{if(!cur\|\|cur.status!=='ACTIVE'\|\|String(cur.currentSessionId)!==String(sid))return;return Object.assign({},cur,{status:'CLOSING',closingAt:sjNowIso(),closingById:currentLoginId,closingBy:currentUserName,version:sjNum(cur.version)+1})}),8000,'SHIFT_CLOSE_LOCK_TIMEOUT');if(!tr.committed)throw new Error('Sesi s |
| 2151 | transaction | }catch(e){if(reserved){try{await controlRef.transaction(cur=>{if(cur&&String(cur.currentSessionId\|\|'')===String(sid)&&String(cur.status\|\|'')==='CLOSING')return oldControl;return})}catch(_){}}sjSaveError('SHIFT_SESSION_CLOSE',e);if(e.code==='SHIFT_NOTE_REQUIRED')alert(e.message);else alert(sjFriendlyError(e))}finally{this.busy=false;sjSetBusy(btn,false)} |
| 2181 | remove | imageFallback(el){try{if(!el\|\|el.dataset.sjFallback==='1')return;el.dataset.sjFallback='1';var p=el.parentElement;if(!p)return;el.remove();p.classList.add('sjpro-image-fallback');p.innerHTML=this.icon('package')}catch(_){}}, |
| 2193 | remove | syncIdentity(){var app=document.getElementById('app-wrapper');if(app)app.dataset.role=currentUserRole\|\|'';var name=(typeof TOKO_NAMA!=='undefined'&&TOKO_NAMA?TOKO_NAMA:(document.getElementById('header-toko-name')?.textContent\|\|'Segeran Jiwa')).trim(),logo=(typeof TOKO_LOGO!=='undefined'?String(TOKO_LOGO\|\|''):'');var s=document.getElementById('sjpro-side-stor |
| 2193 | remove | syncIdentity(){var app=document.getElementById('app-wrapper');if(app)app.dataset.role=currentUserRole\|\|'';var name=(typeof TOKO_NAMA!=='undefined'&&TOKO_NAMA?TOKO_NAMA:(document.getElementById('header-toko-name')?.textContent\|\|'Segeran Jiwa')).trim(),logo=(typeof TOKO_LOGO!=='undefined'?String(TOKO_LOGO\|\|''):'');var s=document.getElementById('sjpro-side-stor |
| 2194 | remove | applyNavLabels(){var map={tab5:['dashboard','Dashboard'],tab1:['cart','Penjualan'],tab2:['package','Operasional'],tab3:['chart','Laporan'],tab4:['settings','Manajemen']};Object.keys(map).forEach(id=>{var b=document.getElementById(id);if(!b)return;var ic=b.querySelector('.nav-icon');if(ic)ic.innerHTML=this.icon(map[id][0]);var nodes=Array.from(b.childNodes).f |
| 2252 | set | async markRead(key){if(!key\|\|!currentLoginId)return;try{await db.ref(DB_PATH+'/global/notifications/'+key+'/readBy/'+this.safeReaderKey()).set(true)}catch(e){sjSaveError('NOTIF_READ',e)}}, |
| 2253 | transaction | async menuTransaction(mutator,label){var ref=db.ref(DB_PATH+'/global/menu');var tr=await sjTimeout(ref.transaction(cur=>{var arr=this.menuArray(cur),next=mutator(arr);return next===undefined?undefined:next}),10000,label\|\|'MENU_TX_TIMEOUT');if(!tr.committed)throw new Error('Data produk sudah berubah di perangkat lain. Muat ulang dan coba lagi.');cloudData.glo |
| 2254 | transaction | async categoryTransaction(mutator,label){var ref=db.ref(DB_PATH+'/global/kategori');var tr=await sjTimeout(ref.transaction(cur=>{var arr=this.categoryArray(cur),next=mutator(arr);return next===undefined?undefined:next}),9000,label\|\|'CATEGORY_TX_TIMEOUT');if(!tr.committed)throw new Error('Data kategori sudah berubah di perangkat lain. Muat ulang dan coba lagi |
| 2258 | update | async schemaMeta(){try{await db.ref(DB_PATH+'/global/schema').update({version:'59.3',releaseVersion:'59.3.4',productOrder:true,notificationAudience:true,archiveProducts:true,mobileFirstUX:true,groupedProductCategories:true,updatedAt:sjNowIso()})}catch(e){sjSaveError('SCHEMA_META',e)}}, |
| 2267 | remove | var drawer=Array.from(document.querySelectorAll('.sjpro-drawer-link')).find(b=>/Notifikasi/i.test(b.textContent\|\|''));if(drawer){drawer.classList.remove('sjpro-owner-only');drawer.style.display='flex';drawer.innerHTML=SJX.icon('bell')+' Notifikasi Saya';drawer.onclick=()=>{SJPro.toggleMobileMenu(false);SJX.openNotifications()}}; |
| 2274 | set | SJPro.categoryCatalog=()=>{var products=(cloudData.global.menu\|\|[]).filter(p=>SJHarden.isActiveProduct(p)),master=(cloudData.global.kategori\|\|[]).map(String),used=new Map();products.forEach(p=>{var label=String(p.c\|\|'LAINNYA').trim()\|\|'LAINNYA',key=label.toUpperCase();if(!used.has(key))used.set(key,label)});var out=[],seen=new Set();master.forEach(c=>{var ke |
| 2286 | set | var grouped=new Map();menu.forEach(m=>{var label=String(m.c\|\|'LAINNYA').trim()\|\|'LAINNYA',key=label.toUpperCase();if(!grouped.has(key))grouped.set(key,{label,items:[]});grouped.get(key).items.push(m)}); |
| 2300 | remove | window.sjHandleNotificationClick=async key=>{var n=sjArr(cloudData.global.notifications).find(x=>String(x._key)===String(key));if(!n\|\|!SJHarden.notificationVisible(n))return;await SJHarden.markRead(key);clsModal('modal-sjx-notif');SJX.updateBell();var type=String(n.type\|\|'').toUpperCase(),target=String(n.targetView\|\|'').toUpperCase();if(type.indexOf('RESTOCK |
| 2304 | set | window.saveMenu=async()=>{var c=document.getElementById('new-c').value.toUpperCase(),n=document.getElementById('new-n').value.toUpperCase(),p=getNum(document.getElementById('new-p').value),cp=document.getElementById('new-cp').value.toLowerCase(),img=document.getElementById('new-i').value,track=!!document.getElementById('sj-new-track')?.checked,min=sjNum(docu |
| 2305 | set | window.saveEditMaster=async()=>{var id=document.getElementById('edit-m-id').value,c=document.getElementById('edit-m-c').value.toUpperCase(),n=document.getElementById('edit-m-n').value.toUpperCase(),p=getNum(document.getElementById('edit-m-p').value),cp=document.getElementById('edit-m-cp').value.toLowerCase(),img=document.getElementById('edit-m-i').value,trac |
| 2322 | set | SJX.savePerson=async()=>{var type=document.getElementById('sjx-person-type').value,node=type==='customer'?'customers':'employees',name=document.getElementById('sjx-person-name').value.trim().toUpperCase(),phone=document.getElementById('sjx-person-phone').value.trim(),note=document.getElementById('sjx-person-note').value.trim(),active=document.getElementById( |
| 2322 | update | SJX.savePerson=async()=>{var type=document.getElementById('sjx-person-type').value,node=type==='customer'?'customers':'employees',name=document.getElementById('sjx-person-name').value.trim().toUpperCase(),phone=document.getElementById('sjx-person-phone').value.trim(),note=document.getElementById('sjx-person-note').value.trim(),active=document.getElementById( |
| 2324 | remove | var dashboardBase=SJPro.dashboard.bind(SJPro);SJPro.dashboard=async()=>{var v=await dashboardBase();var a=document.querySelector('#sjx-dashboard-root .sjpro-dashboard-actions');if(a)a.remove();var h=document.querySelector('#sjx-dashboard-root .sjpro-dashboard-head');if(h&&window.innerWidth>=1200)h.style.display='none';return v}; |
| 2395 | set | if(!found.id)await db.ref(DB_PATH+'/global/'+node+'/'+key+'/id').set(id); |
| 2399 | set | await db.ref(DB_PATH+'/global/'+node+'/'+id).set({id:id,name:n,phone:'',note:'Dibuat otomatis dari transaksi legacy/operasional',active:true,createdAt:sjNowIso(),createdBy:currentUserName\|\|'SYSTEM'}); |
| 2411 | set | if(!id){id=await this.ensurePerson('customer',h.nama);cMap.set(key,id)} |
| 2417 | set | if(!id2){id2=await this.ensurePerson('employee',a.nama);eMap.set(key2,id2)} |
| 2421 | update | await sjTimeout(db.ref(DB_PATH).update(updates),12000,'REFERENCE_MIGRATION_TIMEOUT'); |
| 2438 | update | await db.ref(DB_PATH+'/global/transactionReservations/'+key).update({status:'COMMITTED',committedAt:sjNowIso(),recoveredCheckAt:sjNowIso()}); |
| 2441 | transaction | var claim=await sjTimeout(db.ref(DB_PATH+'/global/transactionReservations/'+key).transaction(cur=>{ |
| 2451 | transaction | await sjTimeout(db.ref(DB_PATH+'/global/inventory/'+item.productId).transaction(cur=>sjNum(cur)+q),8000,'RESERVATION_RECOVER_STOCK_TIMEOUT'); |
| 2453 | set | await db.ref(DB_PATH+'/global/stockLedger/'+lid).set({id:lid,productId:item.productId,productName:item.name\|\|'',delta:q,type:'TX_RESERVATION_RECOVERY',refId:txId,user:currentUserName\|\|'SYSTEM',ts:Date.now(),at:sjNowIso(),shift:shift}) |
| 2456 | update | await db.ref(DB_PATH+'/global/transactionReservations/'+key).update({status:'RECOVERY_REVIEW_REQUIRED',recoveredAt:sjNowIso(),recoveredBy:currentLoginId\|\|'SYSTEM',reviewReason:'Prepared stock intent ditemukan; stok tidak dikreditkan otomatis untuk mencegah overstock.',uncertainItems:uncertain.length}); |
| 2459 | update | await db.ref(DB_PATH+'/global/transactionReservations/'+key).update({status:'RECOVERED',recoveredAt:sjNowIso(),recoveredBy:currentLoginId\|\|'SYSTEM'}); |
| 2464 | update | await db.ref(DB_PATH+'/global/transactionReservations/'+key).update({status:'RECOVERY_ERROR',recoveryError:String(e.message\|\|e),recoveryErrorAt:sjNowIso()}).catch(()=>{}) |
| 2473 | transaction | try{await db.ref(DB_PATH+'/global/inventory/'+r.id).transaction(cur=>sjNum(cur)+sjNum(r.q))}catch(e){sjSaveError('TX_ROLLBACK_STOCK',e)} |
| 2475 | update | await db.ref(DB_PATH+'/global/transactionReservations/'+txId).update({status:'ROLLED_BACK',rolledBackAt:sjNowIso(),rollbackReason:String(reason\|\|'TRANSACTION_FAILED')}).catch(()=>{}) |
| 2512 | set | await sjTimeout(db.ref(DB_PATH+'/global/transactionReservations/'+txId+'/reservedItems/'+rk).set({productId:p.id,q:q,name:p.n,state:'PREPARED',preparedAt:sjNowIso()}),5000,'TX_JOURNAL_PREPARE_TIMEOUT'); |
| 2513 | transaction | var tr=await sjTimeout(ref.transaction(cur=>{var n=cur==null?fallback:sjNum(cur);if(n<q)return;return n-q}),8000,'STOCK_TIMEOUT'); |
| 2514 | update | if(!tr.committed){await db.ref(DB_PATH+'/global/transactionReservations/'+txId+'/reservedItems/'+rk).update({state:'REJECTED',rejectedAt:sjNowIso()}).catch(()=>{});throw Object.assign(new Error('Stok '+p.n+' tidak mencukupi.'),{code:'STOCK_LOW'})} |
| 2517 | update | await sjTimeout(db.ref(DB_PATH+'/global/transactionReservations/'+txId+'/reservedItems/'+rk).update({state:'RESERVED',reservedAt:sjNowIso(),afterQty:sjNum(tr.snapshot.val())}),5000,'TX_JOURNAL_ITEM_TIMEOUT'); |
| 2518 | update | await db.ref(DB_PATH+'/global/transactionReservations/'+txId).update({lastActivityTs:Date.now(),lastActivityAt:sjNowIso()}).catch(()=>{}) |
| 2546 | update | await sjTimeout(db.ref(DB_PATH).update(upd),10000,'TX_WRITE_TIMEOUT') |
| 2568 | update | if(txId)await db.ref(DB_PATH+'/global/transactionReservations/'+txId).update({status:'COMMITTED',committedAt:sjNowIso(),verifiedAfterError:true}).catch(()=>{}); |
| 2598 | update | await sjTimeout(db.ref(DB_PATH).update(u),10000,'KASBON_TIMEOUT');clsModal('modal-tambah-kasbon');showToast('Kasbon karyawan tersimpan • '+sjFundLabel(source)+'.','success') |
| 2632 | remove | try{await db.ref(DB_PATH+'/global/users/'+id).remove();sjAudit('USER_DELETE',id);showToast('Pengguna dihapus.','success')}catch(e){sjSaveError('USER_DELETE',e);alert(sjFriendlyError(e))} |
| 2693 | set | await sjTimeout(db.ref(DB_PATH).set(this.restoreCandidate),20000,'RESTORE_TIMEOUT'); |
| 2694 | update | await db.ref(DB_PATH+'/global/schema').update({version:'59.3',releaseVersion:'59.3.4',restoredAt:sjNowIso(),restoredBy:currentLoginId}).catch(()=>{}); |
| 2709 | set | try{await sjTimeout(db.ref(DB_PATH).set(candidate),20000,'RESTORE_TIMEOUT')} |
| 2711 | update | await db.ref(DB_PATH+'/global/schema').update({version:'59.3',releaseVersion:'59.3.10',restoreRequestId:restoreId,restoredAt:sjNowIso(),restoredBy:currentLoginId}).catch(e=>sjSaveError('RESTORE_META',e)); |
| 2755 | set | var grouped=new Map();menu.forEach(m=>{var label=String(m.c\|\|'LAINNYA').trim()\|\|'LAINNYA',key=label.toUpperCase();if(!grouped.has(key))grouped.set(key,{label:label,items:[]});grouped.get(key).items.push(m)}); |
| 2778 | remove | if(drawer){drawer.classList.remove('open');return true} |
| 2807 | update | await db.ref(DB_PATH+'/global/schema').update({version:'59.3',releaseVersion:'59.3.4',productOrder:true,notificationAudience:true,archiveProducts:true,mobileFirstUX:true,groupedProductCategories:true,cartRevalidation:true,transactionReservations:true,stablePeopleIds:true,safeRestore:true,androidBackHierarchy:true,updatedAt:sjNowIso()}) |
| 2865 | update | try{return await sjTimeout(db.ref(DB_PATH).update(updates),10000,timeoutCode)} |
| 2907 | transaction | var lock=await sjTimeout(ref.transaction(cur=>{ |
| 2927 | transaction | if(lockHeld){try{await ref.transaction(cur=>{if(cur&&String(cur.paymentLock?.id\|\|'')===payId){var n=Object.assign({},cur);delete n.paymentLock;return n}return})}catch(_){}} |
| 2955 | transaction | var claim=await sjTimeout(txRef.transaction(cur=>{if(!cur\|\|cur.status==='VOIDED')return;var lk=cur.refundLock\|\|{},age=Date.now()-sjNum(lk.ts);if(lk.id&&age<120000)return;return Object.assign({},cur,{refundLock:{id:lockId,ts:Date.now(),by:currentLoginId}})}),8000,'REFUND_LOCK_TIMEOUT'); |
| 2961 | transaction | if(returnStock){for(const row of chosen){if(this.shouldRestoreStock(fresh,row.index,row.item)){await sjTimeout(db.ref(DB_PATH+'/global/inventory/'+row.item.id).transaction(cur=>sjNum(cur)+row.q),8000,'REFUND_STOCK_TIMEOUT');restocked.push({id:row.item.id,q:row.q,name:this.productName(fresh,row.index,row.item)})}}} |
| 2972 | transaction | if(!committed){for(const x of restocked){try{await db.ref(DB_PATH+'/global/inventory/'+x.id).transaction(cur=>Math.max(0,sjNum(cur)-x.q))}catch(_){}}} |
| 2973 | transaction | if(lockHeld&&!committed){try{await txRef.transaction(cur=>{if(cur&&String(cur.refundLock?.id\|\|'')===lockId){var n=Object.assign({},cur);delete n.refundLock;return n}return})}catch(_){}} |
| 2986 | transaction | var claim=await sjTimeout(txRef.transaction(cur=>{if(!cur\|\|cur.status==='VOIDED'\|\|sjNum(cur.refundTotal)>0\|\|['REFUNDED','PARTIAL_REFUND'].includes(String(cur.status\|\|'')))return;var lk=cur.voidLock\|\|{},age=Date.now()-sjNum(lk.ts);if(lk.id&&age<120000)return;return Object.assign({},cur,{voidLock:{id:voidId,ts:Date.now(),by:currentLoginId}})}),8000,'VOID_LOCK_ |
| 2989 | transaction | for(let i=0;i<items.length;i++){var it=items[i];if(this.shouldRestoreStock(fresh,i,it)){var q=sjNum(it.q);if(q>0){await sjTimeout(db.ref(DB_PATH+'/global/inventory/'+it.id).transaction(cur=>sjNum(cur)+q),8000,'VOID_STOCK_TIMEOUT');restored.push({id:it.id,q:q,name:this.productName(fresh,i,it)})}}} |
| 2997 | transaction | if(!committed){for(const r of restored){try{await db.ref(DB_PATH+'/global/inventory/'+r.id).transaction(cur=>Math.max(0,sjNum(cur)-r.q))}catch(_){}}} |
| 2998 | transaction | if(lockHeld&&!committed){try{await txRef.transaction(cur=>{if(cur&&String(cur.voidLock?.id\|\|'')===voidId){var n=Object.assign({},cur);delete n.voidLock;return n}return})}catch(_){}} |
| 3067 | transaction | var claim=await sjTimeout(txRef.transaction(cur=>{if(!cur\|\|cur.status==='VOIDED')return;var lk=cur.refundLock\|\|{},age=Date.now()-sjNum(lk.ts);if(lk.id&&age<120000)return;return Object.assign({},cur,{refundLock:{id:lockId,ts:Date.now(),by:currentLoginId}})}),8000,'REFUND_LOCK_TIMEOUT'); |
| 3086 | transaction | if(lockHeld&&!committed){try{await txRef.transaction(cur=>{if(cur&&String(cur.refundLock?.id\|\|'')===lockId){var n=Object.assign({},cur);delete n.refundLock;return n}return})}catch(_){} } |
| 3099 | transaction | var claim=await sjTimeout(txRef.transaction(cur=>{if(!cur\|\|cur.status==='VOIDED'\|\|sjNum(cur.refundTotal)>0\|\|['REFUNDED','PARTIAL_REFUND'].includes(String(cur.status\|\|'')))return;var lk=cur.voidLock\|\|{},age=Date.now()-sjNum(lk.ts);if(lk.id&&age<120000)return;return Object.assign({},cur,{voidLock:{id:voidId,ts:Date.now(),by:currentLoginId}})}),8000,'VOID_LOCK_ |
| 3112 | transaction | if(lockHeld&&!committed){try{await txRef.transaction(cur=>{if(cur&&String(cur.voidLock?.id\|\|'')===voidId){var n=Object.assign({},cur);delete n.voidLock;return n}return})}catch(_){} } |
| 3138 | transaction | var claim=await sjTimeout(reqRef.transaction(cur=>{if(!cur\|\|cur.status!=='SENT')return;return Object.assign({},cur,{status:'RECEIVING',receivingBy:currentUserName,receivingById:currentLoginId,receivingAt:sjNowIso(),receivingTs:Date.now(),receivingAttemptId:attempt})}),7000,'RESTOCK_CLAIM_TIMEOUT'); |
| 3144 | transaction | if(claimed&&!committed){try{await reqRef.transaction(cur=>{if(cur&&cur.status==='RECEIVING'&&String(cur.receivingAttemptId\|\|'')===attempt){var n=Object.assign({},cur,{status:'SENT'});delete n.receivingBy;delete n.receivingById;delete n.receivingAt;delete n.receivingTs;delete n.receivingAttemptId;return n}return})}catch(_){} } |
| 3151 | transaction | for(var r of rows){if(String(r.status\|\|'').toUpperCase()!=='RECEIVING'\|\|r.receivedAt)continue;var ts=sjNum(r.receivingTs)\|\|(Date.parse(r.receivingAt\|\|'')\|\|0);if(!ts\|\|Date.now()-ts<this.staleReceivingMs)continue;var key=String(r._key),ref=db.ref(DB_PATH+'/global/restockRequests/'+key),tr=await sjTimeout(ref.transaction(cur=>{if(!cur\|\|String(cur.status\|\|'').to |
| 3165 | update | var priorSchema=SJReliability.schemaMeta.bind(SJReliability);SJReliability.schemaMeta=async()=>{await priorSchema();try{await db.ref(DB_PATH+'/global/schema').update({releaseVersion:'59.3.4',atomicRefundVoid:true,partialQtyRefund:true,atomicRestockReceipt:true,verifiedFinancialWrites:true,updatedAt:sjNowIso()})}catch(e){sjSaveError('SCHEMA_META_594',e)}}; |
| 3212 | set | if(!pSnap.exists())await db.ref(DB_PATH+'/global/'+node+'/'+known).set({id:known,name:n,phone:'',note:'Dibuat ulang dari indeks identitas',active:true,createdAt:sjNowIso(),createdBy:currentUserName\|\|'SYSTEM',nameIndexKey:idxKey}); |
| 3216 | transaction | var tr=await sjTimeout(idxRef.transaction(cur=>cur\|\|candidate),7000,'PERSON_INDEX_CLAIM_TIMEOUT');var winner=String(tr.snapshot.val()\|\|candidate); |
| 3218 | set | if(!target.exists())await ref.set({id:winner,name:n,phone:'',note:'Dibuat otomatis dari transaksi/operasional',active:true,createdAt:sjNowIso(),createdBy:currentUserName\|\|'SYSTEM',nameIndexKey:idxKey}); |
| 3219 | update | else if(!target.val()?.nameIndexKey)await ref.update({id:winner,nameIndexKey:idxKey}).catch(()=>{}); |
| 3250 | update | catch(e){sjSaveError('TX_ATOMIC_ROLLBACK',e);await ref.update({rollbackPending:true,rollbackError:String(e.message\|\|e),rollbackErrorAt:sjNowIso()}).catch(()=>{});throw e} |
| 3265 | update | await ref.update({status:'RECOVERY_REVIEW_REQUIRED',reviewReason:'Journal tidak memiliki shift sehingga keberadaan transaksi tidak dapat dibuktikan.',proofRequired:true,proofDeferredAt:sjNowIso()}).catch(()=>{}); |
| 3271 | update | await ref.update({proofDeferredAt:sjNowIso(),proofError:String(e.message\|\|e),proofRequired:true}).catch(()=>{}); |
| 3275 | update | await ref.update({status:'COMMITTED',committedAt:sjNowIso(),recoveredCheckAt:sjNowIso(),proofRequired:false,proofError:null}).catch(()=>{}); |
| 3280 | update | await ref.update({status:'RECOVERY_REVIEW_REQUIRED',reviewReason:'Journal RECOVERING legacy tidak dipulihkan otomatis karena hasil restock sebelumnya tidak dapat dibuktikan.',reviewedNeededAt:sjNowIso(),uncertainLegacyRecovery:true,proofRequired:true}).catch(()=>{}); |
| 3285 | transaction | var claim=await sjTimeout(ref.transaction(cur=>{ |
| 3298 | transaction | await ref.transaction(cur=>{ |
| 3305 | update | await ref.update({status:'COMMITTED',committedAt:sjNowIso(),recoveryId:null,recoveredCheckAt:sjNowIso(),proofRequired:false,proofError:null}).catch(()=>{}); |
| 3316 | update | await ref.update({status:'RECOVERY_ERROR',recoveryError:String(e.message\|\|e),recoveryErrorAt:sjNowIso(),lastActivityTs:Date.now(),proofRequired:true}).catch(()=>{}) |
| 3335 | remove | var root=document.getElementById('sj-error-list');if(!root)return;var rows=this.recoveryReviewRows(),old=document.getElementById('sjrel-recovery-diag');if(old)old.remove(); |
| 3341 | update | try{await db.ref(DB_PATH+'/global/schema').update({version:'59.3',releaseVersion:'59.3.5',productOrder:true,notificationAudience:true,archiveProducts:true,mobileFirstUX:true,groupedProductCategories:true,cartRevalidation:true,transactionReservations:true,atomicReservationRecovery:true,stablePeopleIds:true,transactionalPeopleIndex:true,safeRestore:true,androi |
| 3383 | transaction | sjTimeout(ref.transaction(cur=>cur==null?emptyDay():cur),9000,'SHIFT_INIT_TIMEOUT').then(tr=>{ |
| 3401 | update | await ref.update({rollbackPending:true,rollbackReviewReason:'Rollback otomatis diblokir karena journal berstatus '+status,rollbackReviewAt:sjNowIso()}).catch(()=>{}); |
| 3405 | update | if(!shift){await ref.update({rollbackPending:true,rollbackReviewReason:'Shift journal kosong',rollbackReviewAt:sjNowIso()}).catch(()=>{});throw Object.assign(new Error('Shift journal tidak valid. Perlu review sebelum koreksi stok.'),{code:'ROLLBACK_SHIFT_MISSING'})} |
| 3408 | update | catch(e){await ref.update({rollbackPending:true,rollbackReviewReason:'Tidak dapat membuktikan transaksi tidak tersimpan',rollbackReviewAt:sjNowIso()}).catch(()=>{});throw Object.assign(new Error('Koneksi belum dapat memastikan transaksi gagal. Stok TIDAK dikembalikan otomatis.'),{code:'ROLLBACK_TX_UNVERIFIED',cause:e})} |
| 3410 | update | await ref.update({status:'COMMITTED',committedAt:sjNowIso(),verifiedDuringRollback:true,rollbackPending:null}).catch(()=>{});return |
| 3415 | update | await ref.update({rollbackPending:true,status:'RECOVERY_REVIEW_REQUIRED',reviewReason:'Stok sempat ter-reserve di perangkat, tetapi item journal tidak cukup untuk rollback aman.',rollbackReviewAt:sjNowIso()}).catch(()=>{}); |
| 3478 | update | try{await db.ref(DB_PATH+'/global/schema').update({version:'59.3',releaseVersion:'59.3.6',productOrder:true,notificationAudience:true,archiveProducts:true,mobileFirstUX:true,groupedProductCategories:true,cartRevalidation:true,transactionReservations:true,atomicReservationRecovery:true,noProofNoRollback:true,safeShiftInitialization:true,liveSessionRevocation: |
| 3550 | set | try{await sjTimeout(ref.set(row),10000,'USER_SAVE_TIMEOUT')} |
| 3563 | remove | if(!confirm('Hapus user '+id+'?'))return;var ref=db.ref(DB_PATH+'/global/users/'+id);await sjTimeout(ref.remove(),9000,'USER_DELETE_TIMEOUT');sjAudit('USER_DELETE',id);showToast('Pengguna dihapus.','success') |
| 3575 | transaction | try{await sjTimeout(ref.transaction(cur=>{var arr=this.normalizeLocked(cur);if(!arr.includes(bln))arr.push(bln);return Array.from(new Set(arr)).sort()}),10000,'EOM_TRANSACTION_TIMEOUT')} |
| 3594 | update | try{await db.ref(DB_PATH+'/global/schema').update({version:'59.3',releaseVersion:'59.3.9',proofFirstStaleRecovery:true,eomActiveShiftGuard:true,transactionalMonthLock:true,lastOwnerRoleInvariant:true,globalActiveShiftDestructiveGuard:true,userRoleActiveShiftGuard:true,updatedAt:sjNowIso()})}catch(e){sjSaveError('SCHEMA_META_597',e)} |
| 3710 | update | try{await db.ref(DB_PATH+'/global/schema').update({version:'59.3',releaseVersion:'59.3.10',operationalReadyFinal:true,qrisConfigurationGuard:true,restoreActiveShiftGuard:true,expandedBootSelfTest:true,criticalNavigationGuard:true,updatedAt:sjNowIso()})} |
| 3780 | transaction | var tr=await sjTimeout(ref.transaction(cur=>{ |
| 3795 | transaction | try{await lock.ref.transaction(cur=>{if(cur&&String(cur.id\|\|'')===String(lock.id))return null;return cur})}catch(e){sjSaveError('CASH_OUT_LOCK_RELEASE',e)} |
| 3894 | update | async schemaMeta(){try{await db.ref(DB_PATH+'/global/schema').update({version:'59.3',releaseVersion:'59.3.11',cashOutGuard:true,cashOutSerialized:true,financialActiveShiftGuard:true,debtPaymentButtonFix:true,customerDebtPaymentEventBinding:true,updatedAt:sjNowIso()})}catch(e){sjSaveError('SCHEMA_META_59311',e)}}, |
| 4021 | remove | r.querySelectorAll('.sjmux-segment button').forEach(b=>b.addEventListener('click',()=>{b.parentElement.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active')}));document.getElementById('modal-sjmux-ui').style.display='flex' |
| 4024 | update | async saveSettings(){if(currentUserRole!=='manajemen')return;var val=this.collectSettings();try{await sjTimeout(db.ref(DB_PATH+'/global/uiSettings').update(Object.assign({},val,{updatedAt:sjNowIso(),updatedBy:currentLoginId})),10000,'UI_SETTINGS_TIMEOUT');cloudData.global=cloudData.global\|\|{};cloudData.global.uiSettings=Object.assign({},cloudData.global.uiSe |
| 4025 | set | async resetSettings(){if(!confirm('Kembalikan pengaturan tampilan ke default?'))return;try{await db.ref(DB_PATH+'/global/uiSettings').set(Object.assign({},this.defaults,{updatedAt:sjNowIso(),updatedBy:currentLoginId}));cloudData.global.uiSettings=Object.assign({},this.defaults);this.applyLayout();this.openSettings();this.refreshAll();showToast('Tampilan dike |
| 4042 | set | if(currentUserRole!=='manajemen')return;var id=document.getElementById('sjmux-q-id').value,c=document.getElementById('sjmux-q-category').value.toUpperCase(),n=document.getElementById('sjmux-q-name').value.trim().toUpperCase(),p=getNum(document.getElementById('sjmux-q-price').value),img=document.getElementById('sjmux-q-img').value,track=!!document.getElementB |
| 4052 | update | async schemaMeta(){try{await db.ref(DB_PATH+'/global/schema').update({version:'59.4',releaseVersion:'59.4.0',mobileUiSettings:true,longPressProductEdit:true,iconProductMaster:true,updatedAt:sjNowIso()})}catch(e){sjSaveError('SCHEMA_META_5940',e)}}, |
| 4140 | remove | showUndo(msg,fn){var bar=document.getElementById('sjux-undo'),txt=document.getElementById('sjux-undo-text'),btn=document.getElementById('sjux-undo-btn');if(!bar\|\|!txt\|\|!btn)return;clearTimeout(this._undoTimer);if(this._undoHandler)btn.removeEventListener('click',this._undoHandler);txt.textContent=msg;bar.classList.add('show');this._undoHandler=async()=>{bar. |
| 4140 | remove | showUndo(msg,fn){var bar=document.getElementById('sjux-undo'),txt=document.getElementById('sjux-undo-text'),btn=document.getElementById('sjux-undo-btn');if(!bar\|\|!txt\|\|!btn)return;clearTimeout(this._undoTimer);if(this._undoHandler)btn.removeEventListener('click',this._undoHandler);txt.textContent=msg;bar.classList.add('show');this._undoHandler=async()=>{bar. |
| 4157 | set | async duplicateCurrentProduct(){var btn=document.getElementById('sjux-q-duplicate'),id=document.getElementById('sjmux-q-id')?.value,m=(cloudData.global.menu\|\|[]).find(x=>String(x.id)===String(id));if(!m)return;sjSetBusy(btn,true,'MENDUPLIKAT...');try{var clone=null;await SJHarden.menuTransaction(arr=>{var max=arr.filter(x=>SJHarden.isActiveProduct(x)).reduce |
| 4172 | remove | r.querySelectorAll('.sjmux-segment button').forEach(b=>b.addEventListener('click',()=>{b.parentElement.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active')}));document.getElementById('modal-sjmux-ui').style.display='flex'}; |
| 4174 | update | SJMobileUX.saveSettings=async()=>{var btn=document.getElementById('sjmux-save-ui'),val=SJMobileUX.collectSettings();sjSetBusy(btn,true,'MENYIMPAN...');try{await sjTimeout(db.ref(DB_PATH+'/global/uiSettings').update(Object.assign({},val,{updatedAt:sjNowIso(),updatedBy:currentLoginId})),10000,'UI_SETTINGS_TIMEOUT');cloudData.global.uiSettings=Object.assign({}, |
| 4175 | set | SJMobileUX.resetSettings=async()=>{if(!confirm('Kembalikan layout Owner dan Kasir ke default profesional?'))return;var val={roleLayouts:JSON.parse(JSON.stringify(this.roleDefaults)),managementColumns:2,productMasterColumns:2,longPressEdit:true,productColumns:3,operationColumns:2,reportColumns:2,compactCards:false};try{await db.ref(DB_PATH+'/global/uiSettings |
| 4187 | update | async schemaMeta(){try{await db.ref(DB_PATH+'/global/schema').update({version:'59.4',releaseVersion:'59.4.1',mobileProfessionalP1:true,roleLayouts:true,quickActions:true,pinnedFavorites:true,productDuplicate:true,bulkProductActions:true,categoryLongPress:true,undoLightActions:true,cashHeaderStatus:true,updatedAt:sjNowIso()})}catch(e){sjSaveError('SCHEMA_META |
| 4236 | update | async markAllNotificationsRead(){var rows=sjArr(cloudData.global.notifications).filter(x=>SJHarden.notificationVisible(x)&&!SJHarden.notificationRead(x)),u={};var rk=SJHarden.safeReaderKey();rows.forEach(x=>u['global/notifications/'+x._key+'/readBy/'+rk]=true);if(!rows.length)return showToast('Semua notifikasi sudah dibaca.','success');try{await db.ref(DB_PA |
| 4251 | update | async registerDevice(){if(!currentLoginId)return;var id=this.deviceId(),ref=db.ref(DB_PATH+'/global/deviceSessions/'+id);try{var snap=await ref.once('value'),old=snap.val()\|\|{};if(old.revoked){showToast('Perangkat ini telah dicabut aksesnya oleh Owner.','error');setTimeout(()=>doLogout(),400);return}await ref.update({id,deviceName:this.deviceLabel(),userId:c |
| 4251 | update | async registerDevice(){if(!currentLoginId)return;var id=this.deviceId(),ref=db.ref(DB_PATH+'/global/deviceSessions/'+id);try{var snap=await ref.once('value'),old=snap.val()\|\|{};if(old.revoked){showToast('Perangkat ini telah dicabut aksesnya oleh Owner.','error');setTimeout(()=>doLogout(),400);return}await ref.update({id,deviceName:this.deviceLabel(),userId:c |
| 4251 | update | async registerDevice(){if(!currentLoginId)return;var id=this.deviceId(),ref=db.ref(DB_PATH+'/global/deviceSessions/'+id);try{var snap=await ref.once('value'),old=snap.val()\|\|{};if(old.revoked){showToast('Perangkat ini telah dicabut aksesnya oleh Owner.','error');setTimeout(()=>doLogout(),400);return}await ref.update({id,deviceName:this.deviceLabel(),userId:c |
| 4253 | update | async toggleDevice(key){var x=sjArr(cloudData.global.deviceSessions).find(r=>String(r._key)===String(key));if(!x)return;var revoke=!x.revoked,ok=await this.confirmAction(revoke?'Cabut akses perangkat?':'Aktifkan perangkat?',revoke?'Perangkat '+(x.deviceName\|\|key)+' akan logout dan tidak dapat dipakai sampai diaktifkan kembali.':'Perangkat diizinkan login kem |
| 4256 | remove | wrapClosing(){var open=SJShift.openCloseModal.bind(SJShift);SJShift.openCloseModal=()=>{var r=open();setTimeout(()=>{var ws=document.getElementById('sjshift-close-worksheet');if(ws){var old=document.getElementById('sjp2-closing-health');if(old)old.remove();var box=document.createElement('div');box.id='sjp2-closing-health';box.innerHTML=this.healthHTML(this.c |
| 4263 | update | wrapBackup(){var base=window.backupDatabase;window.backupDatabase=async()=>{if(currentUserRole!=='manajemen')return alert('Hanya Owner.');showLoading('Membuat backup database...');try{var snap=await sjTimeout(db.ref(DB_PATH).once('value'),15000,'BACKUP_TIMEOUT'),data=snap.val();if(!data)return alert('Database kosong.');var blob=new Blob([JSON.stringify(data, |
| 4264 | update | async schemaMeta(){try{await db.ref(DB_PATH+'/global/schema').update({version:'59.4',releaseVersion:'59.4.2',mobileProfessionalP1:true,ownerControlP2:true,smartNotificationCenter:true,humanAuditTrail:true,shiftTimeline:true,customerQuickProfile:true,globalSearch:true,deviceSessionManagement:true,closingHealthCheck:true,operationalStatusCenter:true,smartConfi |
| 4267 | update | install(){if(this._installed)return;this._installed=true;this.injectStyle();this.injectUI();this.wrapShiftDetail();this.wrapPeople();this.wrapClosing();this.wrapOpenMst();this.wrapDashboard();this.wrapBackup();var baseAct=window.sjRenderActivity;window.sjRenderActivity=sjRenderActivity=()=>this.renderAudit();SJX.renderNotifications=()=>this.renderNotificatio |
| 4303 | set | async ensureCurrentAuth(username,pin,user,allowCreate){var a=this.auth();if(!a)throw Object.assign(new Error('Firebase Auth SDK tidak tersedia.'),{code:'AUTH_SDK_MISSING'});var c=await this.authCredential(username,pin),cred=null;try{cred=await a.signInWithEmailAndPassword(c.email,c.password)}catch(e){var code=String(e.code\|\|'');if(allowCreate&&(code.includes |
| 4303 | update | async ensureCurrentAuth(username,pin,user,allowCreate){var a=this.auth();if(!a)throw Object.assign(new Error('Firebase Auth SDK tidak tersedia.'),{code:'AUTH_SDK_MISSING'});var c=await this.authCredential(username,pin),cred=null;try{cred=await a.signInWithEmailAndPassword(c.email,c.password)}catch(e){var code=String(e.code\|\|'');if(allowCreate&&(code.includes |
| 4303 | update | async ensureCurrentAuth(username,pin,user,allowCreate){var a=this.auth();if(!a)throw Object.assign(new Error('Firebase Auth SDK tidak tersedia.'),{code:'AUTH_SDK_MISSING'});var c=await this.authCredential(username,pin),cred=null;try{cred=await a.signInWithEmailAndPassword(c.email,c.password)}catch(e){var code=String(e.code\|\|'');if(allowCreate&&(code.includes |
| 4307 | update | async logout(){try{this.stopGlobalListeners();if(window.SJOwnerProfessionalP2){clearInterval(SJOwnerProfessionalP2._deviceTimer);var did=SJOwnerProfessionalP2.deviceId();if(currentLoginId)await db.ref(DB_PATH+'/global/deviceSessions/'+did).update({online:false,lastSeenAt:sjNowIso(),lastSeenTs:Date.now()}).catch(()=>{});if(SJOwnerProfessionalP2._deviceRef&&SJ |
| 4308 | set | async provisionUserSecondary(username,pin,row){if(!firebase.auth)return null;var appName='sj-prov-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),app=firebase.initializeApp(fbCfg,appName),a=app.auth(),c=await this.authCredential(username,pin),cred=null;try{try{cred=await a.createUserWithEmailAndPassword(c.email,c.password)}catch(e){var code=String(e.c |
| 4308 | update | async provisionUserSecondary(username,pin,row){if(!firebase.auth)return null;var appName='sj-prov-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),app=firebase.initializeApp(fbCfg,appName),a=app.auth(),c=await this.authCredential(username,pin),cred=null;try{try{cred=await a.createUserWithEmailAndPassword(c.email,c.password)}catch(e){var code=String(e.c |
| 4309 | set | async saveUserSecure(){if(currentUserRole!=='manajemen')return alert('Hanya Owner.');var id=(document.getElementById('usr-id')?.value\|\|'').trim().toLowerCase(),nama=(document.getElementById('usr-nama')?.value\|\|'').trim(),pin=(document.getElementById('usr-pass')?.value\|\|'').trim(),role=document.getElementById('usr-role')?.value\|\|'transaksi';if(!id\|\|!nama)retu |
| 4309 | update | async saveUserSecure(){if(currentUserRole!=='manajemen')return alert('Hanya Owner.');var id=(document.getElementById('usr-id')?.value\|\|'').trim().toLowerCase(),nama=(document.getElementById('usr-nama')?.value\|\|'').trim(),pin=(document.getElementById('usr-pass')?.value\|\|'').trim(),role=document.getElementById('usr-role')?.value\|\|'transaksi';if(!id\|\|!nama)retu |
| 4310 | update | async deleteUserSecure(id){id=String(id\|\|'');var snap=await db.ref(DB_PATH+'/global/users/'+id).once('value'),u=snap.val()\|\|{},uid=u.authUid\|\|'';await SJAdminEomSafety.deleteUserSafe(id);if(uid){var exists=await db.ref(DB_PATH+'/global/users/'+id).once('value');if(!exists.exists())await db.ref(DB_PATH+'/global/authUsers/'+uid).update({active:false,revokedAt: |
| 4311 | update | async changeOwnPin(){if(!currentLoginId)return;var old=prompt('Masukkan PIN saat ini:');if(!old)return;var u=(await db.ref(DB_PATH+'/global/users/'+currentLoginId).once('value')).val();if(!u\|\|!(await sjVerifyPin(currentLoginId,old,u)))return alert('PIN saat ini salah.');var np=prompt('Masukkan PIN baru (minimal 4 karakter):');if(!np\|\|np.length<4)return alert |
| 4312 | update | async setAuthMode(mode){if(currentUserRole!=='manajemen')return;mode=String(mode\|\|'LEGACY').toUpperCase();if(!['LEGACY','HYBRID','SECURE'].includes(mode))return;if(mode==='SECURE'){var users=(await db.ref(DB_PATH+'/global/users').once('value')).val()\|\|{},missing=Object.keys(users).filter(k=>!users[k]?.authUid);var sec=(await db.ref(DB_PATH+'/global/security' |
| 4313 | update | async confirmRules(){if(currentUserRole!=='manajemen')return;if(!confirm('Tandai bahwa file database.rules.json dari paket v59.4.3 sudah dipasang di Firebase Realtime Database?'))return;await db.ref(DB_PATH+'/global/security').update({rulesDeploymentConfirmed:true,rulesConfirmedAt:sjNowIso(),rulesConfirmedBy:currentLoginId});showToast('Status Security Rules  |
| 4315 | update | async enforceVersion(){if(currentUserRole!=='manajemen')return;if(!confirm('Wajibkan semua perangkat menggunakan minimal v'+this.version+'? Perangkat lama akan ditolak saat login.'))return;await db.ref(DB_PATH+'/global/systemMeta').update({minClientVersion:this.version,recommendedClientVersion:this.version,versionEnforcedAt:sjNowIso(),versionEnforcedBy:curre |
| 4323 | update | async migrateImages(){if(currentUserRole!=='manajemen')return;if(!this.auth()?.currentUser)return alert('Aktifkan HYBRID dan login ulang agar Firebase Auth aktif sebelum migrasi gambar.');var cnt=this.base64Count();if(!cnt)return alert('Tidak ada gambar base64 yang perlu dimigrasikan.');if(!confirm('Migrasikan '+cnt+' gambar base64 ke Firebase Storage? Siste |
| 4323 | update | async migrateImages(){if(currentUserRole!=='manajemen')return;if(!this.auth()?.currentUser)return alert('Aktifkan HYBRID dan login ulang agar Firebase Auth aktif sebelum migrasi gambar.');var cnt=this.base64Count();if(!cnt)return alert('Tidak ada gambar base64 yang perlu dimigrasikan.');if(!confirm('Migrasikan '+cnt+' gambar base64 ke Firebase Storage? Siste |
| 4323 | transaction | async migrateImages(){if(currentUserRole!=='manajemen')return;if(!this.auth()?.currentUser)return alert('Aktifkan HYBRID dan login ulang agar Firebase Auth aktif sebelum migrasi gambar.');var cnt=this.base64Count();if(!cnt)return alert('Tidak ada gambar base64 yang perlu dimigrasikan.');if(!confirm('Migrasikan '+cnt+' gambar base64 ke Firebase Storage? Siste |
| 4323 | remove | async migrateImages(){if(currentUserRole!=='manajemen')return;if(!this.auth()?.currentUser)return alert('Aktifkan HYBRID dan login ulang agar Firebase Auth aktif sebelum migrasi gambar.');var cnt=this.base64Count();if(!cnt)return alert('Tidak ada gambar base64 yang perlu dimigrasikan.');if(!confirm('Migrasikan '+cnt+' gambar base64 ke Firebase Storage? Siste |
| 4327 | update | async schemaMeta(){try{await db.ref(DB_PATH+'/global/schema').update({version:'59.4',releaseVersion:this.version,productionArchitectureP3:true,firebaseAuthBridge:true,securityModeMigration:true,firebaseStorageImages:true,indexPlan:true,explicitSyncState:true,versionGuard:true,migrationLock:true,segmentedGlobalListeners:true,updatedAt:sjNowIso()});await db.re |
| 4327 | update | async schemaMeta(){try{await db.ref(DB_PATH+'/global/schema').update({version:'59.4',releaseVersion:this.version,productionArchitectureP3:true,firebaseAuthBridge:true,securityModeMigration:true,firebaseStorageImages:true,indexPlan:true,explicitSyncState:true,versionGuard:true,migrationLock:true,segmentedGlobalListeners:true,updatedAt:sjNowIso()});await db.re |
| 4334 | update | patchDeviceBuild(){if(!window.SJOwnerProfessionalP2)return;SJOwnerProfessionalP2.registerDevice=async()=>{if(!currentLoginId)return;var id=SJOwnerProfessionalP2.deviceId(),ref=db.ref(DB_PATH+'/global/deviceSessions/'+id);try{var snap=await ref.once('value'),old=snap.val()\|\|{};if(old.revoked){showToast('Perangkat ini telah dicabut aksesnya oleh Owner.','error |
| 4334 | update | patchDeviceBuild(){if(!window.SJOwnerProfessionalP2)return;SJOwnerProfessionalP2.registerDevice=async()=>{if(!currentLoginId)return;var id=SJOwnerProfessionalP2.deviceId(),ref=db.ref(DB_PATH+'/global/deviceSessions/'+id);try{var snap=await ref.once('value'),old=snap.val()\|\|{};if(old.revoked){showToast('Perangkat ini telah dicabut aksesnya oleh Owner.','error |
| 4334 | update | patchDeviceBuild(){if(!window.SJOwnerProfessionalP2)return;SJOwnerProfessionalP2.registerDevice=async()=>{if(!currentLoginId)return;var id=SJOwnerProfessionalP2.deviceId(),ref=db.ref(DB_PATH+'/global/deviceSessions/'+id);try{var snap=await ref.once('value'),old=snap.val()\|\|{};if(old.revoked){showToast('Perangkat ini telah dicabut aksesnya oleh Owner.','error |
| 4337 | update | install(){if(this._installed)return;this._installed=true;this.injectStyle();this.injectUI();this.patchWrites();this.patchImageFlow();this.patchDeviceBuild();this.patchClosingHealth();this.patchRestoreSafety();this.wrapOpenMst();this.enhanceManagement();window.initApp=initApp=()=>this.preloginInit();window.doLogin=doLogin=()=>this.login();var oldLogout=window |
| 4715 | update | this.updateBell();try{await db.ref(DB_PATH).update(u)}catch(e){sjSaveError('NOTIF_OPEN_ACK',e)} |
| 4756 | update | if(Object.keys(u).length)await sjTimeout(db.ref(DB_PATH).update(u),30000,'ZERO_COST_IMAGE_OPT_TIMEOUT'); |
| 4757 | update | await db.ref(DB_PATH+'/global/systemMeta').update({lastZeroCostImageOptimizeAt:sjNowIso(),lastZeroCostImageOptimizeBy:currentLoginId,lastZeroCostImageOptimizeCount:done,beforeKB,afterKB}).catch(()=>{}); |
| 4776 | remove | box.querySelectorAll('[data-sjx-request]').forEach(x=>x.remove()); |
| 4777 | remove | Array.from(box.querySelectorAll('button')).filter(x=>(x.textContent\|\|'').trim()==='MINTA').forEach(x=>x.remove()); |
| 4877 | remove | focus(v){if(!this.mobile())return;document.body.classList.toggle('sj5952-focus',!!v);if(!v)document.body.classList.remove('sj5952-stock-mode')}, |
| 4887 | remove | renderStock(tab='produk'){if(!this.mobile())return this.baseStock(tab);SJ_STOCK_TAB=tab\|\|'produk';if(SJ_STOCK_TAB!=='produk'){document.body.classList.remove('sj5952-stock-mode');return this.baseStock(SJ_STOCK_TAB)}this.focus(true);document.body.classList.add('sj5952-stock-mode');let root=document.getElementById('sj-stock-module');if(!root)return;let c=this.s |
| 4898 | remove | SJX.openDashboard=()=>{document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));document.getElementById('view5').classList.add('active');document.getElementById('tab5').classList.add('active');this.dashboard();return true}; |
| 4898 | remove | SJX.openDashboard=()=>{document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));document.getElementById('view5').classList.add('active');document.getElementById('tab5').classList.add('active');this.dashboard();return true}; |
| 4901 | remove | window.openOpr=id=>{let v=this.baseOpenOpr(id);setTimeout(()=>{if(Number(id)===3){this.focus(true);document.body.classList.add('sj5952-stock-mode');this.renderStock('produk')}else{document.body.classList.remove('sj5952-stock-mode');this.focus(false)}},0);return v};openOpr=window.openOpr; |
| 4950 | remove | setNav(view){if(!this.mobile())return;let map={dashboard:'tab5',sales:'tab1',operations:'tab2',reports:'tab3',management:'tab4'};Object.values(map).forEach(id=>document.getElementById(id)?.classList.remove('active'));document.getElementById(map[view]\|\|'tab5')?.classList.add('active')}, |
| 4958 | remove | renderStock(tab='produk'){if(!this.mobile())return this.baseStock(tab);SJ_STOCK_TAB=tab\|\|'produk';if(SJ_STOCK_TAB!=='produk'){document.body.classList.remove('sj53-stock');return this.baseStock(SJ_STOCK_TAB)}this.focus();this.setNav('operations');document.body.classList.add('sj53-stock');let root=document.getElementById('sj-stock-module');if(!root)return;let  |
| 4964 | remove | renderSales(){if(!this.mobile())return this.baseRenderMenu();this.focus();this.setNav('sales');document.body.classList.remove('sj53-stock');let sc=document.getElementById('kasir-scroll');if(!sc)return;let q=(this.salesSearch\|\|'').trim().toUpperCase(),active=String(this.salesCategory\|\|SJPro.activeCategory\|\|'SEMUA').toUpperCase(),menu=(cloudData.global.menu\|\|[ |
| 4990 | remove | let oldClose=window.closeOpr;window.closeOpr=()=>{document.body.classList.remove('sj53-stock');let v=oldClose();return v}; |
| 4992 | remove | let oldSel=window.selMet;window.selMet=(m)=>{let v=oldSel(m);if(this.mobile()){document.querySelectorAll('#modal-bayar .sj53-method').forEach(x=>x.classList.remove('active'));document.getElementById(m==='Tunai'?'btn-tunai':m==='QRIS'?'btn-qris':m==='Transfer'?'btn-tf':'btn-kasbon')?.classList.add('active');this.paymentChange()}return v}; |
| 5052 | remove | renderSales(){if(!this.mobile())return SJCommercialUIV5953.baseRenderMenu();SJCommercialUIV5953.focus();SJCommercialUIV5953.setNav('sales');document.body.classList.remove('sj53-stock');let sc=document.getElementById('kasir-scroll');if(!sc)return;let q=String(SJCommercialUIV5953.salesSearch\|\|'').trim().toUpperCase(),active=String(SJCommercialUIV5953.salesCate |
| 5062 | remove | install(){if(this.installed)return;this.installed=true;this.style();let ui=SJCommercialUIV5953;ui.ownerDashboard=()=>this.ownerDashboard();ui.cashierDashboard=()=>this.cashierDashboard();ui.renderStock=(tab)=>this.renderStock(tab);ui.paintStockDetail=()=>this.paintStockDetail();ui.openStockDetail=(id)=>this.openStockDetail(id);ui.closeStockDetail=()=>this.cl |
| 5097 | remove | SJCommercialUIV5953.focus();SJCommercialUIV5953.setNav('sales');document.body.classList.remove('sj53-stock'); |
| 5396 | remove | SJX.openDashboard=()=>{document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));document.getElementById('view5')?.classList.add('active');document.getElementById('tab5')?.classList.add('active');SJCommercialUIV5953.dashboard();return true}; |
| 5396 | remove | SJX.openDashboard=()=>{document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));document.getElementById('view5')?.classList.add('active');document.getElementById('tab5')?.classList.add('active');SJCommercialUIV5953.dashboard();return true}; |
| 5472 | remove | closeDebtDetail(){document.getElementById('sj60-debt-sheet')?.classList.remove('show')}, |
| 5477 | remove | updateExpenseCashHint(){const info=document.getElementById('sj60-exp-cash-info'),inp=document.getElementById('sj-exp-amount'),src=document.getElementById('sj-exp-source');if(!info\|\|!inp)return;const d=cloudData[activeDate]\|\|{},cash=(typeof sjShiftCashModel==='function'?sjShiftCashModel(d).available:sjExpectedCash(d)),amt=getNum(inp.value),isCash=(src?.value\| |
| 5480 | remove | refreshRestockForm(){const pid=document.getElementById('sjx-restock-pid')?.value,p=(cloudData.global.menu\|\|[]).find(x=>String(x.id)===String(pid)),box=document.getElementById('sj60-restock-urgency');if(!box)return;box.querySelectorAll('span').forEach(x=>x.classList.remove('active'));if(!p)return;const q=sjStockQty(p),min=sjMinStock(p),u=q<=0?'HIGH':q<=min?'N |
| 5687 | remove | cards.forEach((c,i)=>{let old=c.querySelector('.sj62-kpi-insight');if(old)old.remove();let box=document.createElement('div');box.className='sj62-kpi-insight';box.innerHTML=this.comparisonHTML(data[i][0],data[i][1],data[i][2],data[i][3])+`<span class="sj62-bars"><i style="--v:${Math.max(8,Math.min(100,data[i][1]?data[i][1]/Math.max(data[i][0],data[i][1])*100: |
| 5692 | remove | SJCommercialUIV5953.focus();SJCommercialUIV5953.setNav('sales');document.body.classList.remove('sj53-stock'); |
| 5708 | set | try{return await sjTimeout(ref.set(journal),5000,'TX_JOURNAL_TIMEOUT')}catch(e){showToast('Koneksi lambat • transaksi sedang diverifikasi...','warning')} |
| 5710 | set | try{return await sjTimeout(ref.set(journal),7000,'TX_JOURNAL_RETRY_TIMEOUT')}catch(e){} |
| 6035 | update | async function saveIngredient(){if(!ownerOnly())return;var name=document.getElementById('sjinv-ing-name').value.trim().toUpperCase(),unit=document.getElementById('sjinv-ing-unit').value,category=document.getElementById('sjinv-ing-cat').value.trim().toUpperCase()\|\|'BAHAN',critical=Math.max(0,n(document.getElementById('sjinv-ing-critical').value)),warning=Math |
| 6035 | remove | async function saveIngredient(){if(!ownerOnly())return;var name=document.getElementById('sjinv-ing-name').value.trim().toUpperCase(),unit=document.getElementById('sjinv-ing-unit').value,category=document.getElementById('sjinv-ing-cat').value.trim().toUpperCase()\|\|'BAHAN',critical=Math.max(0,n(document.getElementById('sjinv-ing-critical').value)),warning=Math |
| 6037 | update | async function retireIngredient(id){if(!ownerOnly())return;var m=ingredients()[id];if(!m)return;try{var usage=await ingredientUsageState(id),name=m.name\|\|id;if(usage.canDelete){if(!confirm('Hapus permanen '+name+'? Bahan ini belum memiliki stok, resep, atau riwayat penggunaan.'))return;var u={};u['ingredients/'+id]=null;u['balances/ingredients/'+id]=null;awa |
| 6037 | update | async function retireIngredient(id){if(!ownerOnly())return;var m=ingredients()[id];if(!m)return;try{var usage=await ingredientUsageState(id),name=m.name\|\|id;if(usage.canDelete){if(!confirm('Hapus permanen '+name+'? Bahan ini belum memiliki stok, resep, atau riwayat penggunaan.'))return;var u={};u['ingredients/'+id]=null;u['balances/ingredients/'+id]=null;awa |
| 6038 | update | async function restoreIngredient(id){if(!ownerOnly())return;var m=ingredients()[id];if(!m)return;try{var patch={active:true,archivedAt:null,archivedBy:null,updatedAt:sjNowIso(),updatedBy:currentLoginId};await invRef('ingredients/'+id).update(patch);data.ingredients[id]=Object.assign({},m,{active:true,updatedAt:patch.updatedAt,updatedBy:patch.updatedBy});dele |
| 6041 | update | function renderRecipes(r){var products=(cloudData.global.menu\|\|[]).filter(function(p){return !window.SJHarden\|\|SJHarden.isActiveProduct(p)}),pid=editingRecipe.productId\|\|String(products[0]&&products[0].id\|\|''),v=pid&&editingRecipe.variantId?(obj(obj(recipes()[pid]).variants)[editingRecipe.variantId]\|\|{}):{};editingRecipe.productId=pid;var compHtml=inventoryR |
| 6042 | update | async function saveRecipeVariant(){if(!ownerOnly())return;var pid=document.getElementById('sjinv-recipe-product').value,p=menuProduct(pid),name=document.getElementById('sjinv-variant-name').value.trim(),price=Math.max(0,n(document.getElementById('sjinv-variant-price').value)),low=Math.max(0,Math.floor(n(document.getElementById('sjinv-low-portions').value)\|\|5 |
| 6045 | update | async function transferSelected(){if(!ownerOnly())return;var key=document.getElementById('sjinv-transfer-item').value,q=Math.max(0,n(document.getElementById('sjinv-transfer-qty').value)),c=allStockChoices().find(function(x){return x.key===key});if(!c\|\|q<=0)return alert('Pilih item dan jumlah transfer.');try{if(c.type==='ingredient'){var tr=await sjTimeout(in |
| 6045 | transaction | async function transferSelected(){if(!ownerOnly())return;var key=document.getElementById('sjinv-transfer-item').value,q=Math.max(0,n(document.getElementById('sjinv-transfer-qty').value)),c=allStockChoices().find(function(x){return x.key===key});if(!c\|\|q<=0)return alert('Pilih item dan jumlah transfer.');try{if(c.type==='ingredient'){var tr=await sjTimeout(in |
| 6045 | transaction | async function transferSelected(){if(!ownerOnly())return;var key=document.getElementById('sjinv-transfer-item').value,q=Math.max(0,n(document.getElementById('sjinv-transfer-qty').value)),c=allStockChoices().find(function(x){return x.key===key});if(!c\|\|q<=0)return alert('Pilih item dan jumlah transfer.');try{if(c.type==='ingredient'){var tr=await sjTimeout(in |
| 6045 | transaction | async function transferSelected(){if(!ownerOnly())return;var key=document.getElementById('sjinv-transfer-item').value,q=Math.max(0,n(document.getElementById('sjinv-transfer-qty').value)),c=allStockChoices().find(function(x){return x.key===key});if(!c\|\|q<=0)return alert('Pilih item dan jumlah transfer.');try{if(c.type==='ingredient'){var tr=await sjTimeout(in |
| 6045 | transaction | async function transferSelected(){if(!ownerOnly())return;var key=document.getElementById('sjinv-transfer-item').value,q=Math.max(0,n(document.getElementById('sjinv-transfer-qty').value)),c=allStockChoices().find(function(x){return x.key===key});if(!c\|\|q<=0)return alert('Pilih item dan jumlah transfer.');try{if(c.type==='ingredient'){var tr=await sjTimeout(in |
| 6047 | set | async function purchaseSelected(){if(!ownerOnly())return;var key=document.getElementById('sjinv-purchase-item').value,q=Math.max(0,n(document.getElementById('sjinv-purchase-qty').value)),note=document.getElementById('sjinv-purchase-note').value.trim(),c=allStockChoices().find(function(x){return x.key===key});if(!c\|\|q<=0)return alert('Pilih item dan jumlah pe |
| 6047 | transaction | async function purchaseSelected(){if(!ownerOnly())return;var key=document.getElementById('sjinv-purchase-item').value,q=Math.max(0,n(document.getElementById('sjinv-purchase-qty').value)),note=document.getElementById('sjinv-purchase-note').value.trim(),c=allStockChoices().find(function(x){return x.key===key});if(!c\|\|q<=0)return alert('Pilih item dan jumlah pe |
| 6047 | transaction | async function purchaseSelected(){if(!ownerOnly())return;var key=document.getElementById('sjinv-purchase-item').value,q=Math.max(0,n(document.getElementById('sjinv-purchase-qty').value)),note=document.getElementById('sjinv-purchase-note').value.trim(),c=allStockChoices().find(function(x){return x.key===key});if(!c\|\|q<=0)return alert('Pilih item dan jumlah pe |
| 6049 | set | async function opnameSelected(){if(!ownerOnly())return;var key=document.getElementById('sjinv-opname-item').value,loc=document.getElementById('sjinv-opname-loc').value,actual=Math.max(0,n(document.getElementById('sjinv-opname-qty').value)),note=document.getElementById('sjinv-opname-note').value.trim(),c=allStockChoices().find(function(x){return x.key===key}) |
| 6049 | set | async function opnameSelected(){if(!ownerOnly())return;var key=document.getElementById('sjinv-opname-item').value,loc=document.getElementById('sjinv-opname-loc').value,actual=Math.max(0,n(document.getElementById('sjinv-opname-qty').value)),note=document.getElementById('sjinv-opname-note').value.trim(),c=allStockChoices().find(function(x){return x.key===key}) |
| 6049 | set | async function opnameSelected(){if(!ownerOnly())return;var key=document.getElementById('sjinv-opname-item').value,loc=document.getElementById('sjinv-opname-loc').value,actual=Math.max(0,n(document.getElementById('sjinv-opname-qty').value)),note=document.getElementById('sjinv-opname-note').value.trim(),c=allStockChoices().find(function(x){return x.key===key}) |
| 6049 | transaction | async function opnameSelected(){if(!ownerOnly())return;var key=document.getElementById('sjinv-opname-item').value,loc=document.getElementById('sjinv-opname-loc').value,actual=Math.max(0,n(document.getElementById('sjinv-opname-qty').value)),note=document.getElementById('sjinv-opname-note').value.trim(),c=allStockChoices().find(function(x){return x.key===key}) |
| 6071 | set | async function reserveRecipeConsumption(cartSnapshot){var requested=Core.recipeConsumption(cartSnapshot,recipes());if(!Object.keys(requested).length)return null;var maxAttempts=2,lastErr=null;for(var attempt=0;attempt<maxAttempts;attempt++){var live=(await invRef('balances/ingredients').once('value')).val()\|\|{},plan=estimateConsumptionPlan(requested,live),id |
| 6071 | set | async function reserveRecipeConsumption(cartSnapshot){var requested=Core.recipeConsumption(cartSnapshot,recipes());if(!Object.keys(requested).length)return null;var maxAttempts=2,lastErr=null;for(var attempt=0;attempt<maxAttempts;attempt++){var live=(await invRef('balances/ingredients').once('value')).val()\|\|{},plan=estimateConsumptionPlan(requested,live),id |
| 6071 | update | async function reserveRecipeConsumption(cartSnapshot){var requested=Core.recipeConsumption(cartSnapshot,recipes());if(!Object.keys(requested).length)return null;var maxAttempts=2,lastErr=null;for(var attempt=0;attempt<maxAttempts;attempt++){var live=(await invRef('balances/ingredients').once('value')).val()\|\|{},plan=estimateConsumptionPlan(requested,live),id |
| 6071 | update | async function reserveRecipeConsumption(cartSnapshot){var requested=Core.recipeConsumption(cartSnapshot,recipes());if(!Object.keys(requested).length)return null;var maxAttempts=2,lastErr=null;for(var attempt=0;attempt<maxAttempts;attempt++){var live=(await invRef('balances/ingredients').once('value')).val()\|\|{},plan=estimateConsumptionPlan(requested,live),id |
| 6071 | update | async function reserveRecipeConsumption(cartSnapshot){var requested=Core.recipeConsumption(cartSnapshot,recipes());if(!Object.keys(requested).length)return null;var maxAttempts=2,lastErr=null;for(var attempt=0;attempt<maxAttempts;attempt++){var live=(await invRef('balances/ingredients').once('value')).val()\|\|{},plan=estimateConsumptionPlan(requested,live),id |
| 6071 | transaction | async function reserveRecipeConsumption(cartSnapshot){var requested=Core.recipeConsumption(cartSnapshot,recipes());if(!Object.keys(requested).length)return null;var maxAttempts=2,lastErr=null;for(var attempt=0;attempt<maxAttempts;attempt++){var live=(await invRef('balances/ingredients').once('value')).val()\|\|{},plan=estimateConsumptionPlan(requested,live),id |
| 6071 | transaction | async function reserveRecipeConsumption(cartSnapshot){var requested=Core.recipeConsumption(cartSnapshot,recipes());if(!Object.keys(requested).length)return null;var maxAttempts=2,lastErr=null;for(var attempt=0;attempt<maxAttempts;attempt++){var live=(await invRef('balances/ingredients').once('value')).val()\|\|{},plan=estimateConsumptionPlan(requested,live),id |
| 6072 | update | async function rollbackRecipeReservation(res,reason){if(!res)return;for(var x of res.reservedItems\|\|[]){await invRef('balances/ingredients/'+x.ingredientId).transaction(function(cur){cur=Object.assign({outlet:0,warehouse:0},cur\|\|{});cur.outlet=n(cur.outlet)+n(x.qty);cur.lastOp={id:res.id,action:'ROLLBACK',cashierId:currentLoginId,ts:Date.now()};return cur})} |
| 6072 | transaction | async function rollbackRecipeReservation(res,reason){if(!res)return;for(var x of res.reservedItems\|\|[]){await invRef('balances/ingredients/'+x.ingredientId).transaction(function(cur){cur=Object.assign({outlet:0,warehouse:0},cur\|\|{});cur.outlet=n(cur.outlet)+n(x.qty);cur.lastOp={id:res.id,action:'ROLLBACK',cashierId:currentLoginId,ts:Date.now()};return cur})} |
| 6076 | update | async function normalizeCommittedRecipeSale(txId,shift,cartSnapshot){if(!txId\|\|!shift)return;var txRef=db.ref(DB_PATH+'/'+shift+'/tx/'+txId),txSn=await txRef.once('value'),tx=txSn.val()\|\|{};if(tx.inventorySalesNormalized===true)return;var source=(cartSnapshot&&cartSnapshot.length)?cartSnapshot:transactionRecipeCart(tx),norm=Core.salesNormalization(source);if |
| 6076 | transaction | async function normalizeCommittedRecipeSale(txId,shift,cartSnapshot){if(!txId\|\|!shift)return;var txRef=db.ref(DB_PATH+'/'+shift+'/tx/'+txId),txSn=await txRef.once('value'),tx=txSn.val()\|\|{};if(tx.inventorySalesNormalized===true)return;var source=(cartSnapshot&&cartSnapshot.length)?cartSnapshot:transactionRecipeCart(tx),norm=Core.salesNormalization(source);if |
| 6077 | update | async function commitRecipeReservation(res,txId,shift,cartSnapshot){if(!res\|\|!txId)return;var u={},t=Date.now(),snap=recipeSaleSnapshot(cartSnapshot);u['reservations/'+res.id+'/status']='COMMITTED';u['reservations/'+res.id+'/txId']=txId;u['reservations/'+res.id+'/committedAt']=sjNowIso();u['reservations/'+res.id+'/committedTs']=t;Object.keys(res.consumption\| |
| 6077 | update | async function commitRecipeReservation(res,txId,shift,cartSnapshot){if(!res\|\|!txId)return;var u={},t=Date.now(),snap=recipeSaleSnapshot(cartSnapshot);u['reservations/'+res.id+'/status']='COMMITTED';u['reservations/'+res.id+'/txId']=txId;u['reservations/'+res.id+'/committedAt']=sjNowIso();u['reservations/'+res.id+'/committedTs']=t;Object.keys(res.consumption\| |
| 6078 | set | async function restoreVoidedRecipeTx(txId,t,shift){shift=shift\|\|activeDate;if(!txId\|\|!t\|\|String(t.status)!=='VOIDED')return;var cons=obj(t.inventoryRecipeConsumption);if(!Object.keys(cons).length)return;var state=t.inventoryRecipeVoidRestoreState\|\|{},now=Date.now();if(state.status==='DONE'\|\|(state.status==='CLAIMED'&&now-n(state.ts)<120000))return;var stateR |
| 6078 | set | async function restoreVoidedRecipeTx(txId,t,shift){shift=shift\|\|activeDate;if(!txId\|\|!t\|\|String(t.status)!=='VOIDED')return;var cons=obj(t.inventoryRecipeConsumption);if(!Object.keys(cons).length)return;var state=t.inventoryRecipeVoidRestoreState\|\|{},now=Date.now();if(state.status==='DONE'\|\|(state.status==='CLAIMED'&&now-n(state.ts)<120000))return;var stateR |
| 6078 | update | async function restoreVoidedRecipeTx(txId,t,shift){shift=shift\|\|activeDate;if(!txId\|\|!t\|\|String(t.status)!=='VOIDED')return;var cons=obj(t.inventoryRecipeConsumption);if(!Object.keys(cons).length)return;var state=t.inventoryRecipeVoidRestoreState\|\|{},now=Date.now();if(state.status==='DONE'\|\|(state.status==='CLAIMED'&&now-n(state.ts)<120000))return;var stateR |
| 6078 | transaction | async function restoreVoidedRecipeTx(txId,t,shift){shift=shift\|\|activeDate;if(!txId\|\|!t\|\|String(t.status)!=='VOIDED')return;var cons=obj(t.inventoryRecipeConsumption);if(!Object.keys(cons).length)return;var state=t.inventoryRecipeVoidRestoreState\|\|{},now=Date.now();if(state.status==='DONE'\|\|(state.status==='CLAIMED'&&now-n(state.ts)<120000))return;var stateR |
| 6078 | transaction | async function restoreVoidedRecipeTx(txId,t,shift){shift=shift\|\|activeDate;if(!txId\|\|!t\|\|String(t.status)!=='VOIDED')return;var cons=obj(t.inventoryRecipeConsumption);if(!Object.keys(cons).length)return;var state=t.inventoryRecipeVoidRestoreState\|\|{},now=Date.now();if(state.status==='DONE'\|\|(state.status==='CLAIMED'&&now-n(state.ts)<120000))return;var stateR |
| 6083 | set | async function recoverVoidTransactions(){if(currentUserRole!=='manajemen'\|\|!activeDate)return;try{var sn=await db.ref(DB_PATH+'/'+activeDate+'/tx').once('value'),txs=sn.val()\|\|{};for(var txId of Object.keys(txs)){var t=txs[txId]\|\|{},cons=obj(t.inventoryRecipeConsumption);if(String(t.status)!=='VOIDED'\|\|!Object.keys(cons).length)continue;var state=t.inventory |
| 6083 | set | async function recoverVoidTransactions(){if(currentUserRole!=='manajemen'\|\|!activeDate)return;try{var sn=await db.ref(DB_PATH+'/'+activeDate+'/tx').once('value'),txs=sn.val()\|\|{};for(var txId of Object.keys(txs)){var t=txs[txId]\|\|{},cons=obj(t.inventoryRecipeConsumption);if(String(t.status)!=='VOIDED'\|\|!Object.keys(cons).length)continue;var state=t.inventory |
| 6083 | update | async function recoverVoidTransactions(){if(currentUserRole!=='manajemen'\|\|!activeDate)return;try{var sn=await db.ref(DB_PATH+'/'+activeDate+'/tx').once('value'),txs=sn.val()\|\|{};for(var txId of Object.keys(txs)){var t=txs[txId]\|\|{},cons=obj(t.inventoryRecipeConsumption);if(String(t.status)!=='VOIDED'\|\|!Object.keys(cons).length)continue;var state=t.inventory |
| 6083 | transaction | async function recoverVoidTransactions(){if(currentUserRole!=='manajemen'\|\|!activeDate)return;try{var sn=await db.ref(DB_PATH+'/'+activeDate+'/tx').once('value'),txs=sn.val()\|\|{};for(var txId of Object.keys(txs)){var t=txs[txId]\|\|{},cons=obj(t.inventoryRecipeConsumption);if(String(t.status)!=='VOIDED'\|\|!Object.keys(cons).length)continue;var state=t.inventory |
| 6083 | transaction | async function recoverVoidTransactions(){if(currentUserRole!=='manajemen'\|\|!activeDate)return;try{var sn=await db.ref(DB_PATH+'/'+activeDate+'/tx').once('value'),txs=sn.val()\|\|{};for(var txId of Object.keys(txs)){var t=txs[txId]\|\|{},cons=obj(t.inventoryRecipeConsumption);if(String(t.status)!=='VOIDED'\|\|!Object.keys(cons).length)continue;var state=t.inventory |
| 6085 | remove | function renderDashboardTiles(){if(currentUserRole!=='manajemen')return;var root=document.getElementById('sjx-dashboard-root');if(!root)return;var old=document.getElementById('sjinv-dashboard-block');if(old)old.remove();var selected=Core.prioritizeDashboard(inventoryRows(),6),box=document.createElement('section');box.id='sjinv-dashboard-block';box.className= |
| 6258 | transaction | try{var tr=await qrisRef('events/'+eventId).transaction(function(cur){return cur\|\|row});if(tr.committed\|\|tr.snapshot&&tr.snapshot.exists()){events[eventId]=tr.snapshot.val()\|\|row;return events[eventId]}}catch(e){sjSaveError('QRIS_EVENT_CREATE',e)}return null; |
| 6262 | update | try{await qrisRef('inboxState/'+uid+'/'+eventId).update(patch);var local=Object.assign({},inboxState[eventId]\|\|{});Object.keys(patch).forEach(function(k){var v=patch[k];local[k]=v&&v['.sv']?now():v});inboxState[eventId]=local;return true}catch(e){sjSaveError('QRIS_INBOX_STATE',e);return false} |
| 6290 | transaction | var tr=await qrisRef('pending/'+p.pendingId).transaction(function(cur){ |
| 6361 | update | try{await qrisRef('pending/'+existing.pendingId).update({status:'CANCELLED',cancelledAt:firebase.database.ServerValue.TIMESTAMP,cancelledBy:currentUid()})}catch(_){} |
| 6368 | set | await qrisRef('pending/'+id).set(row);activePendingId=id;pendingRows[id]=row;return row; |
| 6479 | transaction | var tr=await qrisRef('pending/'+p.pendingId).transaction(function(cur){if(!cur\|\|String(cur.cashierId\|\|'')!==String(currentLoginId\|\|'')\|\|cur.providerTransactionId)return;if(String(cur.status)!=='WAITING_QRIS'&&String(cur.status)!=='MANUAL_FALLBACK')return;cur.status='CANCELLED';cur.cancelledAt=firebase.database.ServerValue.TIMESTAMP;cur.cancelledBy=currentUid |
| 6495 | update | try{await qrisRef('pending/'+p.pendingId).update({status:'MANUAL_FALLBACK',manualFallbackAt:firebase.database.ServerValue.TIMESTAMP});p.status='MANUAL_FALLBACK'}catch(_){ } |
| 6512 | transaction | var pr=await qrisRef('pending/'+pendingId).transaction(function(cur){ |
| 6517 | transaction | var tr=await qrisRef('signals/'+providerId).transaction(function(cur){ |
| 6522 | transaction | await qrisRef('pending/'+pendingId).transaction(function(cur){if(!cur\|\|String(cur.providerTransactionId)!==providerId\|\|String(cur.status)!=='MATCHED'\|\|cur.finalizedTransactionId)return;cur.providerTransactionId=null;cur.status='WAITING_QRIS';cur.matchedAt=null;return cur}).catch(function(){}); |
| 6537 | transaction | var pr=await qrisRef('pending/'+globalMatch.pendingId).transaction(function(cur){if(!cur\|\|String(cur.cashierId\|\|'')!==String(currentLoginId\|\|'')\|\|String(cur.status)!=='WAITING_QRIS'\|\|cur.providerTransactionId\|\|Core.isPendingExpired(cur,now()))return;cur.providerTransactionId=id;cur.status='MATCHED';cur.matchedAt=firebase.database.ServerValue.TIMESTAMP;return |
| 6539 | transaction | var tr=await qrisRef('signals/'+id).transaction(function(cur){if(!cur\|\|cur.matchedTransactionId\|\|String(cur.status)==='CONFIRMED'\|\|!Core.eligibleSignalStatus(cur.status))return;cur.status='MATCHED';cur.matchedTransactionId=globalMatch.pendingId;cur.matchedAt=firebase.database.ServerValue.TIMESTAMP;return cur}); |
| 6541 | transaction | await qrisRef('pending/'+globalMatch.pendingId).transaction(function(cur){if(!cur\|\|String(cur.providerTransactionId)!==id\|\|String(cur.status)!=='MATCHED'\|\|cur.finalizedTransactionId)return;cur.providerTransactionId=null;cur.status='WAITING_QRIS';cur.matchedAt=null;return cur}).catch(function(){}); |
| 6549 | transaction | try{await qrisRef('signals/'+id).transaction(function(cur){if(!cur\|\|cur.matchedTransactionId\|\|String(cur.status)==='CONFIRMED'\|\|!Core.eligibleSignalStatus(cur.status))return;cur.status='AMBIGUOUS';return cur})}catch(e){sjSaveError('QRIS_MATCH_STATE',e)} |
| 6554 | transaction | try{await qrisRef('signals/'+id).transaction(function(cur){if(!cur\|\|cur.matchedTransactionId\|\|String(cur.status)==='CONFIRMED'\|\|!Core.eligibleSignalStatus(cur.status))return;cur.status='UNMATCHED';return cur})}catch(e){sjSaveError('QRIS_MATCH_STATE',e)} |
| 6575 | transaction | var lock=await qrisRef('pending/'+p.pendingId).transaction(function(cur){if(!cur\|\|String(cur.status)!=='MATCHED'\|\|String(cur.providerTransactionId)!==String(p.providerTransactionId)\|\|cur.finalizedTransactionId)return;cur.status='FINALIZING';cur.finalizingAt=firebase.database.ServerValue.TIMESTAMP;cur.finalizingBy=currentUid();return cur}); |
| 6582 | update | if(!candidates.length){await qrisRef('pending/'+p.pendingId).update({status:'MATCHED',finalizingAt:null,finalizingBy:null});throw new Error('Transaksi belum terbentuk. Pending dikembalikan untuk dicoba lagi.');} |
| 6583 | update | var txId=candidates[0],u={};u['pending/'+p.pendingId+'/status']='FINALIZED';u['pending/'+p.pendingId+'/finalizedTransactionId']=txId;u['pending/'+p.pendingId+'/finalizedAt']=firebase.database.ServerValue.TIMESTAMP;u['signals/'+p.providerTransactionId+'/status']='CONFIRMED';u['signals/'+p.providerTransactionId+'/confirmedAt']=firebase.database.ServerValue.TIM |
| 6592 | update | if(found){var u={};u['pending/'+p.pendingId+'/status']='FINALIZED';u['pending/'+p.pendingId+'/finalizedTransactionId']=found;u['pending/'+p.pendingId+'/finalizedAt']=firebase.database.ServerValue.TIMESTAMP;if(p.providerTransactionId){u['signals/'+p.providerTransactionId+'/status']='CONFIRMED';u['signals/'+p.providerTransactionId+'/confirmedAt']=firebase.data |
| 6611 | update | try{await db.ref(QRIS_DB_PATH).update(u);showToast(kind==='READ'?'QRIS ditandai dibaca.':kind==='ARCHIVE'?'QRIS dipindahkan ke Riwayat.':'QRIS dihapus dari tampilan.','success');patchOwnerNotifications();SJX.updateBell()}catch(e){sjSaveError('QRIS_INBOX_BULK',e);alert(sjFriendlyError(e))} |
| 6619 | transaction | try{var tr=await qrisRef('signals/'+providerId).transaction(function(cur){if(!cur\|\|cur.matchedTransactionId\|\|['MATCHED','CONFIRMED'].includes(String(cur.status\|\|'')))return;cur.resolutionState='DISMISSED';cur.resolvedAt=firebase.database.ServerValue.TIMESTAMP;cur.resolvedBy=currentUid();cur.resolvedReason=reason;return cur});if(!tr.committed)return alert('QR |
| 6646 | update | var allBtn=document.getElementById('sj62-readall');if(allBtn)allBtn.onclick=async()=>{var rows=regularUnread,u={},rk=SJHarden.safeReaderKey();rows.forEach(x=>u['global/notifications/'+x._key+'/readBy/'+rk]=true);if(!rows.length)return showToast('Semua notifikasi biasa sudah dibaca.','success');try{await db.ref(DB_PATH).update(u);rows.forEach(x=>{x.readBy=x.r |
| 6664 | update | window.executeHapusGranular=async function(){var qs=Array.from(document.querySelectorAll('#list-qris-granular input[data-qris-provider]:checked')).map(function(x){return x.dataset.qrisProvider});if(!qs.length)return granularExecuteBase.apply(this,arguments);var legacy=!!document.querySelector('.modal-granular-item input:checked:not([data-qris-provider])')\|\|! |
| 6682 | update | if(manual){try{var after=(await posRef(p.activeDate+'/tx').once('value')).val()\|\|{},keys=Object.keys(after).filter(function(k){return !Object.prototype.hasOwnProperty.call(before,k)&&String(after[k].method\|\|'').toUpperCase()==='QRIS'&&Number(after[k].total)===Number(p.amount)&&String(after[k].cashierId\|\|'')===String(p.cashierId)});if(keys.length){await qrisR |
| 6724 | set | window.saveMenu=async function(){injectProductFields();var c=document.getElementById('new-c').value.toUpperCase(),n=document.getElementById('new-n').value.toUpperCase(),p=getNum(document.getElementById('new-p').value),cp=document.getElementById('new-cp').value.toLowerCase(),img=document.getElementById('new-i').value,track=!!document.getElementById('sj-new-tr |
| 6725 | set | window.saveEditMaster=async function(){injectProductFields();var id=document.getElementById('edit-m-id').value,c=document.getElementById('edit-m-c').value.toUpperCase(),n=document.getElementById('edit-m-n').value.toUpperCase(),p=getNum(document.getElementById('edit-m-p').value),cp=document.getElementById('edit-m-cp').value.toLowerCase(),img=document.getEleme |
| 6793 | set | async function saveSettings(){if(currentUserRole!=='manajemen')return alert('Hanya Owner.');var st=normalizeSettings({taxEnabled:document.getElementById('sj-pricing-tax-enabled').checked,taxRate:document.getElementById('sj-pricing-tax-rate').value,serviceEnabled:document.getElementById('sj-pricing-service-enabled').checked,serviceRate:document.getElementById |
| 7015 | remove | else{o.textContent=fmt(diff);o.classList.remove('sj-f02-cash-short');if(lab)lab.textContent='Kembalian'} |
| 7060 | remove | var old=document.getElementById('sj-f02-receipt-breakdown');if(old)old.remove(); |
| 7065 | remove | var oldNote=document.getElementById('sj-f02-receipt-payment-detail');if(oldNote)oldNote.remove(); |
| 7249 | update | await sjTimeout(db.ref(DB_PATH).update(u),10000,'COST_INITIAL_WRITE_TIMEOUT');return u |
| 7336 | transaction | var tx=await sjTimeout(db.ref(INV).transaction(function(root){ |
| 7356 | update | try{await sjTimeout(db.ref(DB_PATH).update(u),15000,'PURCHASE_EXPENSE_TIMEOUT')}catch(e){var es=await db.ref(DB_PATH+'/'+p.shift+'/opex/'+p.expenseRef).once('value'),row=es.val()\|\|{};if(String(row.purchaseRef\|\|'')!==String(purchaseId))throw e} |
| 7359 | update | async function finalizePurchase(purchaseId){var ref=db.ref(INV+'/purchases/'+purchaseId),sn=await ref.once('value'),p=sn.val();if(!p)throw new Error('PURCHASE_NOT_FOUND');if(p.status==='COMMITTED')return p;if(!p.inventoryApplied\|\|!p.expenseApplied)throw new Error('PURCHASE_NOT_COMPLETE');await ref.update({status:'COMMITTED',committedAt:sjNowIso(),committedTs |
| 7367 | transaction | var claim=await sjTimeout(db.ref(INV+'/purchases/'+purchaseId).transaction(function(cur){if(cur)return;return row}),10000,'PURCHASE_PREPARE_TIMEOUT');if(!claim.committed)throw new Error('PURCHASE_ID_CONFLICT');return resumePurchase(purchaseId) |
| 7440 | update | if(Object.keys(repair).length)await ref.update(repair); |
| 7515 | set | var costing=await prepareSaleCosting(cartSnapshot,pricingQuote),id=sjPushKey(INV+'/costingReservations'),now=Date.now(),row={id:id,status:'PREPARED',shift:activeDate,cashierId:currentLoginId,cashierName:currentUserName,cartSignature:cartSignature(cartSnapshot),pricingFingerprint:window.SJPrice?SJPrice.fingerprint(cartSnapshot):'',total:n(pricingQuote&&pricin |
| 7520 | transaction | var ref=db.ref(DB_PATH+'/'+res.shift+'/tx/'+txId+'/costing'),tr=await sjTimeout(ref.transaction(function(cur){if(cur)return;return res.costingQuote}),8000,'COST_ATTACH_TIMEOUT');if(!tr.committed){var sn=await ref.once('value');if(!sn.exists())throw new Error('COST_ATTACH_FAILED')} |
| 7521 | update | await db.ref(INV+'/costingReservations/'+res.id).update({status:'COMMITTED',transactionId:txId,committedAt:sjNowIso(),committedTs:Date.now()});return txId |
| 7523 | update | async function recoverOneReservation(res){var sn=await db.ref(DB_PATH+'/'+res.shift+'/tx').once('value'),m=matchReservationTransaction(res,sn.val()\|\|{});if(m.status==='MATCH'){await attachReservationCosting(res,m.id);return true}await db.ref(INV+'/costingReservations/'+res.id).update({status:m.status==='AMBIGUOUS'?'AMBIGUOUS':'PREPARED',candidateIds:m.candid |
| 7529 | update | var result=await BASE_PROCESS.apply(this,arguments);try{var after=(await sjTimeout(db.ref(DB_PATH+'/'+reservation.shift+'/tx').once('value'),7000,'COST_TX_AFTER_TIMEOUT')).val()\|\|{},m=matchReservationTransaction(reservation,after);if(m.status==='MATCH')await attachReservationCosting(reservation,m.id);else if(m.status==='AMBIGUOUS')await db.ref(INV+'/costingR |
| 7529 | update | var result=await BASE_PROCESS.apply(this,arguments);try{var after=(await sjTimeout(db.ref(DB_PATH+'/'+reservation.shift+'/tx').once('value'),7000,'COST_TX_AFTER_TIMEOUT')).val()\|\|{},m=matchReservationTransaction(reservation,after);if(m.status==='MATCH')await attachReservationCosting(reservation,m.id);else if(m.status==='AMBIGUOUS')await db.ref(INV+'/costingR |
| 7685 | transaction | var tr=await sjTimeout(ref.transaction(function(cur){if(cur)return;return costing}),8000,'REFUND_COST_WRITE_TIMEOUT'); |
| 7691 | transaction | var tr=await sjTimeout(txRef.transaction(function(cur){ |
| 7758 | remove | var old=document.getElementById('sjcost-purchase-history-card');if(old)old.remove(); |
| 8614 | remove | if(x){x.openDashboard=function(){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));document.getElementById('view5')?.classList.add('active');document.getElementById('tab5')?.classList.add('active');setTimeout(()=>self.render(),0);return true}} |
| 8614 | remove | if(x){x.openDashboard=function(){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));document.getElementById('view5')?.classList.add('active');document.getElementById('tab5')?.classList.add('active');setTimeout(()=>self.render(),0);return true}} |
| 8615 | remove | if(typeof window.showView==='function'){const baseShow=window.showView;window.showView=function(n){const out=baseShow.apply(this,arguments);if(Number(n)===5)setTimeout(()=>self.render(),20);else document.body.classList.remove('sjui02-dashboard-open');return out};try{showView=window.showView}catch(_){ }} |
| 8642 | remove | legacy.remove();return true; |
| 8742 | remove | document.body.classList.remove('sj53-stock');document.body.classList.add('sjui03a-sales-open');sc.innerHTML=this.salesHTML(this.model()); |
| 8759 | remove | if(typeof window.showView==='function'){const baseShow=window.showView;window.showView=function(n){const out=baseShow.apply(this,arguments);if(Number(n)===1)setTimeout(()=>self.renderSales(),15);else{document.body.classList.remove('sjui03a-sales-open');self.syncCartBar()}return out};try{showView=window.showView}catch(_){ }} |
| 8926 | remove | leaveFocusedFlow(){document.body.classList.remove('sjvc011-focused-flow')}, |
| 8933 | remove | openCashPayment(){if(!this.mobile()\|\|!Array.isArray(cart)\|\|!cart.length)return base.baseOpenPayment?base.baseOpenPayment('Tunai'):null;if(window.SJShift&&typeof SJShift.guardTransaction==='function'&&!SJShift.guardTransaction())return;this.enterFocusedFlow();SJCommercialFinalV5961.cartMethod='Tunai';try{payMethod='Tunai'}catch(_){};try{clsModal('modal-cart') |
| 8935 | remove | renderSuccess(jam,total,method,cash,txId){if(!this.mobile())return;this.enterFocusedFlow();const ov=document.getElementById('modal-struk-fs'),modal=ov&&ov.querySelector('.modal'),content=document.getElementById('struk-content'),footer=ov&&ov.querySelector('.fs-footer');if(!ov\|\|!modal\|\|!content\|\|!footer)return;const old=modal.querySelector('.sjvc011-success') |
| 8936 | remove | closeSuccess(){this.leaveFocusedFlow();const ov=document.getElementById('modal-struk-fs'),content=document.getElementById('struk-content'),footer=ov&&ov.querySelector('.fs-footer');if(content)content.classList.remove('sjvc011-print-source');if(footer)footer.style.display='';try{clsModal('modal-struk-fs')}catch(_){if(ov)ov.style.display='none'}}, |
| 9012 | remove | Array.from(document.querySelectorAll('#bottom-nav .tab-btn')\|\|[]).forEach(btn=>btn.classList&&btn.classList.remove('active')); |
| 9017 | remove | leaveTransactionFlow(){document.body&&document.body.classList&&document.body.classList.remove('sjvc012-transaction-flow');baseLeave();const nav=document.getElementById('bottom-nav');if(nav)delete nav.dataset.sjvc012Parent}, |
| 9023 | remove | try{const content=document.getElementById('struk-content'),footer=receipt.querySelector('.fs-footer'),success=receipt.querySelector('.sjvc011-success');if(content)content.classList.remove('sjvc011-print-source');if(footer)footer.style.display='';if(success)success.remove();clsModal('modal-struk-fs')}catch(_){receipt.style.display='none'} |
| 9023 | remove | try{const content=document.getElementById('struk-content'),footer=receipt.querySelector('.fs-footer'),success=receipt.querySelector('.sjvc011-success');if(content)content.classList.remove('sjvc011-print-source');if(footer)footer.style.display='';if(success)success.remove();clsModal('modal-struk-fs')}catch(_){receipt.style.display='none'} |
| 9064 | remove | const inp=modal.querySelector('#m-cash'),pay=modal.querySelector('[data-cash-pay]');const refresh=()=>{const cash=this.parseCash(inp.value),change=Math.max(0,cash-total),box=modal.querySelector('#sjvc01-changebox'),out=modal.querySelector('#sjvc01-change');if(out)out.textContent=this.money(change);if(box)box.classList.toggle('bad',cash<total);if(pay)pay.disa |
| 9246 | remove | function markQrisNotReady(message){const page=qrisPage();if(!page)return;page.classList.add('sjvc01b1-qris-not-ready');page.classList.remove('sjvc01b1-qris-ready');page.removeAttribute('data-qris-ready');qrisPendingRow=null;ensureGateCard(page,message?'error':'loading',message);const t=page.querySelector('[data-qris-timer]');if(t)t.textContent='--:--'} |
| 9247 | remove | function markQrisReady(row){const page=qrisPage();if(!page)return;qrisPendingRow=row\|\|null;page.classList.remove('sjvc01b1-qris-not-ready');page.classList.add('sjvc01b1-qris-ready');page.setAttribute('data-qris-ready','1');const card=page.querySelector('.sjvc01b1-qris-gate');if(card)card.remove();try{SJQrisSignalBeta.renderCommercialQrisState()}catch(_){};v3 |
| 9247 | remove | function markQrisReady(row){const page=qrisPage();if(!page)return;qrisPendingRow=row\|\|null;page.classList.remove('sjvc01b1-qris-not-ready');page.classList.add('sjvc01b1-qris-ready');page.setAttribute('data-qris-ready','1');const card=page.querySelector('.sjvc01b1-qris-gate');if(card)card.remove();try{SJQrisSignalBeta.renderCommercialQrisState()}catch(_){};v3 |
| 9345 | remove | try{document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));document.getElementById('tab2')?.classList.add('active')}catch(_){} |
| 9360 | remove | const root=document.getElementById('opr-menu-view');if(!root)return;document.body.classList.remove('sjvc02a-child');setOperationalParentNav();const m=metrics(),owner=currentUserRole==='manajemen'; |
| 9389 | remove | window.openOpr=(id)=>{const v=baseOpenOpr(id);setOperationalParentNav();setTimeout(()=>{if(Number(id)===3)renderStock();else if(Number(id)===9)renderRestock();else document.body.classList.remove('sjvc02a-child')},0);return v};try{openOpr=window.openOpr}catch(_){} |
| 9390 | remove | window.closeOpr=()=>{document.body.classList.remove('sjvc02a-child');const v=baseCloseOpr();setOperationalParentNav();setTimeout(renderOperations,0);return v};try{closeOpr=window.closeOpr}catch(_){} |
| 9391 | remove | const baseShow=window.showView;window.showView=(n)=>{const v=baseShow(n);if(Number(n)===2)setTimeout(renderOperations,0);else document.body.classList.remove('sjvc02a-child');return v};try{showView=window.showView}catch(_){} |

## Firebase read/listener sites

| Line | Operation | Snippet |
|---:|---|---|
| 1488 | once(value) | var snap=await sjTimeout(db.ref(DB_PATH+'/global/users').once('value'),10000,'LOGIN_TIMEOUT');var users=snap.val()\|\|{}; |
| 1512 | on(value) | db.ref(DB_PATH+'/global').on('value',function(snap){ |
| 1523 | on(value) | if(isRecapMode){var ref=db.ref(DB_PATH).orderByKey().startAt(activeDateOnly).endAt(activeDateOnly+'\uf8ff');var cb=function(snap){var data=snap.val()\|\|{};var agg=emptyDay();agg.isRecap=true;agg.locked=true;var rows=Object.keys(data).filter(k=>k!=='global'&&/^\d{4}-\d{2}-\d{2}-S[123]$/.test(k)).sort();var last=null;rows.forEach(k=>{var d=data[k]\|\|{};last=d;[' |
| 1524 | on(value) | }else{var ref2=db.ref(DB_PATH+'/'+activeDate);var cb2=function(snap){var v=snap.val();if(!v){v=emptyDay();db.ref(DB_PATH+'/'+activeDate).set(v).catch(e=>sjSaveError('CREATE_SHIFT',e))}cloudData[activeDate]=v;renderApp()};ref2.on('value',cb2);dailyListener={ref:ref2,cb:cb2}} |
| 1602 | once(value) | try{await sjTimeout(db.ref(DB_PATH).update(upd),10000,'TX_WRITE_TIMEOUT')}catch(e){var verify=await sjTimeout(db.ref(DB_PATH+'/'+base+'/tx/'+txId).once('value'),4000,'TX_VERIFY_TIMEOUT').catch(()=>null);if(!(verify&&verify.exists()))throw e} |
| 1604 | once(value) | }catch(e){sjSaveError('TRANSACTION',e);var check=null;try{check=await db.ref(DB_PATH+'/'+activeDate+'/tx/'+txId).once('value')}catch(_){}if(!(check&&check.exists())){for(const r of reserved){try{await db.ref(DB_PATH+'/global/inventory/'+r.id).transaction(cur=>sjNum(cur)+r.q)}catch(_){}}}alert('❌ '+sjFriendlyError(e))}finally{SJ_TX_BUSY=false;sjSetBusy(btn,fa |
| 1634 | once(value) | async function exportCSV(){var bln=activeDateOnly.substring(0,7);try{var snap=await sjTimeout(db.ref(DB_PATH).orderByKey().startAt(bln).endAt(bln+'\uf8ff').once('value'),12000,'CSV_TIMEOUT'),data=snap.val()\|\|{};currentCSV='Shift,Kasir,Penjualan,Tunai,QRIS,Transfer,Kasbon,Pelunasan Hutang,Pengeluaran,Setoran,Kasbon Karyawan Baru,Kasbon Karyawan Kembali,Laci A |
| 1716 | once(value) | function hapusSemuaTransaksi(){if(currentUserRole!=='manajemen')return alert('Hanya Owner.');showModalInput('Hapus Semua Transaksi','Masukkan PIN Owner',async function(pin){if(!(await sjVerifyCurrentOwnerPin(pin)))return alert('PIN salah.');if(!confirm('Semua data shift/transaksi akan dihapus. Master produk, akun, hutang dan kasbon tetap ada. Lanjutkan?'))re |
| 1739 | once(value) | async function backupDatabase(){if(currentUserRole!=='manajemen')return alert('Hanya Owner.');showLoading('Membuat backup database...');try{var snap=await sjTimeout(db.ref(DB_PATH).once('value'),15000,'BACKUP_TIMEOUT'),data=snap.val();if(!data)return alert('Database kosong.');var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),ts=sjNow |
| 1742 | once(value) | function restoreDatabase(event){var file=event.target.files[0];event.target.value='';if(!file)return;if(currentUserRole!=='manajemen')return alert('Hanya Owner.');if(!confirm('Restore akan mengganti seluruh data toko dengan isi file backup. Lanjutkan?'))return;var r=new FileReader();r.onload=async function(ev){showLoading('Memeriksa & memulihkan database...' |
| 1846 | once(value) | async function executeHapusGranular(){var pass=document.getElementById('hapus-granular-password').value;if(!(await sjVerifyCurrentOwnerPin(pass)))return alert('PIN salah.');if(!confirm('Data yang dipilih akan dihapus permanen. Lanjutkan?'))return;var selectedUsers=Array.from(document.querySelectorAll('#list-user input:checked')).map(x=>String(x.dataset.user\| |
| 1846 | once(value) | async function executeHapusGranular(){var pass=document.getElementById('hapus-granular-password').value;if(!(await sjVerifyCurrentOwnerPin(pass)))return alert('PIN salah.');if(!confirm('Data yang dipilih akan dihapus permanen. Lanjutkan?'))return;var selectedUsers=Array.from(document.querySelectorAll('#list-user input:checked')).map(x=>String(x.dataset.user\| |
| 1853 | once(value) | async function sjSavePayment(){if(!SJ_ACTIVE_PAYMENT\|\|isDayLocked())return;if(SJ_ACTIVE_PAYMENT.type==='advance'&&currentUserRole!=='manajemen')return showToast('Pembayaran kasbon karyawan hanya dapat dilakukan Owner.','error');var btn=document.getElementById('sj-pay-save'),amt=getNum(document.getElementById('sj-pay-amount').value),method=sjNormPaymentMethod |
| 1860 | once(value) | async function sjFetchPeriod(type){if(type==='shift'){if(isRecapMode)throw new Error('Pilih shift spesifik untuk Laporan Shift.');var s=await sjTimeout(db.ref(DB_PATH+'/'+activeDate).once('value'),10000,'REPORT_TIMEOUT');return{period:activeDate,data:{[activeDate]:s.val()\|\|emptyDay()}}}if(type==='daily'){var day=activeDateOnly,ref=db.ref(DB_PATH).orderByKey( |
| 1860 | once(value) | async function sjFetchPeriod(type){if(type==='shift'){if(isRecapMode)throw new Error('Pilih shift spesifik untuk Laporan Shift.');var s=await sjTimeout(db.ref(DB_PATH+'/'+activeDate).once('value'),10000,'REPORT_TIMEOUT');return{period:activeDate,data:{[activeDate]:s.val()\|\|emptyDay()}}}if(type==='daily'){var day=activeDateOnly,ref=db.ref(DB_PATH).orderByKey( |
| 1860 | once(value) | async function sjFetchPeriod(type){if(type==='shift'){if(isRecapMode)throw new Error('Pilih shift spesifik untuk Laporan Shift.');var s=await sjTimeout(db.ref(DB_PATH+'/'+activeDate).once('value'),10000,'REPORT_TIMEOUT');return{period:activeDate,data:{[activeDate]:s.val()\|\|emptyDay()}}}if(type==='daily'){var day=activeDateOnly,ref=db.ref(DB_PATH).orderByKey( |
| 1877 | once(value) | async function sjTestFirebase(){var out=document.getElementById('sj-diag-firebase'),start=performance.now(),id='diag_'+Date.now();out.textContent='Menguji...';try{await sjTimeout(db.ref(DB_PATH+'/global/_diagnostics/'+id).set({at:sjNowIso()}),8000,'DIAG_WRITE_TIMEOUT');var s=await sjTimeout(db.ref(DB_PATH+'/global/_diagnostics/'+id).once('value'),8000,'DIAG_ |
| 1920 | once(value) | async dayModel(){try{var snap=await sjTimeout(db.ref(DB_PATH).orderByKey().startAt(activeDateOnly).endAt(activeDateOnly+'\uf8ff').once('value'),9000,'DASH_TIMEOUT'),d=snap.val()\|\|{},sh={};Object.keys(d).filter(k=>/^\d{4}-\d{2}-\d{2}-S[123]$/.test(k)).forEach(k=>sh[k]=d[k]);return sjAggregateReport(sh,'daily',activeDateOnly)}catch(e){sjSaveError('DASHBOARD',e |
| 1927 | on(value) | listenRestock(){var ref=db.ref(DB_PATH+'/global/restockRequests');ref.on('value',snap=>{var rows=sjArr(snap.val()),now=Date.now();cloudData.global.restockRequests=snap.val()\|\|{}; |
| 2035 | on(value) | async function sjOpenOwnerShiftDetail(key){if(currentUserRole!=='manajemen')return showToast('Detail Shift lengkap hanya untuk Owner.','error');sjStopShiftDetailLive();var modal=document.getElementById('modal-sj-shift-detail'),body=document.getElementById('sj-shift-detail-body');if(!modal\|\|!body)return;body.innerHTML='<div class="sj-report-loading">Memuat de |
| 2061 | once(value) | async loadDay(date){var codes=['-S1','-S2','-S3'],rows=await Promise.all(codes.map(async c=>{var snap=await sjTimeout(db.ref(DB_PATH+'/'+date+c).once('value'),9000,'SHIFT_DAY_'+c.slice(1)+'_TIMEOUT');return[c,snap.val()\|\|emptyDay()]})),o={};rows.forEach(([c,d])=>o[c]=d\|\|emptyDay());this.dayCache=o;this.dayCacheDate=date;return o}, |
| 2132 | once(value) | var fresh=(await db.ref(DB_PATH+'/'+activeDate).once('value')).val()\|\|emptyDay();if(fresh.locked)throw new Error('Shift sudah ditutup.');var baseline=this.snapshot(fresh),sessions=sjObj(fresh.sessions),first=Object.keys(sessions).length===0,u={};u[activeDate+'/sessions/'+sessionId]={id:sessionId,status:'ACTIVE',cashierId:targetId,cashierName:targetName,opene |
| 2140 | once(value) | var tr=await sjTimeout(controlRef.transaction(cur=>{if(!cur\|\|cur.status!=='ACTIVE'\|\|String(cur.currentSessionId)!==String(oldId))return;return{status:'ACTIVE',currentSessionId:newId,currentCashierId:targetId,currentCashierName:targetName,startedAt:cur.startedAt\|\|sjNowIso(),lastHandoverAt:sjNowIso(),version:sjNum(cur.version)+1}}),8000,'HANDOVER_LOCK_TIMEOUT' |
| 2150 | once(value) | var fresh=(await sjTimeout(db.ref(DB_PATH+'/'+activeDate).once('value'),8000,'SHIFT_CLOSE_READ_TIMEOUT')).val()\|\|d,freshSession=fresh.sessions?.[sid]\|\|session,sessionExpected=this.expectedSession(freshSession,fresh),shiftExpected=sjExpectedCash(fresh),sessionDiff=actual-sessionExpected,shiftDiff=actual-shiftExpected;if((sessionDiff!==0\|\|shiftDiff!==0)&&!note |
| 2353 | once(value) | var snap=await sjTimeout(db.ref(DB_PATH+'/global').once('value'),12000,'GLOBAL_REFRESH_TIMEOUT'); |
| 2362 | once(value) | var snap=await sjTimeout(db.ref(DB_PATH+'/global/menu').once('value'),9000,'CART_REVALIDATE_TIMEOUT'); |
| 2391 | once(value) | var snap=await sjTimeout(db.ref(DB_PATH+'/global/'+node).once('value'),9000,'PERSON_LOOKUP_TIMEOUT'); |
| 2428 | once(value) | var snap=await sjTimeout(db.ref(DB_PATH+'/global/transactionReservations').once('value'),10000,'RESERVATION_SCAN_TIMEOUT').catch(()=>null); |
| 2436 | once(value) | var txSnap=await sjTimeout(db.ref(DB_PATH+'/'+shift+'/tx/'+txId).once('value'),7000,'RESERVATION_TX_CHECK_TIMEOUT').catch(()=>null); |
| 2548 | once(value) | var verify=await sjTimeout(db.ref(DB_PATH+'/'+base+'/tx/'+txId).once('value'),4000,'TX_VERIFY_TIMEOUT').catch(()=>null); |
| 2566 | once(value) | if(txId){try{var c=await db.ref(DB_PATH+'/'+activeDate+'/tx/'+txId).once('value');exists=!!(c&&c.exists())}catch(_){}} |
| 2617 | once(value) | var usersSnap=await sjTimeout(db.ref(DB_PATH+'/global/users').once('value'),9000,'USER_GUARD_TIMEOUT'),users=usersSnap.val()\|\|{},target=users[id]; |
| 2627 | once(value) | var snap=await sjTimeout(db.ref(DB_PATH+'/'+k).once('value'),5000,'USER_SHIFT_GUARD_TIMEOUT').catch(()=>null); |
| 2689 | once(value) | var old=await sjTimeout(db.ref(DB_PATH).once('value'),12000,'PRE_RESTORE_TIMEOUT'),oldData=old.val(); |
| 2708 | once(value) | var old=await sjTimeout(db.ref(DB_PATH).once('value'),12000,'PRE_RESTORE_TIMEOUT'),oldData=old.val();if(oldData)sjDownloadBlob(new Blob([JSON.stringify(oldData,null,2)],{type:'application/json'}),'PRE_RESTORE_'+sjNowIso().replace(/[:.]/g,'-')+'.json'); |
| 2710 | once(value) | catch(e){var marker=await sjTimeout(db.ref(DB_PATH+'/global/schema/restoreRequestId').once('value'),6000,'RESTORE_VERIFY_TIMEOUT').catch(()=>null);if(!(marker&&String(marker.val()\|\|'')===restoreId))throw e} |
| 2876 | once(value) | var snap=await sjTimeout(db.ref(DB_PATH+'/'+shift).once('value'),5000,code+'_VERIFY_TIMEOUT'),d=snap.val()\|\|{},c=d.sessionControl\|\|{},ses=d.sessions?.[sessionId]\|\|{}; |
| 2923 | once(value) | await this.verifiedRootUpdate(u,'PAY_TIMEOUT',async()=>{var v=(await db.ref(DB_PATH+'/global/'+node+'/'+key+'/lastPaymentId').once('value')).val();return String(v\|\|'')===payId}); |
| 2968 | once(value) | await this.verifiedRootUpdate(u,'REFUND_WRITE_TIMEOUT',async()=>String((await db.ref(DB_PATH+'/'+activeDate+'/tx/'+txKey+'/lastRefundId').once('value')).val()\|\|'')===String(refid)); |
| 2971 | once(value) | sjSaveError('REFUND_HARDENED',e);var committed=false;try{committed=String((await db.ref(DB_PATH+'/'+activeDate+'/tx/'+txKey+'/lastRefundId').once('value')).val()\|\|'')===String(refid)}catch(_){ } |
| 2988 | once(value) | if(String(fresh.method\|\|'').includes('KASBON')&&fresh.debtId){var debtSnap=await sjTimeout(db.ref(DB_PATH+'/global/hutang/'+fresh.debtId).once('value'),6000,'VOID_DEBT_CHECK_TIMEOUT'),debt=debtSnap.val()\|\|{};if(sjNum(debt.paid)>0\|\|['SEBAGIAN','LUNAS'].includes(String(debt.status\|\|'').toUpperCase()))throw new Error('Transaksi Kasbon ini sudah memiliki pembaya |
| 2994 | once(value) | await this.verifiedRootUpdate(u,'VOID_TIMEOUT',async()=>String((await db.ref(DB_PATH+'/'+activeDate+'/tx/'+txKey+'/voidId').once('value')).val()\|\|'')===voidId);lockHeld=false;showToast('Transaksi di-VOID dan stok dikembalikan.','warning');calcLaporan();sjRenderTransactionHistory() |
| 2996 | once(value) | sjSaveError('VOID_HARDENED',e);var committed=false;try{committed=String((await db.ref(DB_PATH+'/'+activeDate+'/tx/'+txKey+'/voidId').once('value')).val()\|\|'')===voidId}catch(_){ } |
| 3082 | once(value) | await this.verifiedUpdate(u,'REFUND_ATOMIC_TIMEOUT',async()=>String((await db.ref(DB_PATH+'/'+activeDate+'/tx/'+txKey+'/lastRefundId').once('value')).val()\|\|'')===String(refid)); |
| 3085 | once(value) | sjSaveError('REFUND_ATOMIC',e);var committed=false;try{committed=String((await db.ref(DB_PATH+'/'+activeDate+'/tx/'+txKey+'/lastRefundId').once('value')).val()\|\|'')===String(refid)}catch(_){ } |
| 3101 | once(value) | if(String(fresh.method\|\|'').includes('KASBON')&&fresh.debtId){var debtSnap=await sjTimeout(db.ref(DB_PATH+'/global/hutang/'+fresh.debtId).once('value'),6000,'VOID_DEBT_CHECK_TIMEOUT'),debt=debtSnap.val()\|\|{};if(sjNum(debt.paid)>0\|\|['SEBAGIAN','LUNAS'].includes(String(debt.status\|\|'').toUpperCase()))throw new Error('Transaksi Kasbon ini sudah memiliki pembaya |
| 3109 | once(value) | await this.verifiedUpdate(u,'VOID_ATOMIC_TIMEOUT',async()=>String((await db.ref(DB_PATH+'/'+activeDate+'/tx/'+txKey+'/voidId').once('value')).val()\|\|'')===voidId);lockHeld=false;showToast('Transaksi di-VOID dan seluruh koreksi tersimpan atomik.','warning');calcLaporan();sjRenderTransactionHistory() |
| 3111 | once(value) | sjSaveError('VOID_ATOMIC',e);var committed=false;try{committed=String((await db.ref(DB_PATH+'/'+activeDate+'/tx/'+txKey+'/voidId').once('value')).val()\|\|'')===voidId}catch(_){ } |
| 3122 | once(value) | try{u[activeDate+'/opex/'+id]={id:id,operationId:id,category:cat,n:desc,a:amount,amount:amount,source:source,user:currentUserName,userId:currentLoginId,createdAt:sjNowIso(),ts:Date.now()};var aid=sjPushKey(DB_PATH+'/global/auditLogs');u['global/auditLogs/'+aid]={id:aid,action:'EXPENSE',detail:cat+' • '+desc+' • '+fmt(amount)+' • '+sjFundLabel(source),operati |
| 3130 | once(value) | try{var employeeId=await SJReliability.ensurePerson('employee',nama),issueId=sjPushKey(DB_PATH+'/'+activeDate+'/employeeAdvanceIssued'),u={};u['global/kasbonKaryawan/'+id]={id:id,operationId:id,employeeId:employeeId,nama:nama.toUpperCase(),originalAmount:nom,nom:nom,paid:0,remaining:nom,status:'BELUM',tgl:activeDate,ket:ket,source:source,createdBy:currentUse |
| 3141 | once(value) | await this.verifiedUpdate(u,'RESTOCK_RECEIVE_ATOMIC_TIMEOUT',async()=>String((await db.ref(DB_PATH+'/global/restockRequests/'+key+'/receivedAttemptId').once('value')).val()\|\|'')===attempt);claimed=false;var afterSnap=await db.ref(DB_PATH+'/global/inventory/'+p.id).once('value').catch(()=>null),after=afterSnap?sjNum(afterSnap.val()):sjStockQty(p)+qty;showToas |
| 3141 | once(value) | await this.verifiedUpdate(u,'RESTOCK_RECEIVE_ATOMIC_TIMEOUT',async()=>String((await db.ref(DB_PATH+'/global/restockRequests/'+key+'/receivedAttemptId').once('value')).val()\|\|'')===attempt);claimed=false;var afterSnap=await db.ref(DB_PATH+'/global/inventory/'+p.id).once('value').catch(()=>null),after=afterSnap?sjNum(afterSnap.val()):sjStockQty(p)+qty;showToas |
| 3143 | once(value) | sjSaveError('RESTOCK_RECEIVE_ATOMIC',e);var committed=false;try{committed=String((await db.ref(DB_PATH+'/global/restockRequests/'+key+'/receivedAttemptId').once('value')).val()\|\|'')===attempt}catch(_){ } |
| 3150 | once(value) | var snap=await sjTimeout(db.ref(DB_PATH+'/global/restockRequests').once('value'),8000,'RESTOCK_RECOVERY_SCAN_TIMEOUT').catch(()=>null);if(!snap)return 0;var rows=sjArr(snap.val()),count=0; |
| 3178 | once(value) | var snap=await sjTimeout(ref.once('value'),7000,'STOCK_FRESH_READ_TIMEOUT'),before=snap.val()==null?sjStockQty(p):sjNum(snap.val()),delta=mode==='RESTOCK'?qty:qty-before,expected=mode==='RESTOCK'?before+qty:qty,u={}; |
| 3182 | once(value) | await SJProductionHardening.verifiedUpdate(u,'STOCK_ATOMIC_TIMEOUT',async()=>(await db.ref(DB_PATH+'/global/stockLedger/'+lid).once('value')).exists()); |
| 3183 | once(value) | var aft=await ref.once('value').catch(()=>null),after=aft?sjNum(aft.val()):expected;clsModal('modal-sj-stock');showToast('Stok '+p.n+' sekarang '+after+'.','success') |
| 3209 | once(value) | var idxSnap=await sjTimeout(idxRef.once('value'),7000,'PERSON_INDEX_READ_TIMEOUT'),known=String(idxSnap.val()\|\|''); |
| 3211 | once(value) | var pSnap=await sjTimeout(db.ref(DB_PATH+'/global/'+node+'/'+known).once('value'),7000,'PERSON_INDEX_TARGET_TIMEOUT'); |
| 3215 | once(value) | var all=await sjTimeout(db.ref(DB_PATH+'/global/'+node).once('value'),8000,'PERSON_LOOKUP_TIMEOUT'),rows=sjArr(all.val()),existing=rows.find(x=>SJReliability.norm(x.name)===n),candidate=existing?String(existing.id\|\|existing._key):sjPushKey(DB_PATH+'/global/'+node); |
| 3217 | once(value) | var ref=db.ref(DB_PATH+'/global/'+node+'/'+winner),target=await sjTimeout(ref.once('value'),7000,'PERSON_TARGET_READ_TIMEOUT'); |
| 3238 | once(value) | await SJProductionHardening.verifiedUpdate(u,'RESERVATION_ATOMIC_RESTORE_TIMEOUT',async()=>String((await db.ref(DB_PATH+'/global/transactionReservations/'+txId+'/lastRecoveryOperationId').once('value')).val()\|\|'')===opId); |
| 3243 | once(value) | if(!txId)return;var ref=db.ref(DB_PATH+'/global/transactionReservations/'+txId),snap=await sjTimeout(ref.once('value'),7000,'TX_ROLLBACK_READ_TIMEOUT').catch(()=>null),j=snap?snap.val()\|\|{}:{}; |
| 3254 | once(value) | var snap=await sjTimeout(db.ref(DB_PATH+'/global/transactionReservations').once('value'),10000,'RESERVATION_SCAN_TIMEOUT').catch(()=>null); |
| 3269 | once(value) | try{txSnap=await sjTimeout(db.ref(DB_PATH+'/'+shift+'/tx/'+txId).once('value'),7000,'RESERVATION_TX_PROOF_TIMEOUT')} |
| 3296 | once(value) | try{lateTx=await sjTimeout(db.ref(DB_PATH+'/'+j.shift+'/tx/'+String(j.txId\|\|key)).once('value'),7000,'RESERVATION_LATE_TX_PROOF_TIMEOUT')} |
| 3388 | on(value) | ref.on('value',cb);dailyListener={ref:ref,cb:cb} |
| 3395 | once(value) | try{snap=await sjTimeout(ref.once('value'),7000,'TX_ROLLBACK_PROOF_TIMEOUT')} |
| 3407 | once(value) | try{txSnap=await sjTimeout(db.ref(DB_PATH+'/'+shift+'/tx/'+txId).once('value'),7000,'TX_ROLLBACK_TX_PROOF_TIMEOUT')} |
| 3453 | once(value) | await SJProductionHardening.verifiedUpdate(u,'CASH_MOVEMENT_VERIFIED_TIMEOUT',async()=>String((await db.ref(DB_PATH+'/'+activeDate+'/cashMovements/'+id+'/operationId').once('value')).val()\|\|'')===opId); |
| 3460 | once(value) | var snap=await sjTimeout(db.ref(DB_PATH).orderByKey().startAt(startDate+'-S1').endAt(endDate+'-S3').once('value'),10000,'DESTRUCTIVE_SHIFT_GUARD_TIMEOUT'),data=snap.val()\|\|{},out=[]; |
| 3471 | once(value) | resetDay=async()=>{if(isRecapMode)return alert('Pilih shift spesifik sebelum menghapus data shift.');if(!(await this.guardDestructiveRange(activeDateOnly,activeDateOnly,'Hapus Shift')))return;var fresh=await sjTimeout(db.ref(DB_PATH+'/'+activeDate).once('value'),7000,'RESET_SHIFT_GUARD_TIMEOUT').catch(()=>null);if(!fresh)return alert('Status shift belum dapa |
| 3515 | once(value) | var snap=await sjTimeout(q.once('value'),12000,'ACTIVE_SHIFT_SCAN_TIMEOUT'),data=snap.val()\|\|{},out=[]; |
| 3539 | once(value) | var snap=await sjTimeout(db.ref(DB_PATH+'/global/users').once('value'),9000,'USER_SAVE_GUARD_TIMEOUT'),users=snap.val()\|\|{},old=users[id]\|\|null,oldRole=String(old?.role\|\|''); |
| 3551 | once(value) | catch(e){var verify=await sjTimeout(ref.child('updateOperationId').once('value'),6000,'USER_SAVE_VERIFY_TIMEOUT').catch(()=>null);if(!(verify&&String(verify.val()\|\|'')===opId))throw e} |
| 3560 | once(value) | var usersSnap=await sjTimeout(db.ref(DB_PATH+'/global/users').once('value'),9000,'USER_DELETE_GUARD_TIMEOUT'),users=usersSnap.val()\|\|{},target=users[id];if(!target)return alert('Pengguna tidak ditemukan.'); |
| 3576 | once(value) | catch(e){var vs=await sjTimeout(ref.once('value'),6000,'EOM_VERIFY_TIMEOUT').catch(()=>null);if(!(vs&&this.normalizeLocked(vs.val()).includes(bln)))throw e} |
| 3770 | once(value) | var snap=await sjTimeout(db.ref(DB_PATH+'/'+activeDate).once('value'),8000,code\|\|'CASH_SHIFT_READ_TIMEOUT'); |
| 3812 | once(value) | await this.verifiedUpdate(u,'EXPENSE_CASH_GUARD_TIMEOUT',async()=>String((await db.ref(DB_PATH+'/'+activeDate+'/opex/'+id+'/operationId').once('value')).val()\|\|'')===opId); |
| 3831 | once(value) | await this.verifiedUpdate(u,'ADVANCE_CASH_GUARD_TIMEOUT',async()=>String((await db.ref(DB_PATH+'/global/kasbonKaryawan/'+id+'/operationId').once('value')).val()\|\|'')===id); |
| 3844 | once(value) | await this.verifiedUpdate(u,'CASH_MOVEMENT_GUARD_TIMEOUT',async()=>String((await db.ref(DB_PATH+'/'+activeDate+'/cashMovements/'+id+'/operationId').once('value')).val()\|\|'')===opId);lock=null; |
| 3855 | once(value) | var node=type==='debt'?'hutang':'kasbonKaryawan',snap=await sjTimeout(db.ref(DB_PATH+'/global/'+node+'/'+key).once('value'),8000,'PAYMENT_RECORD_READ_TIMEOUT'),h=snap.val();if(!h)throw new Error('Data hutang/kasbon tidak ditemukan.'); |
| 4251 | once(value) | async registerDevice(){if(!currentLoginId)return;var id=this.deviceId(),ref=db.ref(DB_PATH+'/global/deviceSessions/'+id);try{var snap=await ref.once('value'),old=snap.val()\|\|{};if(old.revoked){showToast('Perangkat ini telah dicabut aksesnya oleh Owner.','error');setTimeout(()=>doLogout(),400);return}await ref.update({id,deviceName:this.deviceLabel(),userId:c |
| 4251 | on(value) | async registerDevice(){if(!currentLoginId)return;var id=this.deviceId(),ref=db.ref(DB_PATH+'/global/deviceSessions/'+id);try{var snap=await ref.once('value'),old=snap.val()\|\|{};if(old.revoked){showToast('Perangkat ini telah dicabut aksesnya oleh Owner.','error');setTimeout(()=>doLogout(),400);return}await ref.update({id,deviceName:this.deviceLabel(),userId:c |
| 4256 | once(value) | wrapClosing(){var open=SJShift.openCloseModal.bind(SJShift);SJShift.openCloseModal=()=>{var r=open();setTimeout(()=>{var ws=document.getElementById('sjshift-close-worksheet');if(ws){var old=document.getElementById('sjp2-closing-health');if(old)old.remove();var box=document.createElement('div');box.id='sjp2-closing-health';box.innerHTML=this.healthHTML(this.c |
| 4256 | once(value) | wrapClosing(){var open=SJShift.openCloseModal.bind(SJShift);SJShift.openCloseModal=()=>{var r=open();setTimeout(()=>{var ws=document.getElementById('sjshift-close-worksheet');if(ws){var old=document.getElementById('sjp2-closing-health');if(old)old.remove();var box=document.createElement('div');box.id='sjp2-closing-health';box.innerHTML=this.healthHTML(this.c |
| 4256 | once(value) | wrapClosing(){var open=SJShift.openCloseModal.bind(SJShift);SJShift.openCloseModal=()=>{var r=open();setTimeout(()=>{var ws=document.getElementById('sjshift-close-worksheet');if(ws){var old=document.getElementById('sjp2-closing-health');if(old)old.remove();var box=document.createElement('div');box.id='sjp2-closing-health';box.innerHTML=this.healthHTML(this.c |
| 4263 | once(value) | wrapBackup(){var base=window.backupDatabase;window.backupDatabase=async()=>{if(currentUserRole!=='manajemen')return alert('Hanya Owner.');showLoading('Membuat backup database...');try{var snap=await sjTimeout(db.ref(DB_PATH).once('value'),15000,'BACKUP_TIMEOUT'),data=snap.val();if(!data)return alert('Database kosong.');var blob=new Blob([JSON.stringify(data, |
| 4290 | once(value) | async readAuthMode(){try{var s=await sjTimeout(db.ref(DB_PATH+'/global/security/authMode').once('value'),5000,'AUTH_MODE_TIMEOUT'),m=String(s.val()\|\|'LEGACY').toUpperCase();this.cacheAuthMode(m);cloudData.global=cloudData.global\|\|{};cloudData.global.security=Object.assign({},cloudData.global.security\|\|{},{authMode:m});return m}catch(e){return this.authMode() |
| 4294 | once(value) | async loadInitialData(){var paths=this.pathsForRole(),jobs=paths.map(async p=>{try{var sn=await sjTimeout(this.queryFor(p).once('value'),12000,'LOAD_'+p.toUpperCase()+'_TIMEOUT');cloudData.global[p]=sn.val()}catch(e){if(p==='settings'\|\|p==='menu'\|\|p==='kategori'\|\|p==='inventory')throw e;sjSaveError('LOAD_GLOBAL_'+p,e)}});await Promise.all(jobs);if(currentUse |
| 4294 | once(value) | async loadInitialData(){var paths=this.pathsForRole(),jobs=paths.map(async p=>{try{var sn=await sjTimeout(this.queryFor(p).once('value'),12000,'LOAD_'+p.toUpperCase()+'_TIMEOUT');cloudData.global[p]=sn.val()}catch(e){if(p==='settings'\|\|p==='menu'\|\|p==='kategori'\|\|p==='inventory')throw e;sjSaveError('LOAD_GLOBAL_'+p,e)}});await Promise.all(jobs);if(currentUse |
| 4294 | once(value) | async loadInitialData(){var paths=this.pathsForRole(),jobs=paths.map(async p=>{try{var sn=await sjTimeout(this.queryFor(p).once('value'),12000,'LOAD_'+p.toUpperCase()+'_TIMEOUT');cloudData.global[p]=sn.val()}catch(e){if(p==='settings'\|\|p==='menu'\|\|p==='kategori'\|\|p==='inventory')throw e;sjSaveError('LOAD_GLOBAL_'+p,e)}});await Promise.all(jobs);if(currentUse |
| 4297 | on(value) | startGlobalListeners(){this.stopGlobalListeners();this.pathsForRole().forEach(p=>{var ref=this.queryFor(p),cb=sn=>{cloudData.global[p]=sn.val();this.normalizeGlobal();if(p==='settings')applyStoreSettings();if(p==='security')this.cacheAuthMode(String(sn.val()?.authMode\|\|'LEGACY'));this.scheduleRender(p)};ref.on('value',cb,e=>sjSaveError('P3_LISTENER_'+p,e));t |
| 4297 | on(value) | startGlobalListeners(){this.stopGlobalListeners();this.pathsForRole().forEach(p=>{var ref=this.queryFor(p),cb=sn=>{cloudData.global[p]=sn.val();this.normalizeGlobal();if(p==='settings')applyStoreSettings();if(p==='security')this.cacheAuthMode(String(sn.val()?.authMode\|\|'LEGACY'));this.scheduleRender(p)};ref.on('value',cb,e=>sjSaveError('P3_LISTENER_'+p,e));t |
| 4297 | on(value) | startGlobalListeners(){this.stopGlobalListeners();this.pathsForRole().forEach(p=>{var ref=this.queryFor(p),cb=sn=>{cloudData.global[p]=sn.val();this.normalizeGlobal();if(p==='settings')applyStoreSettings();if(p==='security')this.cacheAuthMode(String(sn.val()?.authMode\|\|'LEGACY'));this.scheduleRender(p)};ref.on('value',cb,e=>sjSaveError('P3_LISTENER_'+p,e));t |
| 4298 | on(value) | preloginInit(){var ind=document.getElementById('sj-conn-ind');try{this._connectedRef=db.ref('.info/connected');this._connectedRef.on('value',sn=>{this.serverConnected=sn.val()===true;this.updateSyncUI();if(ind){ind.textContent=this.serverConnected?'● Firebase':'● Offline';ind.style.color=this.serverConnected?'#a7f3d0':'#fecaca'}})}catch(e){}try{this._setting |
| 4298 | on(value) | preloginInit(){var ind=document.getElementById('sj-conn-ind');try{this._connectedRef=db.ref('.info/connected');this._connectedRef.on('value',sn=>{this.serverConnected=sn.val()===true;this.updateSyncUI();if(ind){ind.textContent=this.serverConnected?'● Firebase':'● Offline';ind.style.color=this.serverConnected?'#a7f3d0':'#fecaca'}})}catch(e){}try{this._setting |
| 4298 | on(value) | preloginInit(){var ind=document.getElementById('sj-conn-ind');try{this._connectedRef=db.ref('.info/connected');this._connectedRef.on('value',sn=>{this.serverConnected=sn.val()===true;this.updateSyncUI();if(ind){ind.textContent=this.serverConnected?'● Firebase':'● Offline';ind.style.color=this.serverConnected?'#a7f3d0':'#fecaca'}})}catch(e){}try{this._setting |
| 4303 | once(value) | async ensureCurrentAuth(username,pin,user,allowCreate){var a=this.auth();if(!a)throw Object.assign(new Error('Firebase Auth SDK tidak tersedia.'),{code:'AUTH_SDK_MISSING'});var c=await this.authCredential(username,pin),cred=null;try{cred=await a.signInWithEmailAndPassword(c.email,c.password)}catch(e){var code=String(e.code\|\|'');if(allowCreate&&(code.includes |
| 4304 | once(value) | async secureAuthLogin(username,pin){var a=this.auth();if(!a)throw Object.assign(new Error('Firebase Auth tidak tersedia.'),{code:'AUTH_SDK_MISSING'});var c=await this.authCredential(username,pin),cred=await a.signInWithEmailAndPassword(c.email,c.password),uid=cred.user.uid,map=await sjTimeout(db.ref(DB_PATH+'/global/authUsers/'+uid).once('value'),7000,'AUTH_ |
| 4304 | once(value) | async secureAuthLogin(username,pin){var a=this.auth();if(!a)throw Object.assign(new Error('Firebase Auth tidak tersedia.'),{code:'AUTH_SDK_MISSING'});var c=await this.authCredential(username,pin),cred=await a.signInWithEmailAndPassword(c.email,c.password),uid=cred.user.uid,map=await sjTimeout(db.ref(DB_PATH+'/global/authUsers/'+uid).once('value'),7000,'AUTH_ |
| 4306 | once(value) | async login(){var btn=document.querySelector('.login-btn'),u=document.getElementById('login-username').value.trim().toLowerCase(),p=document.getElementById('login-password').value;if(!u\|\|!p)return alert('Silakan isi Username dan PIN.');sjSetBusy(btn,true,'MEMERIKSA...');try{var mode=await this.readAuthMode(),user=null;if(mode==='SECURE'){var sr=await this.se |
| 4309 | once(value) | async saveUserSecure(){if(currentUserRole!=='manajemen')return alert('Hanya Owner.');var id=(document.getElementById('usr-id')?.value\|\|'').trim().toLowerCase(),nama=(document.getElementById('usr-nama')?.value\|\|'').trim(),pin=(document.getElementById('usr-pass')?.value\|\|'').trim(),role=document.getElementById('usr-role')?.value\|\|'transaksi';if(!id\|\|!nama)retu |
| 4310 | once(value) | async deleteUserSecure(id){id=String(id\|\|'');var snap=await db.ref(DB_PATH+'/global/users/'+id).once('value'),u=snap.val()\|\|{},uid=u.authUid\|\|'';await SJAdminEomSafety.deleteUserSafe(id);if(uid){var exists=await db.ref(DB_PATH+'/global/users/'+id).once('value');if(!exists.exists())await db.ref(DB_PATH+'/global/authUsers/'+uid).update({active:false,revokedAt: |
| 4310 | once(value) | async deleteUserSecure(id){id=String(id\|\|'');var snap=await db.ref(DB_PATH+'/global/users/'+id).once('value'),u=snap.val()\|\|{},uid=u.authUid\|\|'';await SJAdminEomSafety.deleteUserSafe(id);if(uid){var exists=await db.ref(DB_PATH+'/global/users/'+id).once('value');if(!exists.exists())await db.ref(DB_PATH+'/global/authUsers/'+uid).update({active:false,revokedAt: |
| 4311 | once(value) | async changeOwnPin(){if(!currentLoginId)return;var old=prompt('Masukkan PIN saat ini:');if(!old)return;var u=(await db.ref(DB_PATH+'/global/users/'+currentLoginId).once('value')).val();if(!u\|\|!(await sjVerifyPin(currentLoginId,old,u)))return alert('PIN saat ini salah.');var np=prompt('Masukkan PIN baru (minimal 4 karakter):');if(!np\|\|np.length<4)return alert |
| 4312 | once(value) | async setAuthMode(mode){if(currentUserRole!=='manajemen')return;mode=String(mode\|\|'LEGACY').toUpperCase();if(!['LEGACY','HYBRID','SECURE'].includes(mode))return;if(mode==='SECURE'){var users=(await db.ref(DB_PATH+'/global/users').once('value')).val()\|\|{},missing=Object.keys(users).filter(k=>!users[k]?.authUid);var sec=(await db.ref(DB_PATH+'/global/security' |
| 4312 | once(value) | async setAuthMode(mode){if(currentUserRole!=='manajemen')return;mode=String(mode\|\|'LEGACY').toUpperCase();if(!['LEGACY','HYBRID','SECURE'].includes(mode))return;if(mode==='SECURE'){var users=(await db.ref(DB_PATH+'/global/users').once('value')).val()\|\|{},missing=Object.keys(users).filter(k=>!users[k]?.authUid);var sec=(await db.ref(DB_PATH+'/global/security' |
| 4323 | once(value) | async migrateImages(){if(currentUserRole!=='manajemen')return;if(!this.auth()?.currentUser)return alert('Aktifkan HYBRID dan login ulang agar Firebase Auth aktif sebelum migrasi gambar.');var cnt=this.base64Count();if(!cnt)return alert('Tidak ada gambar base64 yang perlu dimigrasikan.');if(!confirm('Migrasikan '+cnt+' gambar base64 ke Firebase Storage? Siste |
| 4323 | once(value) | async migrateImages(){if(currentUserRole!=='manajemen')return;if(!this.auth()?.currentUser)return alert('Aktifkan HYBRID dan login ulang agar Firebase Auth aktif sebelum migrasi gambar.');var cnt=this.base64Count();if(!cnt)return alert('Tidak ada gambar base64 yang perlu dimigrasikan.');if(!confirm('Migrasikan '+cnt+' gambar base64 ke Firebase Storage? Siste |
| 4326 | once(value) | patchRestoreSafety(){if(!window.SJReliability\|\|typeof SJReliability.executeRestore!=='function')return;var base=SJReliability.executeRestore.bind(SJReliability);SJReliability.executeRestore=async()=>{if(this.pendingWrites>0)return alert('Restore diblokir karena masih ada '+this.pendingWrites+' write menunggu konfirmasi Firebase.');if(!this.serverConnected)re |
| 4326 | once(value) | patchRestoreSafety(){if(!window.SJReliability\|\|typeof SJReliability.executeRestore!=='function')return;var base=SJReliability.executeRestore.bind(SJReliability);SJReliability.executeRestore=async()=>{if(this.pendingWrites>0)return alert('Restore diblokir karena masih ada '+this.pendingWrites+' write menunggu konfirmasi Firebase.');if(!this.serverConnected)re |
| 4326 | once(value) | patchRestoreSafety(){if(!window.SJReliability\|\|typeof SJReliability.executeRestore!=='function')return;var base=SJReliability.executeRestore.bind(SJReliability);SJReliability.executeRestore=async()=>{if(this.pendingWrites>0)return alert('Restore diblokir karena masih ada '+this.pendingWrites+' write menunggu konfirmasi Firebase.');if(!this.serverConnected)re |
| 4326 | once(value) | patchRestoreSafety(){if(!window.SJReliability\|\|typeof SJReliability.executeRestore!=='function')return;var base=SJReliability.executeRestore.bind(SJReliability);SJReliability.executeRestore=async()=>{if(this.pendingWrites>0)return alert('Restore diblokir karena masih ada '+this.pendingWrites+' write menunggu konfirmasi Firebase.');if(!this.serverConnected)re |
| 4334 | once(value) | patchDeviceBuild(){if(!window.SJOwnerProfessionalP2)return;SJOwnerProfessionalP2.registerDevice=async()=>{if(!currentLoginId)return;var id=SJOwnerProfessionalP2.deviceId(),ref=db.ref(DB_PATH+'/global/deviceSessions/'+id);try{var snap=await ref.once('value'),old=snap.val()\|\|{};if(old.revoked){showToast('Perangkat ini telah dicabut aksesnya oleh Owner.','error |
| 4334 | on(value) | patchDeviceBuild(){if(!window.SJOwnerProfessionalP2)return;SJOwnerProfessionalP2.registerDevice=async()=>{if(!currentLoginId)return;var id=SJOwnerProfessionalP2.deviceId(),ref=db.ref(DB_PATH+'/global/deviceSessions/'+id);try{var snap=await ref.once('value'),old=snap.val()\|\|{};if(old.revoked){showToast('Perangkat ini telah dicabut aksesnya oleh Owner.','error |
| 4664 | once(value) | sjTimeout(db.ref(DB_PATH+'/global/authUsers/'+uid).once('value'),7000,'AUTH_MAP_TIMEOUT'), |
| 4665 | once(value) | sjTimeout(db.ref(DB_PATH+'/global/users/'+username).once('value'),7000,'AUTH_USER_TIMEOUT') |
| 4687 | once(value) | var snap=await sjTimeout(db.ref(DB_PATH+'/global/users/'+u).once('value'),8000,'LOGIN_USER_TIMEOUT');user=snap.val(); |
| 4751 | once(value) | var pair=await Promise.all([db.ref(DB_PATH+'/global/menu').once('value'),db.ref(DB_PATH+'/global/settings').once('value')]),rawMenu=pair[0].val()\|\|[],settings=pair[1].val()\|\|{}; |
| 4751 | once(value) | var pair=await Promise.all([db.ref(DB_PATH+'/global/menu').once('value'),db.ref(DB_PATH+'/global/settings').once('value')]),rawMenu=pair[0].val()\|\|[],settings=pair[1].val()\|\|{}; |
| 5017 | once(value) | async aggregateExact(date){if(this.cache[date])return this.cache[date];let local=this.aggregateLocal(date);if(local){this.cache[date]=local;return local}if(currentUserRole!=='manajemen'\|\|!window.db)return null;try{let rows=await Promise.all(['-S1','-S2','-S3'].map(async sh=>{let k=date+sh;try{let snap=await sjTimeout(db.ref(DB_PATH+'/'+k).once('value'),2800, |
| 5707 | once(value) | const ref=db.ref(DB_PATH+'/global/transactionReservations/'+txId),verify=async(ms=3500)=>{let s=await sjTimeout(ref.once('value'),ms,'TX_JOURNAL_VERIFY_TIMEOUT').catch(()=>null);return !!(s&&s.exists()&&String(s.val()?.txId\|\|txId)===String(txId))}; |
| 6036 | once(value) | async function ingredientUsageState(id){var sn=await invRef().once('value'),v=obj(sn.val()),b=Object.assign({outlet:0,warehouse:0},obj(obj(v.balances).ingredients)[id]\|\|{}),recipeUsed=false,movementUsed=false,reservationUsed=false;Object.keys(obj(v.recipes)).forEach(function(pid){var rr=obj(v.recipes[pid]);Object.keys(obj(rr.variants)).forEach(function(vid){ |
| 6051 | once(value) | function renderMovements(r){var seq=++movementLoadSeq;r.innerHTML='<div class="sjinv-empty">Memuat 120 mutasi terbaru…</div>';invRef('movements').orderByChild('ts').limitToLast(120).once('value').then(function(sn){if(seq!==movementLoadSeq\|\|activeTab!=='movements')return;data.movements=sn.val()\|\|{};var mv=rows(data.movements).sort(function(a,b){return n(b.ts) |
| 6069 | once(value) | function patchRevalidate(){if(!window.SJReliability\|\|!BASE_REVALIDATE)return;SJReliability.revalidateCart=async function(){if(!cart.length)throw Object.assign(new Error('Keranjang kosong.'),{code:'CART_EMPTY'});var menu=await this.freshMenu(),changed=[];for(var ci of cart){if(String(ci.inventoryMode)==='RECIPE'){var p=menu.find(function(x){return String(x.id |
| 6071 | once(value) | async function reserveRecipeConsumption(cartSnapshot){var requested=Core.recipeConsumption(cartSnapshot,recipes());if(!Object.keys(requested).length)return null;var maxAttempts=2,lastErr=null;for(var attempt=0;attempt<maxAttempts;attempt++){var live=(await invRef('balances/ingredients').once('value')).val()\|\|{},plan=estimateConsumptionPlan(requested,live),id |
| 6076 | once(value) | async function normalizeCommittedRecipeSale(txId,shift,cartSnapshot){if(!txId\|\|!shift)return;var txRef=db.ref(DB_PATH+'/'+shift+'/tx/'+txId),txSn=await txRef.once('value'),tx=txSn.val()\|\|{};if(tx.inventorySalesNormalized===true)return;var source=(cartSnapshot&&cartSnapshot.length)?cartSnapshot:transactionRecipeCart(tx),norm=Core.salesNormalization(source);if |
| 6076 | once(value) | async function normalizeCommittedRecipeSale(txId,shift,cartSnapshot){if(!txId\|\|!shift)return;var txRef=db.ref(DB_PATH+'/'+shift+'/tx/'+txId),txSn=await txRef.once('value'),tx=txSn.val()\|\|{};if(tx.inventorySalesNormalized===true)return;var source=(cartSnapshot&&cartSnapshot.length)?cartSnapshot:transactionRecipeCart(tx),norm=Core.salesNormalization(source);if |
| 6077 | once(value) | async function commitRecipeReservation(res,txId,shift,cartSnapshot){if(!res\|\|!txId)return;var u={},t=Date.now(),snap=recipeSaleSnapshot(cartSnapshot);u['reservations/'+res.id+'/status']='COMMITTED';u['reservations/'+res.id+'/txId']=txId;u['reservations/'+res.id+'/committedAt']=sjNowIso();u['reservations/'+res.id+'/committedTs']=t;Object.keys(res.consumption\| |
| 6079 | once(value) | async function recoverVoidTransactions(){if(currentUserRole!=='manajemen'\|\|!activeDate)return;try{var sn=await db.ref(DB_PATH+'/'+activeDate+'/tx').once('value'),txs=sn.val()\|\|{};for(var txId of Object.keys(txs)){var t=txs[txId]\|\|{};if(Array.isArray(t.inventoryRecipeItems)&&t.inventoryRecipeItems.length&&t.inventorySalesNormalized!==true){try{await normalize |
| 6082 | once(value) | function patchSale(){window.processTransaction=async function(){var has=(cart\|\|[]).some(function(x){return x.inventoryMode==='RECIPE'});if(!has)return BASE_PROCESS.apply(this,arguments);var btn=document.querySelector('#modal-bayar .btn-pay[onclick="processTransaction()"]'),snapshot=null,shift='',total=0,before={},res=null;sjSetBusy(btn,true,'⏳ MEMPROSES...') |
| 6082 | once(value) | function patchSale(){window.processTransaction=async function(){var has=(cart\|\|[]).some(function(x){return x.inventoryMode==='RECIPE'});if(!has)return BASE_PROCESS.apply(this,arguments);var btn=document.querySelector('#modal-bayar .btn-pay[onclick="processTransaction()"]'),snapshot=null,shift='',total=0,before={},res=null;sjSetBusy(btn,true,'⏳ MEMPROSES...') |
| 6082 | once(value) | function patchSale(){window.processTransaction=async function(){var has=(cart\|\|[]).some(function(x){return x.inventoryMode==='RECIPE'});if(!has)return BASE_PROCESS.apply(this,arguments);var btn=document.querySelector('#modal-bayar .btn-pay[onclick="processTransaction()"]'),snapshot=null,shift='',total=0,before={},res=null;sjSetBusy(btn,true,'⏳ MEMPROSES...') |
| 6083 | once(value) | async function recoverVoidTransactions(){if(currentUserRole!=='manajemen'\|\|!activeDate)return;try{var sn=await db.ref(DB_PATH+'/'+activeDate+'/tx').once('value'),txs=sn.val()\|\|{};for(var txId of Object.keys(txs)){var t=txs[txId]\|\|{},cons=obj(t.inventoryRecipeConsumption);if(String(t.status)!=='VOIDED'\|\|!Object.keys(cons).length)continue;var state=t.inventory |
| 6090 | on(value) | function listenPath(path,apply){var r=invRef(path);refs.push(r);r.on('value',function(sn){apply(sn.val());inventoryDataChanged()},function(e){sjSaveError('INVENTORY_LISTENER_'+path,e)})} |
| 6578 | once(value) | var before=(await posRef(p.activeDate+'/tx').once('value')).val()\|\|{},beforeKeys=new Set(Object.keys(before)); |
| 6580 | once(value) | var after=(await posRef(p.activeDate+'/tx').once('value')).val()\|\|{}; |
| 6591 | once(value) | var txs=(await posRef(p.activeDate+'/tx').once('value')).val()\|\|{},found=Object.keys(txs).filter(function(k){var t=txs[k]\|\|{};return String(t.method\|\|'').toUpperCase()==='QRIS'&&Number(t.total)===Number(p.amount)&&String(t.cashierId\|\|'')===String(p.cashierId)&&Number(t.ts\|\|0)>=Number(p.finalizingAt\|\|p.createdAt\|\|0)&&Number(t.ts\|\|0)<=Number(p.finalizingAt\|\|p. |
| 6664 | once(value) | window.executeHapusGranular=async function(){var qs=Array.from(document.querySelectorAll('#list-qris-granular input[data-qris-provider]:checked')).map(function(x){return x.dataset.qrisProvider});if(!qs.length)return granularExecuteBase.apply(this,arguments);var legacy=!!document.querySelector('.modal-granular-item input:checked:not([data-qris-provider])')\|\|! |
| 6668 | on(value) | function start(){if(started\|\|!currentLoginId)return;started=true;ensureUi();patchCommercialPaymentSheet();patchNotificationCenter();patchGranularQrisDelete();var since=now()-LISTENER_LOOKBACK_MS;signalRef=qrisRef('signals').orderByChild('firstSeenAt').startAt(since);pendingRef=qrisRef('pending').orderByChild('createdAt').startAt(since);eventRef=qrisRef('even |
| 6668 | on(value) | function start(){if(started\|\|!currentLoginId)return;started=true;ensureUi();patchCommercialPaymentSheet();patchNotificationCenter();patchGranularQrisDelete();var since=now()-LISTENER_LOOKBACK_MS;signalRef=qrisRef('signals').orderByChild('firstSeenAt').startAt(since);pendingRef=qrisRef('pending').orderByChild('createdAt').startAt(since);eventRef=qrisRef('even |
| 6668 | on(value) | function start(){if(started\|\|!currentLoginId)return;started=true;ensureUi();patchCommercialPaymentSheet();patchNotificationCenter();patchGranularQrisDelete();var since=now()-LISTENER_LOOKBACK_MS;signalRef=qrisRef('signals').orderByChild('firstSeenAt').startAt(since);pendingRef=qrisRef('pending').orderByChild('createdAt').startAt(since);eventRef=qrisRef('even |
| 6668 | on(value) | function start(){if(started\|\|!currentLoginId)return;started=true;ensureUi();patchCommercialPaymentSheet();patchNotificationCenter();patchGranularQrisDelete();var since=now()-LISTENER_LOOKBACK_MS;signalRef=qrisRef('signals').orderByChild('firstSeenAt').startAt(since);pendingRef=qrisRef('pending').orderByChild('createdAt').startAt(since);eventRef=qrisRef('even |
| 6679 | once(value) | try{before=(await posRef(p.activeDate+'/tx').once('value')).val()\|\|{}}catch(_){before={}} |
| 6682 | once(value) | if(manual){try{var after=(await posRef(p.activeDate+'/tx').once('value')).val()\|\|{},keys=Object.keys(after).filter(function(k){return !Object.prototype.hasOwnProperty.call(before,k)&&String(after[k].method\|\|'').toUpperCase()==='QRIS'&&Number(after[k].total)===Number(p.amount)&&String(after[k].cashierId\|\|'')===String(p.cashierId)});if(keys.length){await qrisR |
| 7205 | on(value) | function listen(path,apply){var r=db.ref(INV_PATH+'/'+path);refs.push(r);r.on('value',function(sn){apply(sn.val()\|\|{});refreshInitialUi()},function(e){sjSaveError('COST_LISTENER_'+path,e)})} |
| 7209 | once(value) | var sn=await db.ref(INV_PATH+'/balances/ingredients/'+id).once('value'),b=sn.val()\|\|{}; |
| 7212 | once(value) | var pair=await Promise.all([db.ref(DB_PATH+'/global/inventory/'+id).once('value'),db.ref(INV_PATH+'/productWarehouse/'+id).once('value')]); |
| 7212 | once(value) | var pair=await Promise.all([db.ref(DB_PATH+'/global/inventory/'+id).once('value'),db.ref(INV_PATH+'/productWarehouse/'+id).once('value')]); |
| 7244 | once(value) | var ref=db.ref(INV_PATH+'/costs/'+bucket(type)+'/'+id),sn=await sjTimeout(ref.once('value'),8000,'COST_INITIAL_READ_TIMEOUT'),current=sn.val()\|\|{}; |
| 7328 | once(value) | var ps=await db.ref(INV+'/purchases/'+purchaseId).once('value'),p=ps.val()\|\|{};if(p.status!=='COMMITTED')return false; |
| 7329 | once(value) | var paths=[db.ref(INV+'/costs/'+bucket(p.itemType)+'/'+p.itemId).once('value'),db.ref(INV+'/movements/'+p.movementRef).once('value'),db.ref(DB_PATH+'/'+p.shift+'/opex/'+p.expenseRef).once('value')],sn=await Promise.all(paths),cost=sn[0].val()\|\|{},movement=sn[1].val()\|\|{},expense=sn[2].val()\|\|{}; |
| 7329 | once(value) | var paths=[db.ref(INV+'/costs/'+bucket(p.itemType)+'/'+p.itemId).once('value'),db.ref(INV+'/movements/'+p.movementRef).once('value'),db.ref(DB_PATH+'/'+p.shift+'/opex/'+p.expenseRef).once('value')],sn=await Promise.all(paths),cost=sn[0].val()\|\|{},movement=sn[1].val()\|\|{},expense=sn[2].val()\|\|{}; |
| 7329 | once(value) | var paths=[db.ref(INV+'/costs/'+bucket(p.itemType)+'/'+p.itemId).once('value'),db.ref(INV+'/movements/'+p.movementRef).once('value'),db.ref(DB_PATH+'/'+p.shift+'/opex/'+p.expenseRef).once('value')],sn=await Promise.all(paths),cost=sn[0].val()\|\|{},movement=sn[1].val()\|\|{},expense=sn[2].val()\|\|{}; |
| 7333 | once(value) | var ps=await db.ref(INV+'/purchases/'+purchaseId).once('value'),p=ps.val();if(!p)throw Object.assign(new Error('PURCHASE_NOT_FOUND'),{code:'PURCHASE_NOT_FOUND'});if(p.inventoryApplied)return p; |
| 7334 | once(value) | var capturedOutlet=0;if(p.itemType==='product'){var os=await db.ref(DB_PATH+'/global/inventory/'+p.itemId).once('value');capturedOutlet=Math.max(0,n(os.val()))} |
| 7349 | once(value) | if(!tx.committed){var after=(await db.ref(INV+'/purchases/'+purchaseId).once('value')).val()\|\|{};if(after.inventoryApplied)return after;throw Object.assign(new Error('PURCHASE_INVENTORY_NOT_COMMITTED'),{code:'PURCHASE_INVENTORY_NOT_COMMITTED'})} |
| 7353 | once(value) | var ps=await db.ref(INV+'/purchases/'+purchaseId).once('value'),p=ps.val();if(!p)throw new Error('PURCHASE_NOT_FOUND');if(p.expenseApplied)return p;if(!p.inventoryApplied)throw new Error('PURCHASE_INVENTORY_REQUIRED'); |
| 7356 | once(value) | try{await sjTimeout(db.ref(DB_PATH).update(u),15000,'PURCHASE_EXPENSE_TIMEOUT')}catch(e){var es=await db.ref(DB_PATH+'/'+p.shift+'/opex/'+p.expenseRef).once('value'),row=es.val()\|\|{};if(String(row.purchaseRef\|\|'')!==String(purchaseId))throw e} |
| 7357 | once(value) | return (await db.ref(INV+'/purchases/'+purchaseId).once('value')).val()\|\|p |
| 7359 | once(value) | async function finalizePurchase(purchaseId){var ref=db.ref(INV+'/purchases/'+purchaseId),sn=await ref.once('value'),p=sn.val();if(!p)throw new Error('PURCHASE_NOT_FOUND');if(p.status==='COMMITTED')return p;if(!p.inventoryApplied\|\|!p.expenseApplied)throw new Error('PURCHASE_NOT_COMPLETE');await ref.update({status:'COMMITTED',committedAt:sjNowIso(),committedTs |
| 7359 | once(value) | async function finalizePurchase(purchaseId){var ref=db.ref(INV+'/purchases/'+purchaseId),sn=await ref.once('value'),p=sn.val();if(!p)throw new Error('PURCHASE_NOT_FOUND');if(p.status==='COMMITTED')return p;if(!p.inventoryApplied\|\|!p.expenseApplied)throw new Error('PURCHASE_NOT_COMPLETE');await ref.update({status:'COMMITTED',committedAt:sjNowIso(),committedTs |
| 7361 | once(value) | if(currentUserRole!=='manajemen')throw Object.assign(new Error('COST_OWNER_ONLY'),{code:'COST_OWNER_ONLY'});var ref=db.ref(INV+'/purchases/'+purchaseId),sn=await ref.once('value'),p=sn.val();if(!p)throw new Error('PURCHASE_NOT_FOUND');if(p.status==='COMMITTED'){if(await verifyPurchaseCommit(purchaseId))return p;throw Object.assign(new Error('PURCHASE_COMMIT_ |
| 7371 | once(value) | function patchExpenseDelete(){if(window.__SJ_F03_EXPENSE_DELETE_PATCHED)return;window.__SJ_F03_EXPENSE_DELETE_PATCHED=true;var base=window.deleteExpense;if(typeof base!=='function')return;window.deleteExpense=async function(key){try{var sn=await db.ref(DB_PATH+'/'+activeDate+'/opex/'+key).once('value'),e=sn.val()\|\|{};if(e.systemLinked===true&&e.purchaseRef)r |
| 7436 | once(value) | var ref=db.ref(INV+'/purchases/'+purchaseId),sn=await ref.once('value'),p=sn.val();if(!p)throw coded('PURCHASE_NOT_FOUND','PURCHASE_NOT_FOUND'); |
| 7460 | once(value) | var sn;try{sn=await db.ref(INV).once('value')}catch(e){var why=String(e&&e.code\|\|e&&e.message\|\|e\|\|'UNKNOWN');throw coded('PURCHASE_INVENTORY_ROOT_READ_FAILED: '+why,'PURCHASE_INVENTORY_ROOT_READ_FAILED',e)} |
| 7508 | once(value) | var costs={ingredients:{},products:{}},recipes={};try{var sn=await sjTimeout(db.ref(INV+'/costs').once('value'),7000,'COST_SNAPSHOT_READ_TIMEOUT');costs=sn.val()\|\|costs}catch(e){sjSaveError('COST_SNAPSHOT_READ',e)} |
| 7520 | once(value) | var ref=db.ref(DB_PATH+'/'+res.shift+'/tx/'+txId+'/costing'),tr=await sjTimeout(ref.transaction(function(cur){if(cur)return;return res.costingQuote}),8000,'COST_ATTACH_TIMEOUT');if(!tr.committed){var sn=await ref.once('value');if(!sn.exists())throw new Error('COST_ATTACH_FAILED')} |
| 7523 | once(value) | async function recoverOneReservation(res){var sn=await db.ref(DB_PATH+'/'+res.shift+'/tx').once('value'),m=matchReservationTransaction(res,sn.val()\|\|{});if(m.status==='MATCH'){await attachReservationCosting(res,m.id);return true}await db.ref(INV+'/costingReservations/'+res.id).update({status:m.status==='AMBIGUOUS'?'AMBIGUOUS':'PREPARED',candidateIds:m.candid |
| 7525 | once(value) | async function recoverCostingReservations(){if(recovering\|\|!currentLoginId\|\|Date.now()-lastRecovery<30000)return;recovering=true;lastRecovery=Date.now();try{var sn=await db.ref(INV+'/costingReservations').orderByChild('createdTs').limitToLast(60).once('value'),rows=sn.val()\|\|{};for(var id of Object.keys(rows)){var r=rows[id]\|\|{};if(!['PREPARED','AMBIGUOUS']. |
| 7528 | once(value) | try{before=(await sjTimeout(db.ref(DB_PATH+'/'+activeDate+'/tx').once('value'),7000,'COST_TX_BEFORE_TIMEOUT')).val()\|\|{};reservation=await createCostingReservation(cartSnapshot,pricingQuote,before)}catch(e){sjSaveError('COST_PREPARE',e);alert('HPP transaksi belum dapat disiapkan. Periksa koneksi lalu coba lagi.');return false} |
| 7529 | once(value) | var result=await BASE_PROCESS.apply(this,arguments);try{var after=(await sjTimeout(db.ref(DB_PATH+'/'+reservation.shift+'/tx').once('value'),7000,'COST_TX_AFTER_TIMEOUT')).val()\|\|{},m=matchReservationTransaction(reservation,after);if(m.status==='MATCH')await attachReservationCosting(reservation,m.id);else if(m.status==='AMBIGUOUS')await db.ref(INV+'/costingR |
| 7678 | once(value) | var sn=await sjTimeout(db.ref(DB_PATH+'/'+shift+'/tx').once('value'),8000,'REFUND_COST_TX_READ_TIMEOUT'),rows=sn.val()\|\|{},needle=String(refund.originalTxId\|\|''); |
| 7687 | once(value) | var sn=await ref.once('value');return sn.val()\|\|costing |
| 7710 | once(value) | var sn=await txRef.child('refundCostingApplied/'+refundId).once('value');return sn.val()===true |
| 7724 | once(value) | var sn=await db.ref(DB_PATH+'/global/refunds').orderByChild('ts').limitToLast(80).once('value'),rows=sn.val()\|\|{}; |
| 8060 | once(value) | try{var from=dateISO(period.start),to=dateISO(period.end),snap=await db.ref(DB_PATH).orderByKey().startAt(from).endAt(to+'\uf8ff').once('value'),remote=snap.val()\|\|{};keys.forEach(function(k){if(remote[k])merged[k]=remote[k]})}catch(e){if(!Object.keys(merged).length)throw e} |
| 8075 | once(value) | var fetched=await Promise.all(refs.slice(0,50).map(function(ref){return db.ref(DB_PATH+'/global/inventoryV2/movements/'+ref).once('value').then(function(sn){var v=sn.val();return v?Object.assign({_key:ref},v):null}).catch(function(){return null})})); |
| 9143 | once(value) | async qrisExpiry(){try{const st=window.SJQrisSignalBeta&&SJQrisSignalBeta.status?SJQrisSignalBeta.status():null,id=st&&st.activePendingId;if(!id\|\|typeof db==='undefined')return Date.now()+20*60*1000;const snap=await db.ref('segeranjiwa_qris_beta_v1/pending/'+id).once('value'),row=snap&&snap.val? snap.val():null;return Number(row&&row.expiresAt)\|\|Date.now()+2 |

## Auth / local persistence signals

- localStorage references: 12
- sessionStorage references: 0
- firebase.auth() references: 5
- onAuthStateChanged references: 0

## QRIS signals

- root occurrences: 2
- SJQrisSignalBeta occurrences: 11
- pending token occurrences: 241
- matched token occurrences: 93
- ambiguous token occurrences: 48
- ensureWaitingPending occurrences: 7
- cancelWaiting occurrences: 9

## Function inventory by concern

### auth

- L1384 `sjHashPin()`
- L1385 `sjVerifyPin()`
- L1386 `sjVerifyCurrentOwnerPin()`
- L1387 `sjMigrateLegacyPin()`
- L1484 `doLogin()`
- L1500 `doLogout()`
- L1631 `renderUsers()`
- L1632 `saveUser()`
- L1633 `deleteUser()`
- L6139 `matchSignalForUser()`
- L6153 `filterPendingForUser()`
- L6249 `currentSessionId()`
- L6276 `isShiftSessionMismatch()`
- L6775 `authorize()`
- L6782 `resetSession()`

### transaction

- L1349 `sjNormPaymentMethod()`
- L1353 `sjPaymentBreakdown()`
- L1563 `quickAddCart()`
- L1564 `quickRemoveCart()`
- L1565 `updateCartUI()`
- L1566 `openCartModal()`
- L1567 `adjCartItem()`
- L1583 `lunasiKasbonKaryawan()`
- L1587 `confirmQrisPayment()`
- L1589 `processTransaction()`
- L1721 `addKasbonKaryawan()`
- L1722 `simpanKasbonKaryawan()`
- L1751 `populateKasbonList()`
- L1762 `filterKasbon()`
- L1853 `sjSavePayment()`
- L1866 `sjRenderTransactionHistory()`
- L5972 `transferSuggestion()`
- L5974 `virtualCartId()`
- L5975 `parseVirtualCartId()`
- L5977 `normalizeTransactionItems()`
- L6009 `recipeItemCartRows()`
- L6044 `renderTransfer()`
- L6045 `transferSelected()`
- L6061 `patchCart()`
- L6066 `openRecipeDesktopCart()`
- L6074 `transactionRecipeCart()`
- L6079 `recoverVoidTransactions()`
- L6083 `recoverVoidTransactions()`
- L6192 `qrisEventId()`
- L6197 `qrisEventActionable()`
- L6203 `qrisPermanentDeleteEligibility()`
- L6211 `cartFingerprint()`
- L6240 `qrisPricingFingerprint()`
- L6245 `qrisRef()`
- L6252 `qrisEventTypeSuffix()`
- L6253 `qrisEventFor()`
- L6254 `ensureQrisEvent()`
- L6260 `setQrisInboxState()`
- L6264 `qrisEventActionableRuntime()`
- L6270 `qrisEventRows()`
- L6271 `qrisEventHistoryRows()`
- L6272 `qrisEventActionRows()`
- L6381 `commercialQrisOpen()`
- L6383 `prepareCommercialQrisSheet()`
- L6394 `renderCommercialQrisState()`
- L6406 `patchCommercialPaymentSheet()`
- L6596 `qrisOperationalRows()`
- L6597 `qrisHistoryRows()`
- L6598 `qrisTypeLabel()`
- L6599 `qrisTypeClass()`
- L6600 `qrisEventCard()`
- L6607 `selectedQrisEventIds()`
- L6608 `bulkQrisInboxAction()`
- L6613 `openQrisDismiss()`
- L6617 `dismissQrisSignal()`
- L6621 `openQrisEventDetail()`
- L6655 `setGranularQrisFilter()`
- L6656 `populateGranularQrisList()`
- L6660 `patchGranularQrisDelete()`
- L6773 `getCartDiscount()`
- L6784 `renderCart()`
- L6785 `renderPayment()`
- L6963 `paymentModel()`
- L7004 `patchCartPricing()`
- L7011 `updatePaymentPricing()`
- L7017 `patchLegacyQrisBreakdown()`
- L7024 `patchPaymentPricing()`
- L7178 `aggregateTransactions()`
- L7506 `cartSignature()`
- L7512 `quoteCartCosting()`
- L7517 `transactionSignature()`
- L7518 `matchReservationTransaction()`
- L7548 `profitabilityFromTransactions()`
- L7554 `transactionsFromShifts()`
- L7676 `findOriginalTransaction()`
- L9215 `paymentOverlay()`
- L9216 `paymentModal()`
- L9217 `qrisPage()`
- L9218 `qrisOpen()`
- L9220 `qrisPendingExpiry()`
- L9246 `markQrisNotReady()`
- L9247 `markQrisReady()`
- L9248 `gateQrisReady()`
- L9262 `openQrisPaymentSafe()`
- L9281 `paymentMethodFromLegacy()`
- L9285 `reconcileLegacyPayment()`

### inventory

- L1358 `sjStockQty()`
- L1359 `sjTrackStock()`
- L1360 `sjMinStock()`
- L1389 `sjStatusStock()`
- L1555 `renderMenu()`
- L1561 `updateMenuBadges()`
- L1569 `renderStock()`
- L1622 `openAddMenu()`
- L1624 `saveMenu()`
- L1636 `waCSV()`
- L1854 `sjRenderStockModule()`
- L1855 `sjOpenRestock()`
- L1857 `sjSaveStock()`
- L5973 `purchaseSuggestion()`
- L6005 `menuProduct()`
- L6010 `allStockChoices()`
- L6030 `inventoryRows()`
- L6046 `renderPurchase()`
- L6047 `purchaseSelected()`
- L6067 `patchStockHelpers()`
- L6089 `inventoryDataChanged()`
- L7169 `movingWac()`
- L7175 `stockLineCost()`
- L7204 `itemWac()`
- L7206 `remainingStock()`
- L7278 `purchasePreview()`
- L7279 `purchaseInput()`
- L7284 `paintPurchasePreview()`
- L7288 `renderPurchaseCosting()`
- L7297 `installPurchaseUi()`
- L7320 `purchaseCommitDecision()`
- L7327 `verifyPurchaseCommit()`
- L7332 `applyInventoryPurchase()`
- L7352 `applyExpensePurchase()`
- L7359 `finalizePurchase()`
- L7360 `resumePurchase()`
- L7364 `createPurchase()`
- L7369 `savePurchaseFromUi()`
- L7370 `recoverPendingPurchases()`
- L7399 `recoverPurchaseRows()`
- L7408 `recoverPendingPurchases()`
- L7434 `ensurePurchaseIdentity()`
- L7443 `resumePurchaseWithIdentity()`
- L7458 `preflightInventoryRoot()`
- L7467 `resumePurchaseWithRootPreflight()`
- L7754 `renderPurchaseHistory()`
- L7768 `purchaseCorrectionPolicy()`
- L8070 `hydratePurchaseMovementEvidence()`
- L9366 `stockStats()`
- L9369 `setStockFilter()`
- L9370 `setStockSearch()`
- L9371 `renderStockHistory()`
- L9372 `renderStock()`
- L9378 `lowStockRows()`
- L9379 `renderRestock()`

### shift

- L1501 `changeDateAndShift()`
- L1570 `upKasir()`
- L1571 `saveKas()`
- L1572 `upAbsen()`
- L1583 `lunasiKasbonKaryawan()`
- L1721 `addKasbonKaryawan()`
- L1722 `simpanKasbonKaryawan()`
- L1751 `populateKasbonList()`
- L1762 `filterKasbon()`
- L1896 `sjPrintShiftReport()`
- L1989 `sjStopShiftDetailLive()`
- L1990 `sjCloseOwnerShiftDetail()`
- L1999 `sjClosingWorksheetHTML()`
- L2005 `sjClosingSnapshot()`
- L2012 `sjBindOwnerShiftDrilldown()`
- L2022 `sjOwnerShiftLiveSummaryHTML()`
- L2034 `sjRenderOwnerShiftDetailData()`
- L2035 `sjOpenOwnerShiftDetail()`
- L2171 `sjCashCloseEnhanceShiftModal()`
- L6276 `isShiftSessionMismatch()`
- L7554 `transactionsFromShifts()`
- L7555 `profitabilityForShifts()`
- L8046 `activeShiftKey()`
- L8053 `addShiftMeta()`
- L8055 `readShiftPeriod()`
- L8066 `collectShiftPeriod()`
- L8089 `shiftDetailForView()`

### report

- L1611 `calcLaporan()`
- L1613 `reportHarian()`
- L1614 `showReportFullscreen()`
- L1616 `reportBulanan()`
- L1634 `exportCSV()`
- L1859 `sjAggregateReport()`
- L1861 `sjReportHTML()`
- L1862 `sjLoadReport()`
- L1863 `sjReportLines()`
- L1864 `sjMakeReportCanvas()`
- L1865 `sjExportReportImage()`
- L1866 `sjRenderTransactionHistory()`
- L1896 `sjPrintShiftReport()`
- L6271 `qrisEventHistoryRows()`
- L6597 `qrisHistoryRows()`
- L7562 `installReportPatch()`
- L7754 `renderPurchaseHistory()`
- L9371 `renderStockHistory()`

### ui

- L1393 `sjGetPrinterSettings()`
- L1394 `sjSetPrinterSettings()`
- L1482 `applyStoreSettings()`
- L1483 `saveStoreSettings()`
- L1527 `renderApp()`
- L1539 `openOpr()`
- L1545 `openLap()`
- L1550 `openMst()`
- L1555 `renderMenu()`
- L1566 `openCartModal()`
- L1568 `clsModal()`
- L1569 `renderStock()`
- L1578 `renderHutang()`
- L1584 `openPayModal()`
- L1612 `getDashboardHTML()`
- L1617 `renderTopSeller()`
- L1619 `renderMasterData()`
- L1622 `openAddMenu()`
- L1626 `openEditMasterModal()`
- L1631 `renderUsers()`
- L1645 `showModalInput()`
- L1678 `closeModalInput()`
- L1683 `submitModalInput()`
- L1690 `showToast()`
- L1747 `openModalHapusGranular()`
- L1770 `closeModalHapusGranular()`
- L1854 `sjRenderStockModule()`
- L1855 `sjOpenRestock()`
- L1856 `sjOpenOpname()`
- L1866 `sjRenderTransactionHistory()`
- L1871 `sjRenderPrinterSettings()`
- L1872 `sjSavePrinterSettings()`
- L1874 `sjRenderActivity()`
- L1876 `sjRenderDiagnostics()`
- L2034 `sjRenderOwnerShiftDetailData()`
- L2035 `sjOpenOwnerShiftDetail()`
- L2171 `sjCashCloseEnhanceShiftModal()`
- L5979 `prioritizeDashboard()`
- L6027 `open()`
- L6028 `renderTabs()`
- L6029 `renderWorkspace()`
- L6032 `renderSummary()`
- L6034 `renderIngredients()`
- L6041 `renderRecipes()`
- L6041 `renderExisting()`
- L6044 `renderTransfer()`
- L6046 `renderPurchase()`
- L6048 `renderOpname()`
- L6050 `renderMovementRows()`
- L6051 `renderMovements()`
- L6060 `openVariantPicker()`
- L6066 `openRecipeDesktopCart()`
- L6084 `dashboardTile()`
- L6085 `renderDashboardTiles()`
- L6086 `patchDashboard()`
- L6275 `toastOnce()`
- L6381 `commercialQrisOpen()`
- L6394 `renderCommercialQrisState()`
- L6423 `renderAmbiguityResolver()`
- L6442 `renderWaiting()`
- L6596 `qrisOperationalRows()`
- L6613 `openQrisDismiss()`
- L6621 `openQrisEventDetail()`
- L6708 `toast()`
- L6714 `ensureCameraModal()`
- L6717 `openCameraScanner()`
- L6770 `normalizeSettings()`
- L6771 `settings()`
- L6784 `renderCart()`
- L6785 `renderPayment()`
- L6786 `renderFloating()`
- L6787 `openDiscount()`
- L6791 `openSettings()`
- L6792 `renderSettings()`
- L6793 `saveSettings()`
- L6874 `openSettings()`
- L7221 `ensureInitialModal()`
- L7230 `openInitialCost()`
- L7288 `renderPurchaseCosting()`
- L7558 `renderProfitabilitySection()`
- L7754 `renderPurchaseHistory()`
- L8090 `renderCategory()`
- L8093 `renderEvent()`
- L8097 `renderHome()`
- L8104 `open()`
- L8106 `openCategory()`
- L8107 `openEvent()`
- L8461 `applyNavigation()`
- L9216 `paymentModal()`
- L9218 `qrisOpen()`
- L9262 `openQrisPaymentSafe()`
- L9275 `installToastContainment()`
- L9344 `setOperationalParentNav()`
- L9359 `renderOperations()`
- L9371 `renderStockHistory()`
- L9372 `renderStock()`
- L9379 `renderRestock()`
