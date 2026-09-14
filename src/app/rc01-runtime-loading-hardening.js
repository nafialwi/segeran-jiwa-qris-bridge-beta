const MARK='__SJ_RC01_R6B_LOADING_HARDENING';
const DASH_TTL_MS=15000;

function evalLegacy(runtime,expr,fallback){
  try{
    const Fn=runtime?.Function||Function;
    const value=Fn(`try{return (${expr})}catch(_){return undefined}`)();
    return value===undefined?fallback:value;
  }catch(_){return fallback}
}

function isTimeoutError(error){return /TIMEOUT/i.test(String(error?.code||error?.message||''))}

function defaultLegacy(runtime){
  const timeout=async(promise,ms,code)=>{
    const sjTimeout=evalLegacy(runtime,'typeof sjTimeout!=="undefined"?sjTimeout:null',null);
    if(typeof sjTimeout==='function')return sjTimeout(promise,ms,code);
    let id;const timer=new Promise((_,reject)=>{id=(runtime?.setTimeout||setTimeout)(()=>{const e=new Error(code);e.code=code;reject(e)},ms)});
    try{return await Promise.race([promise,timer])}finally{try{(runtime?.clearTimeout||clearTimeout)(id)}catch(_){}}
  };
  const db=()=>evalLegacy(runtime,'typeof db!=="undefined"?db:null',null);
  const dbPath=()=>evalLegacy(runtime,'typeof DB_PATH!=="undefined"?DB_PATH:""','');
  return {
    activeDateOnly:()=>String(evalLegacy(runtime,'typeof activeDateOnly!=="undefined"?activeDateOnly:""','')||''),
    activeDate:()=>String(evalLegacy(runtime,'typeof activeDate!=="undefined"?activeDate:""','')||''),
    activeShift:()=>String(evalLegacy(runtime,'typeof activeShift!=="undefined"?activeShift:""','')||''),
    role:()=>String(evalLegacy(runtime,'typeof currentUserRole!=="undefined"?currentUserRole:""','')||''),
    cloudData:()=>evalLegacy(runtime,'typeof cloudData!=="undefined"&&cloudData?cloudData:{global:{}}',{global:{}}),
    emptyDay:()=>{const fn=evalLegacy(runtime,'typeof emptyDay!=="undefined"?emptyDay:null',null);return typeof fn==='function'?fn():{}},
    aggregateReport:(shifts,mode,date)=>{const fn=evalLegacy(runtime,'typeof sjAggregateReport!=="undefined"?sjAggregateReport:null',null);if(typeof fn!=='function')return{sales:0,txCount:0,qty:0,expense:0,shiftRows:[]};return fn(shifts,mode||'daily',date)},
    saveError:(scope,error)=>{if(isTimeoutError(error))return;const fn=evalLegacy(runtime,'typeof sjSaveError!=="undefined"?sjSaveError:null',null);try{if(typeof fn==='function')fn(scope,error)}catch(_){}},
    async readDayRemote(date){
      const database=db(),path=dbPath();if(!database||!path)return{};
      const snap=await timeout(database.ref(path).orderByKey().startAt(date).endAt(date+'\uf8ff').once('value'),6000,'R6B_DASH_REFRESH_TIMEOUT');
      const raw=snap?.val?.()||{},out={};
      for(const [key,value] of Object.entries(raw))if(new RegExp('^'+date.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'-S[123]$').test(key))out[key]=value;
      return out;
    },
    async readShiftDayRemote(date){
      const database=db(),path=dbPath();if(!database||!path)return{};
      const rows=await Promise.all(['-S1','-S2','-S3'].map(async code=>{
        try{const snap=await timeout(database.ref(path+'/'+date+code).once('value'),6000,'R6B_SHIFT_REFRESH_TIMEOUT');return[code,snap?.val?.()||null]}catch(error){if(!isTimeoutError(error))this.saveError?.('SHIFT_RENDER_REFRESH',error);return[code,null]}
      }));
      const out={};for(const [code,value] of rows)if(value)out[code]=value;return out;
    }
  };
}

function mapPut(map,key,value){Map.prototype.set.call(map,key,value);return value}

function rowArray(value){
  if(Array.isArray(value))return value.filter(Boolean).map((row,index)=>Object.assign({_key:String(row?._key??index)},row));
  if(!value||typeof value!=='object')return[];
  return Object.entries(value).filter(([,row])=>row&&typeof row==='object').map(([key,row])=>Object.assign({_key:key},row));
}

