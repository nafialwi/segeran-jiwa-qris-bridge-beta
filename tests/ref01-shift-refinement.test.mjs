import test from 'node:test';
import assert from 'node:assert/strict';
import { parseShiftKey, shiftPresentation, createStaleShiftAdapter } from '../src/ui/shift-refinement.js';

test('REF-01 parses dated shift identity and flags old open shift as overdue',()=>{
  const parsed=parseShiftKey('2026-08-30-S2');
  assert.deepEqual(parsed,{key:'2026-08-30-S2',date:'2026-08-30',code:'S2',selector:'-S2'});
  const model=shiftPresentation({key:'2026-08-30-S2',data:{shiftStatus:'ACTIVE',openedAt:'2026-08-30T08:00:00+07:00'},now:new Date('2026-08-31T01:00:00+07:00')});
  assert.equal(model.open,true);
  assert.equal(model.overdue,true);
  assert.match(model.durationLabel,/17 jam/);
  assert.equal(model.canOwnerClose,true);
  assert.equal(model.autoClose,false);
});

test('REF-01 closed shift is never marked overdue',()=>{
  const model=shiftPresentation({key:'2026-08-29-S1',data:{locked:true,closedAt:'2026-08-29T12:00:00+07:00'},now:new Date('2026-08-31T01:00:00+07:00')});
  assert.equal(model.open,false);
  assert.equal(model.overdue,false);
  assert.equal(model.canOwnerClose,false);
});

test('REF-01 stale-shift adapter navigates old shift into existing SJShift close authority without creating a shift',()=>{
  const els={
    'date-sel':{value:''},
    'shift-sel':{value:''}
  };
  const calls=[];
  const runtime={
    document:{getElementById:id=>els[id]||null},
    changeDateAndShift(){calls.push('changeDateAndShift')},
    showView(n){calls.push(['showView',n])},
    openOpr(n){calls.push(['openOpr',n])},
    SJShift:{render(){calls.push('render')},openCloseModal(){calls.push('openCloseModal')}}
  };
  const adapter=createStaleShiftAdapter(runtime);
  adapter.openClosing('2026-08-30-S1');
  assert.equal(els['date-sel'].value,'2026-08-30');
  assert.equal(els['shift-sel'].value,'-S1');
  assert.deepEqual(calls,['changeDateAndShift',['showView',2],['openOpr',1],'render','openCloseModal']);
  assert.equal(calls.some(x=>String(x).includes('startShift')),false);
});
