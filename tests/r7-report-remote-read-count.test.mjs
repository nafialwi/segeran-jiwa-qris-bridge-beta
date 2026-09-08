import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createCanonicalReportController } from '../src/ui/report-refinement.js';
import { createOwnerDashboardNavigator } from '../src/ui/owner-dashboard-hybrid.js';

function controllerFixture(){
  let opens=0,html='';
  const root={set innerHTML(v){html=v},get innerHTML(){return html}};
  const state={model:null,period:null};
  const report={
    state,
    selectPeriod({explicit}){state.period={preset:'custom',start:new Date(`${explicit.from}T00:00:00+07:00`).getTime(),end:new Date(`${explicit.to}T23:59:59.999+07:00`).getTime(),label:explicit.from}},
    async open(){opens++;state.model={period:{...state.period},summary:{period:{...state.period}},transactions:[],expenses:[],shifts:[]};return'summary'},
    Core:{summary(){return{period:{...state.period}}},renderOwnerSummary(){return'<main>LOCAL</main>'}}
  };
  const runtime={document:{getElementById(id){return id==='lap-menu-view'?root:id==='lap-container-view'?{style:{}}:id==='date-sel'?{value:'2026-09-07'}:id==='shift-sel'?{value:'S1'}:null}}};
  return{runtime,report,get opens(){return opens},root};
}

test('R7 report applyScope performs exactly one remote report.open and rerenderLocal performs zero',async()=>{
  const f=controllerFixture(),controller=createCanonicalReportController({runtime:f.runtime,report:f.report});
  await controller.applyScope('day',{anchorDate:'2026-09-07'});
  assert.equal(f.opens,1);
  controller.setFilter('metric','transactions');
  controller.rerenderLocal();
  controller.setFilter('topSort','revenue');
  controller.rerenderLocal();
  assert.equal(f.opens,1);
  assert.match(f.root.innerHTML,/Laporan Penjualan/);
});

test('R7 owner dashboard report navigation does not request a second remote rerender',async()=>{
  let apply=0,remoteRerender=0,localRerender=0;
  const runtime={
    showView(){},
    document:{getElementById(id){if(id==='date-sel')return{value:'2026-09-07'};if(id==='shift-sel')return{value:'S1',selectedOptions:[{textContent:'Shift Pagi'}]};return null}},
    __SJ_V29_REPORT_CONTROLLER:{
      prepareScope(){apply++},setFilter(){},async openRemote(){remoteRerender++},rerenderLocal(){localRerender++}
    }
  };
  const navigate=createOwnerDashboardNavigator(runtime);
  await navigate('sales-report');
  assert.equal(apply,1);
  assert.equal(remoteRerender,1);
  assert.equal(localRerender,1,'shift selection may repaint locally after the single remote scope load');
});

test('R7 report interaction source routes metric/top/filter changes to rerenderLocal',()=>{
  const source=fs.readFileSync('src/ui/report-refinement.js','utf8');
  assert.match(source,/data-v29-metric[\s\S]{0,260}rerenderLocal\s*\(/);
  assert.match(source,/data-v29-top-sort[\s\S]{0,260}rerenderLocal\s*\(/);
  assert.match(source,/dataset\?\.v29Filter[\s\S]{0,260}rerenderLocal\s*\(/);
});
