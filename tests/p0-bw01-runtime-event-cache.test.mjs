import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {installQrisDeferredSettlementRuntime} from '../src/app/qris-deferred-settlement-bootstrap.js';
import {qrisPath} from '../src/data/firebase-client.js';

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const sha=path=>createHash('sha256').update(readFileSync(join(ROOT,path))).digest('hex');

function makeDb(){
  let onCalls=0,fullPendingOnce=0,fullSignalOnce=0,childOnce=0;
  const pendingPath=qrisPath('pending'),signalPath=qrisPath('signals');
  const data={
    [pendingPath]:{
      p1:{pendingId:'p1',cashierId:'kasir01',status:'WAITING_QRIS',parkedAt:10},
      p2:{pendingId:'p2',cashierId:'kasir02',status:'MATCHED',parkedAt:20},
      old1:{pendingId:'old1',cashierId:'kasir01',status:'CANCELLED',parkedAt:1}
    },
    [signalPath]:{
      s1:{providerTransactionId:'s1',status:'LATE_AFTER_CANCEL',resolutionState:'REVIEW_REQUIRED',autoMatchBlocked:true,lateCandidatePendingIds:['old1'],lateDetectedAt:30},
      s2:{providerTransactionId:'s2',status:'SETTLED',resolutionState:'DONE',autoMatchBlocked:false,lateCandidatePendingIds:[],lateDetectedAt:40}
    }
  };
  const snapshot=value=>({val:()=>structuredClone(value)});
  function ref(path){
    let orderChild=null,equalValue;
    const query={
      orderByChild(value){orderChild=value;return query},
      equalTo(value){equalValue=value;return query},
      on(event,cb){
        assert.equal(event,'value');onCalls++;
        const base=data[path]||{};
        const filtered=Object.fromEntries(Object.entries(base).filter(([,row])=>row?.[orderChild]===equalValue));
        queueMicrotask(()=>cb(snapshot(filtered)));
        return cb;
      },
      off(){},
      async once(event){
        assert.equal(event,'value');
        if(path===pendingPath)fullPendingOnce++;
        else if(path===signalPath)fullSignalOnce++;
        else childOnce++;
        if(path.startsWith(pendingPath+'/'))return snapshot(data[pendingPath][path.slice(pendingPath.length+1)]??null);
        if(path.startsWith(signalPath+'/'))return snapshot(data[signalPath][path.slice(signalPath.length+1)]??null);
        return snapshot(data[path]||{});
      }
    };
    return query;
  }
  return {db:{ref},stats:()=>({onCalls,fullPendingOnce,fullSignalOnce,childOnce})};
}

test('P0-BW01 preserves frozen QRIS compat/manual modules byte-for-byte',()=>{
  assert.equal(sha('src/compat/rc01-qris-deferred-settlement-compat.js'),'d24646468e7d8595ff1b356d9ba6a6f732efd1e40f02e8f6c28f924a39a7e355');
  assert.equal(sha('src/compat/rc01-qris-manual-bypass.js'),'80d867cca96a0f4b5dfdc2012e51f9e53da999ed4df9e09d4c6aeb7f87363156');
});

test('P0-BW01 serves repeated frozen refresh calls from event cache instead of full pending/signals scans',async()=>{
  const {db,stats}=makeDb();
  const api=installQrisDeferredSettlementRuntime({}, {db,writer:{}});
  assert.deepEqual((await api.findOwnedUnresolvedParked('kasir01')).map(row=>row.pendingId),['p1']);
  assert.deepEqual((await api.findLateReviewSignals('kasir01')).map(row=>row.providerTransactionId),['s1']);
  assert.deepEqual(stats(),{onCalls:5,fullPendingOnce:0,fullSignalOnce:0,childOnce:1});
  await api.findOwnedUnresolvedParked('kasir01');
  await api.findLateReviewSignals('kasir01');
  assert.deepEqual(stats(),{onCalls:5,fullPendingOnce:0,fullSignalOnce:0,childOnce:1});
});

test('P0-BW01 bootstrap stays inside SC03/SC04 no-direct-mutation boundary',()=>{
  const source=readFileSync(join(ROOT,'src/app/qris-deferred-settlement-bootstrap.js'),'utf8');
  const directMutation=/\.(?:set|update|transaction|remove)\s*\(/;
  assert.equal(directMutation.test(source),false,'src/app bootstrap must not contain .set/.update/.transaction/.remove calls');
});
