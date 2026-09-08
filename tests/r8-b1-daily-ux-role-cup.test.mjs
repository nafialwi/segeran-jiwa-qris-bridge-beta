import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT=process.cwd();
const modulePath=path.join(ROOT,'src/ui/r8-daily-ux-refinement.js');
const bootstrapPath=path.join(ROOT,'src/app/ref01-bootstrap.js');

async function loadModule(){
  assert.equal(fs.existsSync(modulePath),true,'R8-B1 daily UX module must exist');
  return import(pathToFileURL(modulePath).href+`?t=${Date.now()}`);
}

test('R8-B1 suppresses only duplicate transaction success while receipt is visible',async()=>{
  const {shouldSuppressTransactionSuccessToast}=await loadModule();
  assert.equal(shouldSuppressTransactionSuccessToast({message:'Transaksi SJ-123 berhasil.',kind:'success',receiptVisible:true}),true);
  assert.equal(shouldSuppressTransactionSuccessToast({message:'Transaksi SJ-123 berhasil.',kind:'success',receiptVisible:false}),false);
  assert.equal(shouldSuppressTransactionSuccessToast({message:'Pembelian masuk Gudang.',kind:'success',receiptVisible:true}),false);
  assert.equal(shouldSuppressTransactionSuccessToast({message:'Transaksi SJ-123 berhasil.',kind:'warning',receiptVisible:true}),false);
});

test('R8-B1 cup status is honest and does not fabricate unregistered stock',async()=>{
  const {cupOutletStatusR8}=await loadModule();
  assert.deepEqual(cupOutletStatusR8({registered:false,outletQty:0}),{code:'UNCONFIGURED',label:'Belum dikonfigurasi'});
  assert.deepEqual(cupOutletStatusR8({registered:true,outletQty:0,master:{warningOutlet:5}}),{code:'OUT',label:'Habis'});
  assert.deepEqual(cupOutletStatusR8({registered:true,outletQty:3,master:{warningOutlet:5}}),{code:'LOW',label:'Menipis'});
  assert.deepEqual(cupOutletStatusR8({registered:true,outletQty:8,master:{warningOutlet:5}}),{code:'SAFE',label:'Aman'});
});

test('R8-B1 cashier cup section includes Paper Cup 10 Oz and Gerai quantities',async()=>{
  const {renderCashierCupStockSection}=await loadModule();
  const html=renderCashierCupStockSection([
    {code:'c10',name:'Cup 10 Oz',registered:true,outletQty:12,master:{warningOutlet:5}},
    {code:'c10p',name:'Cup Paper 10 Oz',registered:true,outletQty:7,master:{warningOutlet:3}},
    {code:'c22o',name:'Cup 22 Oz Oval',registered:false,outletQty:0,master:null}
  ]);
  assert.match(html,/Cup &amp; Kemasan/);
  assert.match(html,/Cup 10 Oz/);
  assert.match(html,/Cup Paper 10 Oz/);
  assert.match(html,/12 pcs/);
  assert.match(html,/7 pcs/);
  assert.match(html,/Belum dikonfigurasi/);
  assert.doesNotMatch(html,/Gudang\s*:/i);
  assert.doesNotMatch(html,/Sesuaikan/i);
});

test('R8-B1 cashier stock action policy keeps useful actions and hides owner-only actions',async()=>{
  const {cashierStockActionPolicy}=await loadModule();
  assert.deepEqual(cashierStockActionPolicy(),{
    keepLabels:['Restock','Riwayat'],
    hideLabels:['Penyesuaian','Gudang']
  });
});

test('R8-B1 module remains presentation-only with no Firebase/background-loop primitives',()=>{
  assert.equal(fs.existsSync(modulePath),true,'R8-B1 daily UX module must exist');
  const source=fs.readFileSync(modulePath,'utf8');
  for(const forbidden of [".set(",".update(",".transaction(",".remove(",".on('value'",'.on("value"','setInterval(']){
    assert.equal(source.includes(forbidden),false,`presentation module must not contain ${forbidden}`);
  }
});

test('REF01 bootstrap installs and reconciles R8-B1 module',()=>{
  const source=fs.readFileSync(bootstrapPath,'utf8');
  assert.match(source,/import \{ installR8DailyUxRefinement \} from '\.\.\/ui\/r8-daily-ux-refinement\.js';/);
  assert.match(source,/installR8DailyUxRefinement\(/);
  assert.match(source,/readCupRows:\(\)=>p5Packaging\?\.shiftControl\?\.cupRows\?\.\(\)\|\|\[\]/);
  assert.match(source,/r8DailyUx\?\.enhance\?\.\(\)/);
});
