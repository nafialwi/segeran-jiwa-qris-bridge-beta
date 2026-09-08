import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const ROOT=process.cwd();
const modulePath=path.join(ROOT,'src/ui/r8-shift-closing-integrity.js');
const bootstrapPath=path.join(ROOT,'src/app/ref01-bootstrap.js');

async function loadModule(){
  assert.equal(fs.existsSync(modulePath),true,'R8-B3 closing integrity module must exist');
  return import(pathToFileURL(modulePath).href+`?t=${Date.now()}`);
}

test('R8-B3 carry-forward uses only the immediately previous closed shift actual cash',async()=>{
  const {previousShiftClosingCashR8}=await loadModule();
  const rows={
    '-S1':{shiftStatus:'CLOSED',uangLaci:500000,closingSnapshot:{cash:{actual:500000}}},
    '-S2':{shiftStatus:'CLOSED',uangLaci:475000},
    '-S3':{shiftStatus:'NOT_STARTED'}
  };
  assert.deepEqual(previousShiftClosingCashR8(rows,'-S2'),{shift:'-S1',cash:500000});
  assert.deepEqual(previousShiftClosingCashR8(rows,'-S3'),{shift:'-S2',cash:475000});
  assert.equal(previousShiftClosingCashR8(rows,'-S1'),null);
  assert.equal(previousShiftClosingCashR8({'-S1':{shiftStatus:'ACTIVE',uangLaci:500000}},'-S2'),null);
});

test('R8-B3 opening continuity requires explanation, not forced balancing',async()=>{
  const {openingContinuityR8}=await loadModule();
  assert.deepEqual(openingContinuityR8({carryForward:500000,openingCash:500000,note:''}),{difference:0,requiresNote:false});
  assert.deepEqual(openingContinuityR8({carryForward:500000,openingCash:400000,note:''}),{difference:-100000,requiresNote:true});
  assert.deepEqual(openingContinuityR8({carryForward:500000,openingCash:400000,note:'Rp100.000 disetor Owner'}),{difference:-100000,requiresNote:false});
  assert.deepEqual(openingContinuityR8({carryForward:null,openingCash:400000,note:''}),{difference:null,requiresNote:false});
});

test('R8-B3 physical closing gate requires cash and every enabled cup count before reveal',async()=>{
  const {physicalClosingGateR8}=await loadModule();
  assert.deepEqual(physicalClosingGateR8({cashValue:'',cupValues:{c10:'5'}}),{ready:false,code:'CASH_REQUIRED'});
  assert.deepEqual(physicalClosingGateR8({cashValue:'500.000',cupValues:{c10:'5',c10p:''}}),{ready:false,code:'CUP_REQUIRED',cupCode:'c10p'});
  assert.deepEqual(physicalClosingGateR8({cashValue:'500.000',cupValues:{c10:'5',c10p:'0'}}),{ready:true,code:'READY'});
});

test('R8-B3 stays presentation/validation-only and never adds closing persistence',()=>{
  assert.equal(fs.existsSync(modulePath),true,'R8-B3 closing integrity module must exist');
  const source=fs.readFileSync(modulePath,'utf8');
  for(const forbidden of ['.set(','.update(','.transaction(','verifiedShiftWrite(','firebase.database(']){
    assert.equal(source.includes(forbidden),false,`B3 must not add persistence primitive ${forbidden}`);
  }
  assert.match(source,/KUNCI HITUNGAN FISIK/);
  assert.match(source,/sjshift-close-session-exp/);
  assert.match(source,/data-v34-cup-closing/);
});

test('REF01 installs R8-B3 after P5 cup authority and reconciles it last',()=>{
  const source=fs.readFileSync(bootstrapPath,'utf8');
  assert.match(source,/import \{ installR8ShiftClosingIntegrity \} from '\.\.\/ui\/r8-shift-closing-integrity\.js';/);
  assert.match(source,/installR8ShiftClosingIntegrity\(runtime,\{cupShiftControl:p5Packaging\?\.shiftControl/);
  assert.match(source,/r8ShiftClosing\?\.enhance\?\.\(\)/);
});