export function createRc01RuntimeLoadingHardening(runtime=globalThis,{legacy=defaultLegacy(runtime),now=()=>Date.now()}={}){
  const state={
    dashboard:{installed:false,cache:new Map(),inFlight:new Map()},
    shift:{installed:false,inFlight:new Map(),originalRender:null},
    reports:{installed:false,inFlight:null,originalMenu:null},
    insight:{installed:false,inFlight:new Map(),original:null}
  };

  const activeView=id=>{try{return runtime?.document?.getElementById?.(id)?.classList?.contains?.('active')===true}catch(_){return false}};

  function dashboardShifts(date){
    const merged={};const cached=state.dashboard.cache.get(date);if(cached?.shifts)Object.assign(merged,cached.shifts);
    const cloud=legacy.cloudData?.()||{};
    for(const code of ['S1','S2','S3']){const key=`${date}-${code}`;if(cloud[key])merged[key]=cloud[key]}
    const active=legacy.activeDate?.();if(active&&String(active).startsWith(date+'-')&&cloud[active])merged[active]=cloud[active];
    if(!Object.keys(merged).length){const key=active&&String(active).startsWith(date+'-')?active:`${date}${legacy.activeShift?.()||'-S1'}`;merged[key]=cloud[key]||legacy.emptyDay?.()||{}}
    return merged;
  }

  function dashboardModel(date){return legacy.aggregateReport?.(dashboardShifts(date),'daily',date)||{sales:0,txCount:0,qty:0,expense:0,shiftRows:[]}}

  function maybeRerenderDashboard(date){
    if(String(legacy.activeDateOnly?.()||'')!==String(date)||!activeView('view5'))return;
    const target=runtime?.SJRefinementRoleDashboardV100;
    try{if(target&&typeof target.renderOwner==='function')target.renderOwner()}catch(error){legacy.saveError?.('R6B_DASH_RERENDER',error)}
  }

  function scheduleDashboardRefresh(date){
    const cached=state.dashboard.cache.get(date);if(cached&&now()-cached.loadedAt<=DASH_TTL_MS)return null;
    if(state.dashboard.inFlight.has(date))return state.dashboard.inFlight.get(date);
    const task=Promise.resolve().then(()=>legacy.readDayRemote?.(date)||{}).then(shifts=>{
      mapPut(state.dashboard.cache,date,{loadedAt:now(),shifts:shifts||{}});maybeRerenderDashboard(date);return shifts||{};
    }).catch(error=>{legacy.saveError?.('R6B_DASH_REFRESH',error);return{}}).finally(()=>state.dashboard.inFlight.delete(date));
    mapPut(state.dashboard.inFlight,date,task);return task;
  }

  function installInsight(){
    const insight=runtime?.SJCommercialInsightV5954;if(!insight||typeof insight.aggregateExact!=='function'||state.insight.installed)return false;
    state.insight.installed=true;state.insight.original=insight.aggregateExact.bind(insight);
    insight.aggregateExact=async function(date){
      date=String(date||'');if(!date)return null;
      if(this.cache?.[date])return this.cache[date];
      try{const local=typeof this.aggregateLocal==='function'?this.aggregateLocal(date):null;if(local){this.cache[date]=local;return local}}catch(_){}
      if(!state.insight.inFlight.has(date)){
        const requestedFor=String(legacy.activeDateOnly?.()||'');
        const task=Promise.resolve().then(()=>state.insight.original(date)).then(result=>{
          if(result&&this.cache)this.cache[date]=result;
          if(result&&requestedFor===String(legacy.activeDateOnly?.()||'')&&activeView('view5'))maybeRerenderDashboard(requestedFor);
          return result||null;
        }).catch(()=>null).finally(()=>state.insight.inFlight.delete(date));
        mapPut(state.insight.inFlight,date,task);
      }
      return null;
    };
    return true;
  }

  function installDashboard(){
    const sjx=runtime?.SJX;if(!sjx||typeof sjx.dayModel!=='function'||state.dashboard.installed)return false;
    state.dashboard.installed=true;
    sjx.dayModel=async function(){const date=String(legacy.activeDateOnly?.()||'');const model=dashboardModel(date);scheduleDashboardRefresh(date);return model};
    installInsight();return true;
  }

  function shiftLocalRows(date){
    const shift=runtime?.SJShift,rows={};
    if(shift?.dayCacheDate===date&&shift?.dayCache)Object.assign(rows,shift.dayCache);
    const cloud=legacy.cloudData?.()||{};
    for(const code of ['-S1','-S2','-S3']){const key=date+code;if(cloud[key])rows[code]=cloud[key]}
    const currentCode=legacy.activeShift?.()||'-S1';if(!rows[currentCode]){const active=legacy.activeDate?.();rows[currentCode]=(active&&cloud[active])||legacy.emptyDay?.()||{}}
    for(const code of ['-S1','-S2','-S3'])if(!rows[code])rows[code]=legacy.emptyDay?.()||{};
    return rows;
  }

  function shiftPageActive(){
    try{const opr=runtime?.document?.getElementById?.('opr1');return !opr||opr.style?.display!=='none'}catch(_){return true}
  }

  function scheduleShiftRefresh(date,token,root){
    let task=state.shift.inFlight.get(date);
    if(!task){
      task=Promise.resolve().then(()=>legacy.readShiftDayRemote?.(date)||{}).catch(error=>{legacy.saveError?.('R6B_SHIFT_REFRESH',error);return{}}).finally(()=>state.shift.inFlight.delete(date));
      mapPut(state.shift.inFlight,date,task);
    }
    task.then(rows=>{
      const shift=runtime?.SJShift;if(!shift||token!==shift.renderToken||String(legacy.activeDateOnly?.()||'')!==String(date)||!shiftPageActive())return;
      if(rows&&Object.keys(rows).length){shift.dayCache=Object.assign({},rows);shift.dayCacheDate=date}
      try{shift.renderWithDay(root,Object.assign(shiftLocalRows(date),rows||{}))}catch(error){legacy.saveError?.('R6B_SHIFT_RENDER',error)}
    });
    return task;
  }

  function installShift(){
    const shift=runtime?.SJShift;if(!shift||typeof shift.render!=='function'||typeof shift.renderWithDay!=='function'||state.shift.installed)return false;
    state.shift.installed=true;state.shift.originalRender=shift.render.bind(shift);
    shift.render=function(){
      const rootEl=runtime?.document?.getElementById?.('sj-shift-session-root');if(!rootEl)return false;
      const date=String(legacy.activeDateOnly?.()||''),token=++this.renderToken;
      try{this.renderWithDay(rootEl,shiftLocalRows(date))}catch(error){legacy.saveError?.('R6B_SHIFT_LOCAL_RENDER',error)}
      scheduleShiftRefresh(date,token,rootEl);return true;
    };
    return true;
  }

  function reportLocalPreview(){
    const foundation=runtime?.SJReportFoundationV010,Core=foundation?.Core,reportState=foundation?.state;
    if(!foundation||!Core||!reportState||String(reportState.period?.preset||'today')!=='today')return false;
    const rootEl=runtime?.document?.getElementById?.('lap-menu-view');if(!rootEl)return false;
    const date=String(legacy.activeDateOnly?.()||'');if(!date)return false;
    const cloud=legacy.cloudData?.()||{},shifts=[],transactions=[],expenses=[];
    for(const code of ['-S1','-S2','-S3']){
      const key=date+code,d=cloud[key];if(!d)continue;
      const shift=Object.assign({id:key,_key:key,shift:key},d);shifts.push(shift);
      for(const tx of rowArray(d.tx))transactions.push(Object.assign({_shift:key},tx));
      for(const exp of rowArray(d.opex))expenses.push(Object.assign({_shift:key,shift:key},exp));
    }
    if(!shifts.length)return false;
    const activeKey=String(legacy.activeDate?.()||''),selected=shifts.find(s=>s.id===activeKey)||shifts[0];
    try{
      if(String(legacy.role?.()||'').toLowerCase()==='transaksi'&&typeof Core.renderCashierShift==='function'&&typeof Core.shiftDetail==='function')rootEl.innerHTML=Core.renderCashierShift(Core.shiftDetail(selected));
      else if(typeof Core.summary==='function'&&typeof Core.renderOwnerSummary==='function'){
        const period=reportState.period||{preset:'today',label:'Hari Ini'};
        const summary=Core.summary({period,transactions,expenses,selectedShift:selected,shifts});
        summary.comparison=summary.comparison||{label:'vs Periode Sebelumnya'};
        summary.counts=Object.assign({sales:transactions.length,expenses:expenses.length,purchases:0,debts:0,shifts:shifts.length},summary.counts||{});
        rootEl.innerHTML=Core.renderOwnerSummary(summary);
      }else return false;
      try{rootEl.dataset.r6bLocalReport='true'}catch(_){}
      const container=runtime?.document?.getElementById?.('lap-container-view');if(container)container.style.display='none';
      rootEl.style.display='block';
      try{rootEl.querySelectorAll?.('button').forEach?.(button=>{if(button?.dataset?.action)button.disabled=true})}catch(_){}
      return true;
    }catch(error){legacy.saveError?.('R6B_REPORT_LOCAL',error);return false}
  }

  function installReports(){
    const foundation=runtime?.SJReportFoundationV010,pass=runtime?.SJRefinementPass3V5960;
    if(!foundation||typeof foundation.open!=='function'||!pass||typeof pass.renderReportsMenu!=='function'||state.reports.installed)return false;
    state.reports.installed=true;state.reports.originalMenu=pass.renderReportsMenu.bind(pass);const baseOpen=foundation.open.bind(foundation);
    pass.renderReportsMenu=function(){
      if(state.reports.inFlight){reportLocalPreview();return state.reports.inFlight}
      const out=baseOpen();reportLocalPreview();
      const task=Promise.resolve(out).finally(()=>{if(state.reports.inFlight===task)state.reports.inFlight=null});
      state.reports.inFlight=task;return task;
    };
    return true;
  }

  function install(){
    installDashboard();installShift();
    if(!installReports()){
      const timer=runtime?.setTimeout||setTimeout;let tries=0;
      const retry=()=>{if(installReports()||++tries>=8)return;timer(retry,50)};timer(retry,0);
    }
    return true;
  }

  return {state,install,installDashboard,installShift,installReports,installInsight,reportLocalPreview,dashboardModel};
}

export function installRc01RuntimeLoadingHardening(runtime=globalThis,options={}){
  if(runtime?.[MARK]?.api)return runtime[MARK].api;
  const api=createRc01RuntimeLoadingHardening(runtime,options);
  try{runtime[MARK]={version:'R6B',api}}catch(_){}
  api.install();return api;
}
