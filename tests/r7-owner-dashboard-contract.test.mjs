import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { installOwnerDashboardHybrid } from '../src/ui/owner-dashboard-hybrid.js';
import { createR7ReadCoordinator } from '../src/app/r7-read-coordinator.js';

const deferred=()=>{let resolve,reject;const promise=new Promise((res,rej)=>{resolve=res;reject=rej});return{promise,resolve,reject}};
const flush=()=>new Promise(resolve=>setImmediate(resolve));

function runtimeFixture(financePromise){
  let date='2026-09-07';
  const dayByDate={
    '2026-09-07':{sales:10000,txCount:2,qty:3,expense:4000,shiftRows:[{key:'2026-09-07-S1',cashier:'A',sales:10000,expense:4000,expected:16000,diff:null}]},
    '2026-09-06':{sales:8000,txCount:1,qty:9,expense:1000,shiftRows:[{key:'2026-09-06-S2',cashier:'B',sales:8000,expense:1000,expected:12000,diff:0}]}
  };
  const view5={classList:{contains(name){return name==='active'}}};
  const dateEl={get value(){return date},set value(v){date=v}};
  const shiftEl={value:'S1',selectedOptions:[{textContent:'Shift Pagi'}]};
  const runtime={
    navigator:{onLine:true},
    document:{getElementById(id){if(id==='view5')return view5;if(id==='date-sel')return dateEl;if(id==='shift-sel')return shiftEl;return null}},
    setTimeout(fn){return setTimeout(fn,0)},
    __SJ_R7_READ_COORDINATOR:createR7ReadCoordinator(),
    SJX:{async dayModel(){return dayByDate[date]}},
    __SJ_P4_FINANCE_RUNTIME:{finance:{loadMonth(){return financePromise}}},
    SJRefinementRoleDashboardV100:{
      async ownerModel(){const d=await runtime.SJX.dayModel();return {name:'Owner',online:true,sales:d.sales,txCount:d.txCount,cash:15000,debt:0,debtCustomers:0,pending:0,low:0,out:0}},
      ownerHTML(){return '<main>legacy</main>'},
      render(){return true},
      async renderOwner(){return true}
    }
  };
  return {runtime,dateEl,shiftEl};
}

test('R7 owner model returns before finance load resolves and keeps complete day/shift semantics',async()=>{
  const finance=deferred(),{runtime}=runtimeFixture(finance.promise);
  installOwnerDashboardHybrid(runtime);
  const model=await Promise.race([
    runtime.SJRefinementRoleDashboardV100.ownerModel(),
    new Promise((_,reject)=>setTimeout(()=>reject(new Error('OWNER_MODEL_BLOCKED_ON_FINANCE')),80))
  ]);
  assert.equal(model.qty,3);
  assert.equal(model.expense,4000);
  assert.equal(model.selectedShift?.key,'2026-09-07-S1');
  assert.equal(model.finance?.period,'2026-09');
  assert.equal(model.finance?.unavailable,true,'unknown finance must be explicit rather than fabricated zero');

  finance.resolve({period:'2026-09',model:{profit:{netSales:10000,businessExpenses:4000,netProfit:null,cogsKnown:false},ownerCapital:{opening:50000,additional:0,prive:0,calculatedEnding:null},cashPosition:{available:15000}}});
  await flush();await flush();
  const refreshed=await runtime.SJRefinementRoleDashboardV100.ownerModel();
  assert.equal(refreshed.finance?.netSales,10000);
  assert.equal(refreshed.finance?.hppKnown,false);
});

test('R7 owner day capture is keyed by date and never reuses another date day model',async()=>{
  const finance=deferred(),{runtime,dateEl,shiftEl}=runtimeFixture(finance.promise);
  installOwnerDashboardHybrid(runtime);
  const first=await runtime.SJRefinementRoleDashboardV100.ownerModel();
  assert.equal(first.qty,3);
  dateEl.value='2026-09-06';shiftEl.value='S2';shiftEl.selectedOptions=[{textContent:'Shift Siang'}];
  const second=await runtime.SJRefinementRoleDashboardV100.ownerModel();
  assert.equal(second.date,'2026-09-06');
  assert.equal(second.qty,9);
  assert.equal(second.expense,1000);
  assert.equal(second.selectedShift?.key,'2026-09-06-S2');
});

test('R7 owner source uses date-keyed day cache and fast compat is presentation-only',()=>{
  const owner=fs.readFileSync('src/ui/owner-dashboard-hybrid.js','utf8');
  const fast=fs.readFileSync('src/compat/emg-d1-p1-dashboard-fast.js','utf8');
  assert.match(owner,/lastDayByDate\s*=\s*Object\.create\(null\)/);
  assert.doesNotMatch(owner,/let\s+lastDay\s*=\s*null/);
  assert.doesNotMatch(fast,/dashboard\.ownerModel\s*=/);
  assert.doesNotMatch(fast,/dashboard\.renderOwner\s*=/);
  assert.doesNotMatch(fast,/modelCache|prevCache|REFRESH_TTL_MS\s*=\s*5\s*\*\s*60/);
  assert.match(fast,/Data lokal • sedang memperbarui/);
});
