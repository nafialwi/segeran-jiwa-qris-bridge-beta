import test from 'node:test';
import assert from 'node:assert/strict';

const MODULE='../src/app/rc01-runtime-loading-hardening.js';

test('R6B RED: runtime loading hardening module exposes an installable factory',async()=>{
  const mod=await import(MODULE);
  assert.equal(typeof mod.createRc01RuntimeLoadingHardening,'function');
  assert.equal(typeof mod.installRc01RuntimeLoadingHardening,'function');
});

async function flush(times=8){for(let i=0;i<times;i++)await Promise.resolve()}

function deferred(){let resolve,reject;const promise=new Promise((res,rej)=>{resolve=res;reject=rej});return{promise,resolve,reject}}

function aggregate(shifts){
  const rows=Object.values(shifts||{});
  return {sales:rows.reduce((s,d)=>s+Number(d?.omset||0),0),shiftRows:Object.keys(shifts||{}).sort().map(key=>({key}))};
}

test('R6B RED: dashboard paints local data immediately and coalesces remote refresh',async()=>{
  const remote=deferred();let reads=0,rerenders=0;
  const view5={classList:{contains:name=>name==='active'}};
  const runtime={
    SJX:{dayModel:async()=>({sales:999})},
    SJRefinementRoleDashboardV100:{renderOwner(){rerenders++;return true}},
    document:{getElementById:id=>id==='view5'?view5:null},
    setTimeout:fn=>{fn();return 1},clearTimeout(){},console
  };
  let date='2026-09-05';
  const cloud={'2026-09-05-S2':{omset:500},global:{}};
  const bridge={
    activeDateOnly:()=>date,activeDate:()=>`${date}-S2`,cloudData:()=>cloud,
    aggregateReport:shifts=>aggregate(shifts),emptyDay:()=>({}),
    readDayRemote:async d=>{reads++;assert.equal(d,'2026-09-05');return remote.promise},
    saveError(){}
  };
  const {createRc01RuntimeLoadingHardening}=await import(MODULE);
  const api=createRc01RuntimeLoadingHardening(runtime,{legacy:bridge,now:()=>1000});
  assert.equal(api.installDashboard(),true);
  const a=await runtime.SJX.dayModel();
  const b=await runtime.SJX.dayModel();
  assert.equal(a.sales,500,'first paint must use current cloudData instead of waiting for RTDB');
  assert.equal(b.sales,500);
  assert.equal(reads,1,'rapid dashboard calls must share one remote refresh');
  remote.resolve({'2026-09-05-S1':{omset:300},'2026-09-05-S2':{omset:450}});
  await flush();
  assert.equal(rerenders,1,'fresh remote completion should refresh the still-active dashboard once');
  const c=await runtime.SJX.dayModel();
  assert.equal(c.sales,800,'latest cloudData must override remote cache for the active shift');
});

test('R6B RED: dashboard stale remote response cannot rerender a different route/date',async()=>{
  const remote=deferred();let rerenders=0;let active=true;let date='2026-09-05';
  const runtime={
    SJX:{dayModel:async()=>({sales:0})},
    SJRefinementRoleDashboardV100:{renderOwner(){rerenders++}},
    document:{getElementById:id=>id==='view5'?{classList:{contains:()=>active}}:null},
    setTimeout:fn=>{fn();return 1},clearTimeout(){},console
  };
  const bridge={activeDateOnly:()=>date,activeDate:()=>`${date}-S2`,cloudData:()=>({[`${date}-S2`]:{omset:1},global:{}}),aggregateReport:aggregate,emptyDay:()=>({}),readDayRemote:()=>remote.promise,saveError(){}};
  const {createRc01RuntimeLoadingHardening}=await import(MODULE);
  const api=createRc01RuntimeLoadingHardening(runtime,{legacy:bridge});api.installDashboard();
  await runtime.SJX.dayModel();
  date='2026-09-06';active=false;
  remote.resolve({'2026-09-05-S1':{omset:10}});await flush();
  assert.equal(rerenders,0,'old dashboard refresh must not repaint after navigation/date change');
});

