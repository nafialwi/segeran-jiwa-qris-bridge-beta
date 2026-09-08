import test from 'node:test';
import assert from 'node:assert/strict';
import { installHistoricalShiftContext } from '../src/ui/sales-shift-ux-refinement.js';
import { createR7ReadCoordinator } from '../src/app/r7-read-coordinator.js';

const deferred=()=>{let resolve,reject;const promise=new Promise((res,rej)=>{resolve=res;reject=rej});return{promise,resolve,reject}};

function fakeDom(){
  const input={value:'',dataset:{},addEventListener(){}};
  const body={innerHTML:'',querySelectorAll(){return[]}};
  const close={addEventListener(){}};const recap={addEventListener(){}};
  const sheet={
    id:'sj-ref-shift-history',className:'',style:{display:'none'},innerHTML:'',dataset:{},
    addEventListener(){},
    querySelector(sel){if(sel==='[data-history-body]')return body;if(sel==='[data-history-date]')return input;if(sel==='[data-history-close]')return close;if(sel==='[data-history-recap]')return recap;return null}
  };
  const dateSelect={value:'2026-09-08'},shiftSelect={value:'-S1',selectedOptions:[{textContent:'Shift Pagi'}]};
  const document={
    body:{appendChild(){document.sheet=sheet}},sheet:null,
    createElement(){return sheet},
    getElementById(id){if(id==='sj-ref-shift-history')return document.sheet;if(id==='date-sel')return dateSelect;if(id==='shift-sel')return shiftSelect;return null},
    querySelector(){return null}
  };
  return{document,sheet,input,body};
}
function closedShift(date,code='S1'){return{[`${date}-${code}`]:{shiftStatus:'CLOSED',openedAt:`${date}T08:00:00+07:00`,closedAt:`${date}T16:00:00+07:00`}}}

test('R7 historical shift A→B→C is latest-wins and stale A/B responses cannot repaint C',async()=>{
  const dom=fakeDom(),calls=[],pending={};
  const readShifts=(runtime,date)=>{calls.push(date);const d=deferred();(pending[date]||(pending[date]=[])).push(d);return d.promise};
  const runtime={document:dom.document,__SJ_SC03_RUNTIME:{guard:{currentRole:()=> 'owner'}},fmt:v=>`Rp ${v}`};
  const history=installHistoricalShiftContext(runtime,{readShifts});
  assert.ok(runtime.__SJ_R7_READ_COORDINATOR,'Shift history installer must ensure the shared R7 coordinator');
  const a=history.renderDate('2026-09-05'),b=history.renderDate('2026-09-06'),c=history.renderDate('2026-09-07');
  assert.equal(dom.input.value,'2026-09-07','latest selection must update immediately even while older reads are pending');
  assert.match(dom.body.innerHTML,/07 Sep 2026|2026-09-07/,'C context/skeleton must be visible immediately');
  pending['2026-09-07'][0].resolve(closedShift('2026-09-07','S3'));await c;
  assert.match(dom.body.innerHTML,/07 Sep 2026/);assert.match(dom.body.innerHTML,/Shift 3/);
  pending['2026-09-05'][0].resolve(closedShift('2026-09-05','S1'));pending['2026-09-06'][0].resolve(closedShift('2026-09-06','S2'));
  await Promise.all([a,b]);
  assert.equal(history.snapshot().selectedDate,'2026-09-07');
  assert.match(dom.body.innerHTML,/07 Sep 2026/);assert.doesNotMatch(dom.body.innerHTML,/05 Sep 2026|06 Sep 2026/);
  assert.deepEqual(calls,['2026-09-05','2026-09-06','2026-09-07']);
});

test('R7 historical shift revisit paints matching-date cache before background refresh resolves',async()=>{
  const dom=fakeDom(),pending=[];
  const readShifts=(runtime,date)=>{const d=deferred();pending.push({date,d});return d.promise};
  const runtime={document:dom.document,__SJ_SC03_RUNTIME:{guard:{currentRole:()=> 'owner'}}};
  const history=installHistoricalShiftContext(runtime,{readShifts});
  const first=history.renderDate('2026-09-04');pending[0].d.resolve(closedShift('2026-09-04','S2'));await first;
  assert.match(dom.body.innerHTML,/04 Sep 2026/);
  const second=history.renderDate('2026-09-04');
  assert.equal(pending.length,2,'revisit may revalidate in background');
  assert.match(dom.body.innerHTML,/04 Sep 2026/);
  assert.match(dom.body.innerHTML,/Data terakhir ditampilkan|sedang memperbarui/);
  pending[1].d.resolve(closedShift('2026-09-04','S2'));await second;
});
