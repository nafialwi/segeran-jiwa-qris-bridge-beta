import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT=process.cwd();
const modulePath=path.join(ROOT,'src/ui/r8-inventory-safety-refinement.js');
const bootstrapPath=path.join(ROOT,'src/app/ref01-bootstrap.js');

async function loadModule(){
  assert.equal(fs.existsSync(modulePath),true,'R8-B2 inventory safety module must exist');
  return import(pathToFileURL(modulePath).href+`?t=${Date.now()}`);
}

test('R8-B2 physical receipt records actual quantity and variance',async()=>{
  const {planRestockReceiptR8}=await loadModule();
  assert.deepEqual(planRestockReceiptR8({requestedQty:50,receivedQty:48,reason:'2 pcs kurang saat diterima'}),{
    requestedQty:50,receivedQty:48,receiveVariance:-2,receiveReason:'2 pcs kurang saat diterima'
  });
  assert.deepEqual(planRestockReceiptR8({requestedQty:50,receivedQty:50,reason:''}),{
    requestedQty:50,receivedQty:50,receiveVariance:0,receiveReason:''
  });
});

test('R8-B2 physical receipt rejects invalid counts and unexplained variance',async()=>{
  const {planRestockReceiptR8}=await loadModule();
  assert.throws(()=>planRestockReceiptR8({requestedQty:50,receivedQty:48,reason:''}),/RESTOCK_RECEIVE_VARIANCE_REASON_REQUIRED/);
  assert.throws(()=>planRestockReceiptR8({requestedQty:50,receivedQty:-1,reason:'rusak'}),/RESTOCK_RECEIVED_QTY_INVALID/);
  assert.throws(()=>planRestockReceiptR8({requestedQty:0,receivedQty:0}),/RESTOCK_REQUEST_QTY_INVALID/);
});

test('R8-B2 purchase correction reuses Finance cashflow authority instead of new reversal writer',async()=>{
  const {openPurchaseCorrectionR8}=await loadModule();
  const calls=[];
  const runtime={showView:index=>calls.push(['showView',index]),setTimeout:fn=>fn()};
  const financeWorkspace={setSurface:value=>calls.push(['surface',value]),setTab:value=>calls.push(['tab',value]),enhance:()=>calls.push(['enhance'])};
  assert.equal(openPurchaseCorrectionR8(runtime,financeWorkspace),true);
  assert.deepEqual(calls,[['showView',3],['surface','finance'],['tab','cashflow'],['enhance']]);
});

test('R8-B2 module preserves existing atomic/idempotent restock authority markers',()=>{
  assert.equal(fs.existsSync(modulePath),true,'R8-B2 inventory safety module must exist');
  const source=fs.readFileSync(modulePath,'utf8');
  assert.match(source,/receivingAttemptId/);
  assert.match(source,/receivedAttemptId/);
  assert.match(source,/verifiedUpdate/);
  assert.match(source,/ServerValue\.increment|sjServerInc/);
  assert.match(source,/receiveVariance/);
  assert.match(source,/receiveReason/);
  assert.doesNotMatch(source,/setInterval\(/);
});

test('REF01 bootstrap installs and reconciles R8-B2 after Finance and Inventory authorities',()=>{
  const source=fs.readFileSync(bootstrapPath,'utf8');
  assert.match(source,/import \{ installR8InventorySafetyRefinement \} from '\.\.\/ui\/r8-inventory-safety-refinement\.js';/);
  assert.match(source,/installR8InventorySafetyRefinement\(runtime,\{inventoryWorkspace,financeWorkspace/);
  assert.match(source,/r8InventorySafety\?\.enhance\?\.\(\)/);
});