test('R6B RED: Shift render uses local/cache first paint while preserving authoritative loadDay and single-flight refresh',async()=>{
  const remote=deferred();let loadCalls=0,remoteReads=0;const paints=[];
  const originalLoad=async date=>{loadCalls++;return {'-S1':{status:'AUTHORITY'}}};
  const shift={
    dayCache:{'-S1':{status:'CLOSED'}},dayCacheDate:'2026-09-05',renderToken:0,
    loadDay:originalLoad,currentData:()=>({status:'ACTIVE'}),render(){},
    renderWithDay(root,rows){paints.push({root,rows})}
  };
  const page={style:{display:'block'}};const rootEl={innerHTML:''};
  const runtime={SJShift:shift,document:{getElementById:id=>id==='sj-shift-session-root'?rootEl:id==='opr1'?page:null},console};
  const bridge={activeDateOnly:()=> '2026-09-05',activeDate:()=> '2026-09-05-S2',activeShift:()=>'-S2',cloudData:()=>({'2026-09-05-S2':{status:'ACTIVE'},global:{}}),emptyDay:()=>({}),readShiftDayRemote:async date=>{remoteReads++;assert.equal(date,'2026-09-05');return remote.promise},saveError(){}};
  const {createRc01RuntimeLoadingHardening}=await import(MODULE);const api=createRc01RuntimeLoadingHardening(runtime,{legacy:bridge});
  assert.equal(api.installShift(),true);assert.equal(shift.loadDay,originalLoad,'R6B must not replace shift authority loadDay');
  shift.render();shift.render();await flush();
  assert.equal(loadCalls,0,'render hardening must not call or replace authoritative loadDay');
  assert.equal(remoteReads,1,'rapid Shift renders must share one read-only background refresh');
  assert.equal(paints.length,2,'each navigation should get an immediate local/cache paint');
  assert.equal(paints.at(-1).rows['-S2'].status,'ACTIVE');
  remote.resolve({'-S1':{status:'CLOSED'},'-S2':{status:'ACTIVE'},'-S3':{status:'NOT_STARTED'}});await flush();
  assert.equal(paints.length,3,'only the latest render generation may consume the remote result');
});

test('R6B RED: Reports navigation is single-flight and replaces the loading shell with safe local today summary',async()=>{
  const remote=deferred();let opens=0;let summaryInput=null;
  const reportRoot={innerHTML:'',style:{display:'block'},addEventListener(){}};
  const container={style:{display:'block'}};
  const view3={classList:{contains:()=>true}};
  const foundation={
    state:{period:{preset:'today',label:'Hari Ini'},model:null},
    Core:{
      summary(input){summaryInput=input;return {period:{preset:'today',label:'Hari Ini'},netSales:123,kpi4:{kind:'expense',label:'Pengeluaran',value:0}}},
      renderOwnerSummary(){return '<div data-r6b-local-report="true">LOCAL REPORT</div>'},
      shiftDetail(s){return {id:s.id}},renderCashierShift(){return '<div>CASHIER</div>'}
    },
    open(){opens++;reportRoot.innerHTML='<div data-state="loading">loading</div>';return remote.promise}
  };
  const pass={renderReportsMenu(){throw new Error('legacy report menu should be replaced')}};
  const runtime={SJReportFoundationV010:foundation,SJRefinementPass3V5960:pass,document:{getElementById:id=>id==='lap-menu-view'?reportRoot:id==='lap-container-view'?container:id==='view3'?view3:null},console};
  const bridge={activeDateOnly:()=> '2026-09-05',activeDate:()=> '2026-09-05-S2',activeShift:()=>'-S2',role:()=> 'manajemen',cloudData:()=>({'2026-09-05-S2':{tx:{a:{id:'T1',total:1000}},opex:{e:{amount:100}},status:'ACTIVE'},global:{}})};
  const {createRc01RuntimeLoadingHardening}=await import(MODULE);const api=createRc01RuntimeLoadingHardening(runtime,{legacy:bridge});
  assert.equal(api.installReports(),true);
  const a=pass.renderReportsMenu();const b=pass.renderReportsMenu();
  assert.equal(a,b,'report calls while loading should share one promise');
  assert.equal(opens,1,'rapid report navigation must not start overlapping reads');
  assert.match(reportRoot.innerHTML,/data-r6b-local-report="true"/,'local summary must replace the loading shell immediately');
  assert.equal(summaryInput.transactions.length,1);assert.equal(summaryInput.expenses.length,1);
  remote.resolve('summary');await flush();
});

test('R6B RED: previous-day insight lookup is non-blocking and single-flight for Dashboard first paint',async()=>{
  const remote=deferred();let reads=0,rerenders=0;
  const insight={cache:{},aggregateLocal(){return null},async aggregateExact(){reads++;return remote.promise}};
  const runtime={
    SJX:{dayModel:async()=>({sales:1})},SJCommercialInsightV5954:insight,
    SJRefinementRoleDashboardV100:{renderOwner(){rerenders++}},
    document:{getElementById:id=>id==='view5'?{classList:{contains:()=>true}}:null},console
  };
  const bridge={activeDateOnly:()=> '2026-09-05',activeDate:()=> '2026-09-05-S2',cloudData:()=>({'2026-09-05-S2':{omset:1},global:{}}),aggregateReport:aggregate,emptyDay:()=>({}),readDayRemote:async()=>({}),saveError(){}};
  const {createRc01RuntimeLoadingHardening}=await import(MODULE);const api=createRc01RuntimeLoadingHardening(runtime,{legacy:bridge});api.installDashboard();
  const a=await insight.aggregateExact('2026-09-04');const b=await insight.aggregateExact('2026-09-04');
  assert.equal(a,null);assert.equal(b,null,'missing previous-day data must not block dashboard first paint');
  await flush();assert.equal(reads,1,'previous-day background lookup must be single-flight');
  remote.resolve({sales:900});await flush();
  assert.equal(insight.cache['2026-09-04'].sales,900);assert.equal(rerenders,1,'completed background insight may refresh only the still-active dashboard');
});
