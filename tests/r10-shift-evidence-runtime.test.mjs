import test from 'node:test';
import assert from 'node:assert/strict';
import { installShiftEvidenceV1 } from '../src/ui/shift-evidence-v1.js';

function snap(value){return {val:()=>value}}

function fakeDb({balancesOpen={P1:10},balancesClose={P1:7},refunds={}}={}){
  let inventoryReads=0;
  return {
    ref(path){
      return {
        once:async()=>{
          if(path.endsWith('/global/inventory')){
            inventoryReads++;
            return snap(inventoryReads===1?balancesOpen:balancesClose);
          }
          if(path.endsWith('/global/refunds'))return snap(refunds);
          return snap(null);
        },
        orderByChild(){return this},
        equalTo(){return this}
      };
    }
  };
}

function fakeDocument(){
  return {
    body:{appendChild(){}},
    getElementById(id){
      if(id==='date-sel')return {value:'2026-09-22'};
      if(id==='shift-sel')return {value:'-S1'};
      return null;
    },
    querySelector(){return null},
    createElement(){
      return {
        style:{},
        querySelector(){return null},
        addEventListener(){},
        set innerHTML(v){this._html=v},
        get innerHTML(){return this._html||''}
      };
    }
  };
}

function runtimeFor(db){
  let current={
    tx:{T1:{id:'T1',status:'DONE',items:[{id:'P1',q:3}]}},
    sessions:{SES1:{id:'SES1',status:'ACTIVE'}},
    currentSessionId:'SES1',
    sessionControl:{currentSessionId:'SES1'}
  };
  const writes=[];
  const shift={
    currentData:()=>current,
    currentSessionId:()=> 'SES1',
    renderWithDay(){return true},
    async startShift(){return 'START_OK'},
    async submitClose(){return 'CLOSE_OK'}
  };
  const hardening={
    async verifiedShiftWrite(kind,key,sid,updates){
      writes.push({kind,key,sid,updates});
      return updates;
    }
  };
  const runtime={
    SJShift:shift,
    SJOperationalHardening:hardening,
    firebase:{database:()=>db},
    document:fakeDocument(),
    cloudData:{global:{menu:[{id:'P1',n:'Bakaran',trackStock:true}]}},
    showToast(){},
    console
  };
  return {runtime,shift,hardening,writes,setCurrent:v=>{current=v}};
}

test('runtime augments START with opening system snapshot without replacing existing shift write',async()=>{
  const {runtime,shift,hardening,writes}=runtimeFor(fakeDb());
  const api=installShiftEvidenceV1(runtime);
  assert.equal(api.installed,true);
  assert.equal(await shift.startShift(),'START_OK');
  await hardening.verifiedShiftWrite('START','2026-09-22-S1','SES1',{
    '2026-09-22-S1/sessions/SES1':{id:'SES1',status:'ACTIVE'}
  });
  const u=writes.at(-1).updates;
  assert.equal(u['2026-09-22-S1/sessions/SES1'].status,'ACTIVE');
  assert.equal(u['2026-09-22-S1/sessions/SES1'].stockEvidence.opening.rows.P1.qty,10);
  assert.equal(u['2026-09-22-S1/stockEvidence/opening'].authority,'GLOBAL_INVENTORY_EVIDENCE');
});

test('runtime CLOSE stores summary, preserves closingSnapshot and separates non-sale changes',async()=>{
  const {runtime,shift,hardening,writes,setCurrent}=runtimeFor(fakeDb({
    balancesOpen:{P1:10},
    balancesClose:{P1:9}
  }));
  installShiftEvidenceV1(runtime);

  await shift.startShift();
  await hardening.verifiedShiftWrite('START','2026-09-22-S1','SES1',{
    '2026-09-22-S1/sessions/SES1':{id:'SES1'}
  });
  const opening=writes.at(-1).updates['2026-09-22-S1/stockEvidence/opening'];

  setCurrent({
    tx:{T1:{id:'T1',status:'DONE',items:[{id:'P1',q:3}]}},
    sessions:{SES1:{id:'SES1',status:'ACTIVE',stockEvidence:{opening}}},
    currentSessionId:'SES1',
    sessionControl:{currentSessionId:'SES1'},
    stockEvidence:{opening}
  });

  assert.equal(await shift.submitClose(),'CLOSE_OK');
  await hardening.verifiedShiftWrite('CLOSE','2026-09-22-S1','SES1',{
    '2026-09-22-S1/closingSnapshot':{cash:{actual:100}}
  });

  const u=writes.at(-1).updates;
  const row=u['2026-09-22-S1/stockEvidence/summary'].rows.P1;
  assert.equal(row.openingQty,10);
  assert.equal(row.soldQty,3);
  assert.equal(row.closingSystemQty,9);
  assert.equal(row.nonSaleNetChange,2);
  assert.equal(row.status,'NON_SALE_CHANGE');
  assert.equal(u['2026-09-22-S1/closingSnapshot'].cash.actual,100);
  assert.equal(
    u['2026-09-22-S1/closingSnapshot'].stockEvidence.summary.rows.P1.nonSaleNetChange,
    2
  );
});

test('evidence read failure never blocks existing shift open or close authority',async()=>{
  const badDb={
    ref(){
      return {
        once:async()=>{throw new Error('READ_FAIL')},
        orderByChild(){return this},
        equalTo(){return this}
      };
    }
  };
  const {runtime,shift,hardening,writes}=runtimeFor(badDb);
  installShiftEvidenceV1(runtime);

  assert.equal(await shift.startShift(),'START_OK');
  await hardening.verifiedShiftWrite('START','2026-09-22-S1','SES1',{
    '2026-09-22-S1/sessions/SES1':{id:'SES1'}
  });
  assert.equal(writes.at(-1).updates['2026-09-22-S1/stockEvidence/opening'],undefined);

  assert.equal(await shift.submitClose(),'CLOSE_OK');
  await hardening.verifiedShiftWrite('CLOSE','2026-09-22-S1','SES1',{
    '2026-09-22-S1/closingSnapshot':{cash:{actual:50}}
  });
  assert.equal(writes.at(-1).updates['2026-09-22-S1/closingSnapshot'].cash.actual,50);
});
