# SC-01 Auth / Session Map

- localStorage references: **12**
- sessionStorage references: **0**
- firebase.auth() references: **5**
- onAuthStateChanged references: **0**

## SC-01 interpretation

- Existing auth/session behavior remains untouched.
- Persistent session is deferred to SC-04 after current auth modes and role/device mapping are extracted.
- PIN/password plaintext must never be introduced into persistence.
- Active shift state remains authoritative in Firebase/shift data; local session may later hold only a restoration hint.

## Evidence locations

| Type | Line | Snippet |
|---|---:|---|
| localStorage | 1366 | function sjSaveError(action,err){try{var a=JSON.parse(localStorage.getItem('sj_errors')\|\|'[]');a.unshift({time:sjNowIso(),action:action,message:(err&&err.message)\|\|String(err),code:(err&&err.code)\|\|'',online:navigator.onLine,shift:activeDate\|\|''});a=a.slice(0,SJ_ERROR_LIMIT);localStorage.setItem('sj_errors',JSON.stringify(a))}catch(e){}console.error('[SJ]',a |
| localStorage | 1366 | function sjSaveError(action,err){try{var a=JSON.parse(localStorage.getItem('sj_errors')\|\|'[]');a.unshift({time:sjNowIso(),action:action,message:(err&&err.message)\|\|String(err),code:(err&&err.code)\|\|'',online:navigator.onLine,shift:activeDate\|\|''});a=a.slice(0,SJ_ERROR_LIMIT);localStorage.setItem('sj_errors',JSON.stringify(a))}catch(e){}console.error('[SJ]',a |
| localStorage | 1393 | function sjGetPrinterSettings(){try{return Object.assign({method:'AUTO',paper:'58',auto:false},JSON.parse(localStorage.getItem('sj_printer')\|\|'{}'))}catch(e){return{method:'AUTO',paper:'58',auto:false}}} |
| localStorage | 1394 | function sjSetPrinterSettings(v){localStorage.setItem('sj_printer',JSON.stringify(v))} |
| localStorage | 1876 | function sjRenderDiagnostics(){var errors=[];try{errors=JSON.parse(localStorage.getItem('sj_errors')\|\|'[]')}catch(e){}document.getElementById('sj-diag-version').textContent=SJ_BUILD;document.getElementById('sj-diag-online').textContent=navigator.onLine?'ONLINE':'OFFLINE';document.getElementById('sj-diag-online').style.color=navigator.onLine?'#10b981':'#ef444 |
| localStorage | 1878 | function sjClearErrors(){localStorage.removeItem('sj_errors');sjRenderDiagnostics()} |
| localStorage | 4204 | deviceId(){var k='sj_device_id_v2',v='';try{v=localStorage.getItem(k)\|\|'';if(!v){v='DEV-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,8).toUpperCase();localStorage.setItem(k,v)}}catch(e){v='DEV-TEMP-'+Math.random().toString(36).slice(2,8).toUpperCase()}return v}, |
| localStorage | 4204 | deviceId(){var k='sj_device_id_v2',v='';try{v=localStorage.getItem(k)\|\|'';if(!v){v='DEV-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,8).toUpperCase();localStorage.setItem(k,v)}}catch(e){v='DEV-TEMP-'+Math.random().toString(36).slice(2,8).toUpperCase()}return v}, |
| localStorage | 4249 | statusModel(){var g=cloudData.global\|\|{},d=cloudData[activeDate]\|\|{},state=SJShift.state(d),recovery=window.SJRecoveryHardening&&SJRecoveryHardening.recoveryReviewRows?SJRecoveryHardening.recoveryReviewRows().length:0,rest=sjArr(g.restockRequests),pending=rest.filter(x=>['WAITING','PROCESS','SENT','RECEIVING'].includes(String(x.status\|\|''))).length,stock=(g. |
| localStorage | 4254 | closingHealth(d,globalData){d=d\|\|{};globalData=globalData\|\|cloudData.global\|\|{};var blockers=[],warnings=[],state=SJShift.state(d),sid=String(d.sessionControl?.currentSessionId\|\|d.currentSessionId\|\|'');if(state!=='ACTIVE')blockers.push('Shift tidak berstatus AKTIF.');if(!sid)blockers.push('Session aktif tidak ditemukan.');if(SJ_TX_BUSY)blockers.push('Masih a |
| localStorage | 4288 | authMode(){var m=String(cloudData?.global?.security?.authMode\|\|this.authModeCache\|\|localStorage.getItem('sj_auth_mode_v1')\|\|'LEGACY').toUpperCase();return['LEGACY','HYBRID','SECURE'].includes(m)?m:'LEGACY'}, |
| localStorage | 4289 | cacheAuthMode(m){m=String(m\|\|'LEGACY').toUpperCase();this.authModeCache=m;try{localStorage.setItem('sj_auth_mode_v1',m)}catch(e){}}, |
| firebase.auth | 4284 | auth(){try{return firebase.auth()}catch(e){return null}}, |
| firebase.auth | 5997 | function uid(){try{return firebase.auth().currentUser&&firebase.auth().currentUser.uid\|\|currentLoginId\|\|''}catch(_){return currentLoginId\|\|''}} |
| firebase.auth | 5997 | function uid(){try{return firebase.auth().currentUser&&firebase.auth().currentUser.uid\|\|currentLoginId\|\|''}catch(_){return currentLoginId\|\|''}} |
| firebase.auth | 6248 | function currentUid(){try{return firebase.auth().currentUser&&firebase.auth().currentUser.uid\|\|''}catch(_){return ''}} |
| firebase.auth | 6248 | function currentUid(){try{return firebase.auth().currentUser&&firebase.auth().currentUser.uid\|\|''}catch(_){return ''}} |