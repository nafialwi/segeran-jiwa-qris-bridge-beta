import test from 'node:test';
import assert from 'node:assert/strict';
import { installReportRefinement } from '../src/ui/report-refinement.js';

const deferred=()=>{let resolve,reject;const promise=new Promise((res,rej)=>{resolve=res;reject=rej});return{promise,resolve,reject}};
const flush=()=>new Promise(resolve=>setImmediate(resolve));

function makeRoot(){
  return {innerHTML:'',style:{display:''},dataset:{},handlers:{},querySelector(){return null},querySelectorAll(){return[]},addEventListener(type,fn){this.handlers[type]=fn}};
}
function modelFor(period,total=12500){
  const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(period.start));
  const key=`${date}-S1`,shift={id:key,_key:key,shift:key,tx:{a:{id:'a',total}}};
  return{period:{...period},summary:{period:{...period},netSales:total},transactions:[{id:'a',total,_shift:key}],expenses:[],purchases:[],movements:[],allMovements:[],debts:[],debtPayments:[],shifts:[shift],selectedShift:shift};
}
function fixture({singleInFlight=false}={}){
  const root=makeRoot(),container={style:{display:''}},pending=[];
  const initial={preset:'today',label:'Hari Ini',start:new Date('2026-09-08T00:00:00+07:00').getTime(),end:new Date('2026-09-08T23:59:59.999+07:00').getTime()};
  const state={period:initial,model:null};
  const Core={
    summary({period,transactions=[],expenses=[],shifts=[]}){return{period,netSales:transactions.reduce((s,x)=>s+Number(x.total||0),0),counts:{sales:transactions.length,expenses:expenses.length,shifts:shifts.length}}},
    renderState(kind,message){return `<div data-legacy-state="${kind}">${message}</div>`},
    renderOwnerSummary(summary){return `<main data-legacy-report><b>${summary?.netSales??'legacy'}</b></main>`},
    renderCashierShift(){return'<main>cashier</main>'},shiftDetail(v){return v}
  };
  const report={Core,state,
    selectPeriod({preset='custom',explicit}={}){state.period={preset,label:explicit?.from||'Custom',start:new Date(`${explicit.from}T00:00:00+07:00`).getTime(),end:new Date(`${explicit.to}T23:59:59.999+07:00`).getTime()};return state.period},
    open(){
      const requestPeriod={...state.period},d=deferred();pending.push({period:requestPeriod,d});
      root.innerHTML=Core.renderState('loading','Menyusun ringkasan dan bukti transaksi…');
      return d.promise.then(result=>{
        if(result?.error){root.innerHTML=Core.renderState('error',result.error);return'error'}
        const model=result?.model||modelFor(requestPeriod,result?.total||12500);state.model=model;root.innerHTML=Core.renderOwnerSummary(model.summary);return'summary';
      });
    }
  };
  let inFlight=null;
  const pass={renderReportsMenu(){
    if(!singleInFlight)return report.open();
    if(inFlight)return inFlight;
    const task=Promise.resolve(report.open()).finally(()=>{if(inFlight===task)inFlight=null});inFlight=task;return task;
  }};
  const runtime={navigator:{onLine:true},document:{getElementById(id){if(id==='lap-menu-view')return root;if(id==='lap-container-view')return container;if(id==='date-sel')return{value:'2026-09-08'};if(id==='shift-sel')return{value:'S1'};return null}},SJReportFoundationV010:report,SJRefinementPass3V5960:pass};
  const api=installReportRefinement(runtime);
  return{runtime,root,container,pending,state,pass,report,controller:api.controller};
}

test('R7 historical report paints full unknown shell immediately instead of legacy blank loading',async()=>{
  const f=fixture();
  const promise=f.controller.applyScope('day',{anchorDate:'2026-09-07'});
  assert.ok(f.runtime.__SJ_R7_READ_COORDINATOR,'Report refinement must ensure shared R7 coordinator');
  assert.equal(f.pending.length,1);
  assert.match(f.root.innerHTML,/Laporan Penjualan/);
  assert.match(f.root.innerHTML,/2026-09-07|07/);
  assert.match(f.root.innerHTML,/Mengambil data|sedang memperbarui/);
  assert.match(f.root.innerHTML,/—/);
  f.pending[0].d.resolve({model:modelFor(f.pending[0].period,17000)});await promise;
  assert.match(f.root.innerHTML,/17\.000/);
});

test('R7 cached historical report stays visible during revalidation and survives error',async()=>{
  const f=fixture();
  let p=f.controller.applyScope('day',{anchorDate:'2026-09-07'});f.pending[0].d.resolve({model:modelFor(f.pending[0].period,19000)});await p;
  p=f.controller.openRemote();
  assert.equal(f.pending.length,2);
  assert.match(f.root.innerHTML,/19\.000/);
  assert.match(f.root.innerHTML,/Data terakhir ditampilkan|sedang memperbarui/);
  f.pending[1].d.resolve({error:'FIREBASE_SLOW'});await p;await flush();
  assert.match(f.root.innerHTML,/19\.000/);
  assert.match(f.root.innerHTML,/Belum dapat memperbarui|FIREBASE_SLOW/);
  assert.doesNotMatch(f.root.innerHTML,/data-legacy-state="error"/);
});

test('R7 report rapid A→B→C remains latest-wins even when frozen R6B deduplicates one in-flight menu load',async()=>{
  const f=fixture({singleInFlight:true});
  const a=f.controller.applyScope('day',{anchorDate:'2026-09-05'});
  const b=f.controller.applyScope('day',{anchorDate:'2026-09-06'});
  const c=f.controller.applyScope('day',{anchorDate:'2026-09-07'});
  assert.equal(f.pending.length,1,'frozen R6B may still have only the first physical read in flight');
  assert.match(f.root.innerHTML,/2026-09-07|07/,'latest target shell must already be visible');
  f.pending[0].d.resolve({model:modelFor(f.pending[0].period,5000)});
  await flush();await flush();
  assert.equal(f.pending.length,2,'latest C must queue one fresh physical read after old in-flight work settles');
  assert.doesNotMatch(f.root.innerHTML,/5\.000/,'stale A result must not repaint the current C target');
  f.pending[1].d.resolve({model:modelFor(f.pending[1].period,7000)});
  await Promise.all([a,b,c]);
  assert.equal(f.controller.state.anchorDate,'2026-09-07');
  assert.match(f.root.innerHTML,/7\.000/);
});
